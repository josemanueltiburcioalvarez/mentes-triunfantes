"use client";

import { useState } from "react";
import type { EjercicioGenerado } from "@/lib/ejercicios/generador";
import { NO_EXISTE } from "@/lib/ejercicios/enteros";
import { BOTON_RESPONDER, type PropsComunes } from "./tipos-pregunta";

const CAMPO =
  "h-12 w-36 rounded-lg border border-zinc-300 px-3 text-center font-mono text-xl outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800";

// En los examenes el estudiante resuelve en papel y escribe solo el resultado: sin casilleros de
// llevadas ni pasos guiados (esos son para la practica).
function limpiar(texto: string): string {
  return texto.replace(/[^\d,.\-−]/g, "").replace(/^-/, "−").slice(0, 12);
}

function aNumero(texto: string): number {
  return Number(texto.replace("−", "-").replace(",", "."));
}

export default function RespuestaDirecta({
  ejercicio,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { ejercicio: EjercicioGenerado }) {
  const [respuesta, setRespuesta] = useState("");
  const [respuestaY, setRespuestaY] = useState("");
  const esSistema = ejercicio.operacion === "sistema_ecuaciones" && ejercicio.sistema;
  const puedeNoExistir = ejercicio.operacion === "raiz_enteros";
  const largo = ejercicio.enunciado.length > 28;

  const completo = esSistema ? respuesta !== "" && respuestaY !== "" : respuesta !== "";

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || enviando || !completo) return;
    if (esSistema && ejercicio.sistema) {
      const x = aNumero(respuesta);
      const y = aNumero(respuestaY);
      const bien = x === ejercicio.sistema.solucionX && y === ejercicio.sistema.solucionY;
      onResponder({
        respuestaDada: `x = ${respuesta}, y = ${respuestaY}`,
        valor: bien ? ejercicio.respuesta : NaN,
        pasos: { modo: "directo" },
      });
      return;
    }
    onResponder({ respuestaDada: respuesta, valor: aNumero(respuesta), pasos: { modo: "directo" } });
  }

  function noExiste() {
    if (bloqueado || enviando) return;
    onResponder({ respuestaDada: "no existe en los enteros", valor: NO_EXISTE, pasos: { modo: "directo" } });
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p
        className={`font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 ${
          largo ? "max-w-md text-xl leading-snug" : "font-mono text-3xl"
        }`}
      >
        {ejercicio.enunciado}
      </p>

      {!bloqueado && (
        <form onSubmit={enviar} className="flex flex-col items-center gap-4">
          {esSistema ? (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 font-mono text-lg text-zinc-700 dark:text-zinc-200">
                x =
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoFocus
                  value={respuesta}
                  onChange={(e) => setRespuesta(limpiar(e.target.value))}
                  aria-label="Valor de x"
                  className={`${CAMPO} w-24`}
                />
              </label>
              <label className="flex items-center gap-2 font-mono text-lg text-zinc-700 dark:text-zinc-200">
                y =
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  value={respuestaY}
                  onChange={(e) => setRespuestaY(limpiar(e.target.value))}
                  aria-label="Valor de y"
                  className={`${CAMPO} w-24`}
                />
              </label>
            </div>
          ) : (
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              autoFocus
              value={respuesta}
              onChange={(e) => setRespuesta(limpiar(e.target.value))}
              aria-label="Tu respuesta"
              className={CAMPO}
            />
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button type="submit" disabled={enviando || !completo} className={BOTON_RESPONDER}>
              Responder
            </button>
            {puedeNoExistir && (
              <button
                type="button"
                onClick={noExiste}
                disabled={enviando}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                No existe en los enteros
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
