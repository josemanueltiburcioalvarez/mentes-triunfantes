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
  // "No sé": pide confirmar antes de pasar la pregunta sin responder
  const [confirmandoSalto, setConfirmandoSalto] = useState(false);

  const preguntaActual = preguntas[indice];

  function manejarRespuesta(r: RespuestaPregunta) {
    if (retroalimentacion) return;
    const esCorrecto = r.valor === preguntaActual.respuesta;
    if (esCorrecto) setCorrectos((c) => c + 1);
    setRetroalimentacion({ correcto: esCorrecto, respuestaCorrecta: textoRespuesta(preguntaActual), detalle: r.detalle });
  }

  async function siguiente() {
    setConfirmandoSalto(false);
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
          {preguntas.length} preguntas para saber con qué nivel empezar: van de lo fácil a lo difícil. Resuélvelas a
          mano, en papel, y escribe solo el resultado. Es normal no saber algunas: si no sabes una, pulsa «No sé» y
          pasa a la siguiente.
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
          modo="directo"
          bloqueado={retroalimentacion !== null}
          enviando={false}
          onResponder={manejarRespuesta}
        />

        {!retroalimentacion && (
          <div className="mt-6 flex w-full flex-col items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {!confirmandoSalto ? (
              <button
                type="button"
                onClick={() => setConfirmandoSalto(true)}
                disabled={enviando}
                className="text-sm text-zinc-500 underline-offset-2 hover:underline disabled:opacity-50 dark:text-zinc-400"
              >
                {indice >= preguntas.length - 1 ? "No sé, terminar el examen" : "No sé, pasar a la siguiente"}
              </button>
            ) : (
              <>
                <p className="max-w-xs text-sm text-zinc-600 dark:text-zinc-300">
                  Pasarás sin responder y esta pregunta contará como incorrecta.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={siguiente}
                    disabled={enviando}
                    className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {enviando ? "Un momento..." : "Sí, pasar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoSalto(false)}
                    disabled={enviando}
                    className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

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
