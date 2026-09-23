"use client";

import { useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import {
  generarExamenHabilidad,
  type EjercicioConDigito,
  type HabilidadBasica,
} from "@/lib/ejercicios/generador";
import Pregunta, { type RespuestaPregunta } from "@/components/pregunta";

interface Props {
  habilidadId: string;
  nombreHabilidad: HabilidadBasica;
  tituloHabilidad: string;
  estudianteId: string;
  notaAprobacion: number;
  meetUrl: string;
}

const BOTON =
  "rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export default function ExamenClient({
  habilidadId,
  nombreHabilidad,
  tituloHabilidad,
  estudianteId,
  notaAprobacion,
  meetUrl,
}: Props) {
  const supabase = crearClienteNavegador();

  const [preguntas] = useState<EjercicioConDigito[]>(() => generarExamenHabilidad(nombreHabilidad));
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);

  const [indice, setIndice] = useState(0);
  const [inicioPregunta, setInicioPregunta] = useState<number>(0);
  const [retroalimentacion, setRetroalimentacion] = useState<
    { correcto: boolean; respuestaCorrecta: number } | null
  >(null);
  const [enviando, setEnviando] = useState(false);

  const [correctos, setCorrectos] = useState(0);
  const [terminado, setTerminado] = useState(false);

  const preguntaActual = preguntas[indice];

  async function comenzar() {
    setIniciando(true);
    const { data, error } = await supabase
      .from("sesiones")
      .insert({
        estudiante_id: estudianteId,
        habilidad_id: habilidadId,
        tipo: "evaluacion_habilidad",
      })
      .select("id")
      .single();

    if (error || !data) {
      setErrorSesion(
        "No se pudo iniciar el examen. Puede que tu autorización ya se haya usado; pide una nueva a tu profesor."
      );
      setIniciando(false);
      return;
    }
    setSesionId(data.id);
    setInicioPregunta(Date.now());
    setIniciando(false);
  }

  async function manejarRespuesta(r: RespuestaPregunta) {
    if (!sesionId || retroalimentacion) return;

    const esCorrecto = r.valor === preguntaActual.respuesta;
    const segundos = Math.max(0, (Date.now() - inicioPregunta) / 1000);

    setEnviando(true);
    const { error } = await supabase.from("intentos").insert({
      sesion_id: sesionId,
      estudiante_id: estudianteId,
      habilidad_id: habilidadId,
      dificultad: preguntaActual.digito,
      enunciado: preguntaActual.enunciado,
      respuesta_correcta: String(preguntaActual.respuesta),
      respuesta_dada: r.respuestaDada,
      es_correcto: esCorrecto,
      segundos,
      pasos: r.pasos,
    });
    setEnviando(false);

    if (error) {
      setErrorSesion("No se pudo guardar tu respuesta. Avisa a tu profesor.");
      return;
    }

    if (esCorrecto) setCorrectos((c) => c + 1);
    setRetroalimentacion({ correcto: esCorrecto, respuestaCorrecta: preguntaActual.respuesta });
  }

  async function siguiente() {
    if (indice >= preguntas.length - 1) {
      if (sesionId) {
        await supabase.from("sesiones").update({ fin: new Date().toISOString() }).eq("id", sesionId);
      }
      setTerminado(true);
      return;
    }
    setIndice((i) => i + 1);
    setRetroalimentacion(null);
    setInicioPregunta(Date.now());
  }

  if (errorSesion) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="max-w-sm text-sm text-red-600">{errorSesion}</p>
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
    const puntaje = Math.round((correctos / preguntas.length) * 100);
    const aprobado = puntaje >= notaAprobacion;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {aprobado ? "¡Examen aprobado! 🎉" : "No alcanzó"}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {correctos} de {preguntas.length} correctas ({puntaje}%)
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {aprobado
            ? "Se desbloqueó la siguiente habilidad."
            : `Necesitas ${notaAprobacion}% para aprobar. Solicita otro examen a tu profesor cuando quieras volver a intentarlo.`}
        </p>
        <div className="mt-2 flex gap-3">
          <Link href="/dashboard" className={BOTON}>
            Ir al panel
          </Link>
          <Link
            href={`/practicar/${nombreHabilidad}`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Volver al mapa
          </Link>
        </div>
      </div>
    );
  }

  if (!sesionId) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Examen final de {tituloHabilidad}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {preguntas.length} preguntas · {notaAprobacion}% para aprobar. Resuélvelas a mano, en papel, con la
          cámara encendida en la reunión de Meet.
        </p>
        <a
          href={meetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Abrir reunión de Meet
        </a>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Al comenzar se usa tu autorización: no se puede reiniciar sin pedir otra.
        </p>
        <button onClick={comenzar} disabled={iniciando} className={BOTON}>
          {iniciando ? "Iniciando..." : "Comenzar examen"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
      <div className="mb-6 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>Examen final de {tituloHabilidad}</span>
        <span>
          {indice + 1} / {preguntas.length}
        </span>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Pregunta
          key={indice}
          ejercicio={preguntaActual}
          bloqueado={retroalimentacion !== null}
          enviando={enviando}
          onResponder={manejarRespuesta}
        />

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
            <button onClick={siguiente} className={BOTON}>
              {indice >= preguntas.length - 1 ? "Ver resultado" : "Siguiente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
