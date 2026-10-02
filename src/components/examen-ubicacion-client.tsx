"use client";

import { useState } from "react";
import { generarExamenUbicacion, textoRespuesta, type EjercicioConDigito } from "@/lib/ejercicios/generador";
import { registrarExamenUbicacion } from "@/app/(app)/acciones";
import Pregunta, { type RespuestaPregunta } from "@/components/pregunta";
import { BOTON_RESPONDER } from "@/components/tipos-pregunta";

export default function ExamenUbicacionClient({ modalidad }: { modalidad: "primaria" | "secundaria" }) {
  const [preguntas] = useState<EjercicioConDigito[]>(() => generarExamenUbicacion(modalidad));
  const [empezado, setEmpezado] = useState(false);
  const [indice, setIndice] = useState(0);
  const [correctos, setCorrectos] = useState(0);
  const [retroalimentacion, setRetroalimentacion] = useState<
    { correcto: boolean; respuestaCorrecta: string; detalle?: string } | null
  >(null);
  const [terminado, setTerminado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [nivelNombre, setNivelNombre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preguntaActual = preguntas[indice];

  function manejarRespuesta(r: RespuestaPregunta) {
    if (retroalimentacion) return;
    const esCorrecto = r.valor === preguntaActual.respuesta;
    if (esCorrecto) setCorrectos((c) => c + 1);
    setRetroalimentacion({ correcto: esCorrecto, respuestaCorrecta: textoRespuesta(preguntaActual), detalle: r.detalle });
  }

  async function siguiente() {
    if (indice >= preguntas.length - 1) {
      setEnviando(true);
      setError(null);
      const r = await registrarExamenUbicacion(correctos);
      setEnviando(false);
      if (r.error) {
        setError(r.error);
        return;
      }
      setNivelNombre(r.nivelNombre ?? null);
      setTerminado(true);
      return;
    }
    setIndice((i) => i + 1);
    setRetroalimentacion(null);
  }

  if (!empezado) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Examen de ubicación</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {preguntas.length} preguntas para saber con qué nivel empezar. Resuélvelas a mano, con calma — no
          necesitas haber visto todos los temas todavía, es normal no saber algunas.
        </p>
        <button onClick={() => setEmpezado(true)} className={BOTON_RESPONDER}>
          Comenzar
        </button>
      </div>
    );
  }

  if (terminado) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">¡Listo!</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {correctos} de {preguntas.length} correctas
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {nivelNombre
            ? `Vas a empezar practicando en el nivel ${nivelNombre}. Si hay algo de niveles anteriores que no manejes del todo, también puedes practicarlo.`
            : "Tu resultado quedó registrado."}
        </p>
        <a
          href="/dashboard"
          className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Ir a mi panel
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>Examen de ubicación</span>
        <span>
          {indice + 1} / {preguntas.length}
        </span>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-4 text-center sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Pregunta
          key={indice}
          ejercicio={preguntaActual}
          bloqueado={retroalimentacion !== null}
          enviando={false}
          onResponder={manejarRespuesta}
        />

        {error && (
          <p role="alert" className="mt-4 max-w-xs text-sm text-red-600">
            {error}
          </p>
        )}

        {retroalimentacion && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <p
              className={`text-lg font-medium ${
                retroalimentacion.correcto ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {retroalimentacion.correcto ? "¡Correcto!" : `Incorrecto. Era ${retroalimentacion.respuestaCorrecta}`}
            </p>
            <button onClick={siguiente} disabled={enviando} className={BOTON_RESPONDER}>
              {enviando ? "Un momento..." : indice >= preguntas.length - 1 ? "Ver resultado" : "Siguiente"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
