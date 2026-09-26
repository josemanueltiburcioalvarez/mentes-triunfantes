"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import {
  generarEjercicioNuevo,
  textoRespuesta,
  type EjercicioGenerado,
  type HabilidadPracticable,
} from "@/lib/ejercicios/generador";
import Pregunta, { type RespuestaPregunta } from "@/components/pregunta";

const TOTAL_EJERCICIOS = 10;

interface Props {
  habilidadId: string;
  nombreHabilidad: HabilidadPracticable;
  tituloHabilidad: string;
  estudianteId: string;
  digito: number;
  numeroEjercicio: number;
  descripcionDigito: string;
  notaAprobacion: number;
}

export default function SetPracticaClient({
  habilidadId,
  nombreHabilidad,
  tituloHabilidad,
  estudianteId,
  digito,
  numeroEjercicio,
  descripcionDigito,
  notaAprobacion,
}: Props) {
  const supabase = crearClienteNavegador();

  const [sesionId, setSesionId] = useState<string | null>(null);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);

  const [ejercicio, setEjercicio] = useState<EjercicioGenerado | null>(null);
  const [numeroPregunta, setNumeroPregunta] = useState(1);
  const [inicioEjercicio, setInicioEjercicio] = useState<number>(0);

  const [retroalimentacion, setRetroalimentacion] = useState<
    { correcto: boolean; respuestaCorrecta: string; detalle?: string } | null
  >(null);
  const [enviando, setEnviando] = useState(false);
  // enunciados ya vistos en este set, para no repetir ejercicios
  const vistos = useRef(new Set<string>());
  // aviso no bloqueante cuando no se pudo guardar una respuesta o el cierre de la sesion
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  const [correctos, setCorrectos] = useState(0);
  const [terminado, setTerminado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function iniciarSesion() {
      const { data, error } = await supabase
        .from("sesiones")
        .insert({
          estudiante_id: estudianteId,
          habilidad_id: habilidadId,
          tipo: "practica",
          digito,
          numero_ejercicio: numeroEjercicio,
        })
        .select("id")
        .single();

      if (cancelado) return;
      if (error || !data) {
        setErrorSesion("No se pudo iniciar la sesión de práctica. Intenta de nuevo.");
        return;
      }
      setSesionId(data.id);
      setEjercicio(generarEjercicioNuevo(nombreHabilidad, digito, vistos.current));
      setInicioEjercicio(Date.now());
    }
    iniciarSesion();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manejarRespuesta(r: RespuestaPregunta) {
    if (!ejercicio || !sesionId || retroalimentacion) return;

    const esCorrecto = r.valor === ejercicio.respuesta;
    const segundos = Math.max(0, (Date.now() - inicioEjercicio) / 1000);

    setEnviando(true);
    setErrorGuardado(null);
    const { error } = await supabase.from("intentos").insert({
      sesion_id: sesionId,
      estudiante_id: estudianteId,
      habilidad_id: habilidadId,
      dificultad: digito,
      enunciado: ejercicio.enunciado,
      respuesta_correcta: textoRespuesta(ejercicio),
      respuesta_dada: r.respuestaDada,
      es_correcto: esCorrecto,
      segundos,
      pasos: r.pasos,
    });
    setEnviando(false);

    if (error) {
      setErrorGuardado("No se pudo guardar tu respuesta. Revisa tu conexión y vuelve a pulsar Responder.");
      return;
    }

    if (esCorrecto) setCorrectos((c) => c + 1);
    setRetroalimentacion({ correcto: esCorrecto, respuestaCorrecta: textoRespuesta(ejercicio), detalle: r.detalle });
  }

  async function siguiente() {
    if (numeroPregunta >= TOTAL_EJERCICIOS) {
      if (sesionId) {
        setEnviando(true);
        setErrorGuardado(null);
        const { data, error } = await supabase
          .from("sesiones")
          .update({ fin: new Date().toISOString() })
          .eq("id", sesionId)
          .select("id");
        setEnviando(false);
        if (error || !data || data.length === 0) {
          setErrorGuardado("No se pudo guardar tu resultado. Revisa tu conexión y pulsa de nuevo «Ver resultado».");
          return;
        }
      }
      setTerminado(true);
      return;
    }
    setErrorGuardado(null);
    setNumeroPregunta((n) => n + 1);
    setEjercicio(generarEjercicioNuevo(nombreHabilidad, digito, vistos.current));
    setRetroalimentacion(null);
    setInicioEjercicio(Date.now());
  }

  if (errorSesion) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-600">{errorSesion}</p>
        <Link
          href={`/practicar/${nombreHabilidad}`}
          className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Volver
        </Link>
      </div>
    );
  }

  if (terminado) {
    const puntaje = Math.round((correctos / TOTAL_EJERCICIOS) * 100);
    const aprobado = puntaje >= notaAprobacion;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {aprobado ? "¡Aprobado!" : "Casi..."}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {correctos} de {TOTAL_EJERCICIOS} correctas ({puntaje}%)
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {aprobado
            ? "Ya puedes seguir con el siguiente ejercicio."
            : `Necesitas ${notaAprobacion}% para aprobar. Vuelve a intentarlo.`}
        </p>
        <Link
          href={`/practicar/${nombreHabilidad}`}
          className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Volver al mapa de {tituloHabilidad}
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
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          {tituloHabilidad} · Dígito {digito} · Ejercicio {numeroEjercicio}
        </span>
        <span>
          {numeroPregunta} / {TOTAL_EJERCICIOS}
        </span>
      </div>
      <p className="mb-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
        {descripcionDigito} ·{" "}
        <Link
          href={`/guia/${nombreHabilidad}/1`}
          target="_blank"
          className="text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
        >
          ¿Necesitas ayuda? Ver guía
        </Link>
      </p>

      <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 text-center sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Pregunta
          key={numeroPregunta}
          ejercicio={ejercicio}
          bloqueado={retroalimentacion !== null}
          enviando={enviando}
          onResponder={manejarRespuesta}
        />

        {errorGuardado && (
          <p role="alert" className="mt-4 max-w-xs text-sm text-red-600">
            {errorGuardado}
          </p>
        )}

        {retroalimentacion && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <p
              className={`text-lg font-medium ${
                retroalimentacion.correcto ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {retroalimentacion.correcto
                ? "¡Correcto!"
                : `Incorrecto. Era ${retroalimentacion.respuestaCorrecta}`}
            </p>
            {retroalimentacion.detalle && (
              <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">{retroalimentacion.detalle}</p>
            )}
            <button
              onClick={siguiente}
              disabled={enviando}
              className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {numeroPregunta >= TOTAL_EJERCICIOS ? "Ver resultado" : "Siguiente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
