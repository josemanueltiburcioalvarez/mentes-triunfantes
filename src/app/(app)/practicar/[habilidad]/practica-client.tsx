"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import {
  generarEjercicio,
  type EjercicioGenerado,
  type HabilidadBasica,
} from "@/lib/ejercicios/generador";

const TOTAL_EJERCICIOS = 10;

interface Props {
  habilidadId: string;
  nombreHabilidad: HabilidadBasica;
  tituloHabilidad: string;
  estudianteId: string;
  dificultadInicial: number;
}

function siguienteDificultad(dificultad: number, ultimosResultados: boolean[]): number {
  const ultimos3 = ultimosResultados.slice(-3);
  const ultimos2 = ultimosResultados.slice(-2);
  if (ultimos3.length === 3 && ultimos3.every(Boolean)) return Math.min(10, dificultad + 1);
  if (ultimos2.length === 2 && ultimos2.every((r) => !r)) return Math.max(1, dificultad - 1);
  return dificultad;
}

export default function PracticaClient({
  habilidadId,
  nombreHabilidad,
  tituloHabilidad,
  estudianteId,
  dificultadInicial,
}: Props) {
  const supabase = crearClienteNavegador();

  const [sesionId, setSesionId] = useState<string | null>(null);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);

  const [dificultad, setDificultad] = useState(dificultadInicial);
  const [historial, setHistorial] = useState<boolean[]>([]);
  const [ejercicio, setEjercicio] = useState<EjercicioGenerado | null>(null);
  const [numeroEjercicio, setNumeroEjercicio] = useState(1);
  const [inicioEjercicio, setInicioEjercicio] = useState<number>(0);

  const [respuesta, setRespuesta] = useState("");
  const [retroalimentacion, setRetroalimentacion] = useState<
    { correcto: boolean; respuestaCorrecta: number } | null
  >(null);
  const [enviando, setEnviando] = useState(false);

  const [correctosSesion, setCorrectosSesion] = useState(0);
  const [sesionTerminada, setSesionTerminada] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function iniciarSesion() {
      const { data, error } = await supabase
        .from("sesiones")
        .insert({ estudiante_id: estudianteId, habilidad_id: habilidadId, tipo: "practica" })
        .select("id")
        .single();

      if (cancelado) return;
      if (error || !data) {
        setErrorSesion("No se pudo iniciar la sesión de práctica. Intenta de nuevo.");
        return;
      }
      setSesionId(data.id);
      setEjercicio(generarEjercicio(nombreHabilidad, dificultadInicial));
      setInicioEjercicio(Date.now());
    }
    iniciarSesion();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!ejercicio || !sesionId || retroalimentacion) return;

    const numerico = Number(respuesta.replace(",", "."));
    const esCorrecto = numerico === ejercicio.respuesta;
    const segundos = Math.max(0, (Date.now() - inicioEjercicio) / 1000);

    setEnviando(true);
    const { error } = await supabase.from("intentos").insert({
      sesion_id: sesionId,
      estudiante_id: estudianteId,
      habilidad_id: habilidadId,
      dificultad,
      enunciado: ejercicio.enunciado,
      respuesta_correcta: String(ejercicio.respuesta),
      respuesta_dada: respuesta,
      es_correcto: esCorrecto,
      segundos,
    });
    setEnviando(false);

    if (error) {
      setErrorSesion("No se pudo guardar tu respuesta. Intenta de nuevo.");
      return;
    }

    const nuevoHistorial = [...historial, esCorrecto].slice(-3);
    setHistorial(nuevoHistorial);
    setDificultad(siguienteDificultad(dificultad, nuevoHistorial));
    if (esCorrecto) setCorrectosSesion((c) => c + 1);
    setRetroalimentacion({ correcto: esCorrecto, respuestaCorrecta: ejercicio.respuesta });
  }

  async function siguiente() {
    if (numeroEjercicio >= TOTAL_EJERCICIOS) {
      if (sesionId) {
        await supabase.from("sesiones").update({ fin: new Date().toISOString() }).eq("id", sesionId);
      }
      setSesionTerminada(true);
      return;
    }
    setNumeroEjercicio((n) => n + 1);
    setEjercicio(generarEjercicio(nombreHabilidad, dificultad));
    setRespuesta("");
    setRetroalimentacion(null);
    setInicioEjercicio(Date.now());
  }

  if (errorSesion) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-600">{errorSesion}</p>
        <Link href="/dashboard" className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400">
          Volver al panel
        </Link>
      </div>
    );
  }

  if (sesionTerminada) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">¡Sesión completa!</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {correctosSesion} de {TOTAL_EJERCICIOS} correctas
        </p>
        <Link
          href="/dashboard"
          className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  if (!ejercicio) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
      <div className="mb-6 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>{tituloHabilidad}</span>
        <span>
          {numeroEjercicio} / {TOTAL_EJERCICIOS}
        </span>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-6 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {ejercicio.enunciado}
        </p>

        {!retroalimentacion ? (
          <form onSubmit={manejarEnvio} className="flex flex-col items-center gap-4">
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-center text-xl outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <button
              type="submit"
              disabled={enviando || respuesta === ""}
              className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Responder
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p
              className={`text-lg font-medium ${
                retroalimentacion.correcto ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {retroalimentacion.correcto
                ? "¡Correcto!"
                : `Incorrecto. Era ${retroalimentacion.respuestaCorrecta}`}
            </p>
            <button
              onClick={siguiente}
              className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {numeroEjercicio >= TOTAL_EJERCICIOS ? "Ver resumen" : "Siguiente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
