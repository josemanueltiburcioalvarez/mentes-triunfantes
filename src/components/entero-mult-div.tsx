"use client";

import { useState } from "react";
import type { Json } from "@/lib/supabase/database.types";
import { signado } from "@/lib/ejercicios/enteros";
import VerticalMultiplicacion from "./vertical-multiplicacion";
import VerticalDivision from "./vertical-division";
import { BotonResponder, Mensaje, Opciones, OPCIONES_SIGNO, conSigno } from "./entero-comun";
import type { PropsComunes, RespuestaPregunta } from "./tipos-pregunta";

// Multiplicacion y division con signo: primero se decide el signo con la regla de los signos
// y luego se hace la cuenta en vertical con los numeros sin signo.
export default function EnteroMultDiv({
  operacion,
  a,
  b,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { operacion: "multiplicacion" | "division"; a: number; b: number }) {
  const [signo, setSigno] = useState<"+" | "-" | null>(null);
  const [magnitudEscrita, setMagnitudEscrita] = useState<number | null>(null);
  const [erroresSigno, setErroresSigno] = useState(0);
  const [pasosMagnitud, setPasosMagnitud] = useState<unknown>(null);
  const [trabajoBien, setTrabajoBien] = useState(true);
  const [detalleTrabajo, setDetalleTrabajo] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const simbolo = operacion === "multiplicacion" ? "×" : "÷";
  const absA = Math.abs(a);
  const absB = Math.abs(b);
  const magnitud = operacion === "multiplicacion" ? absA * absB : absA / absB;
  const signoCorrecto = a < 0 !== b < 0 ? "-" : "+";
  const mismosSignos = a < 0 === b < 0;
  const terminado = magnitudEscrita !== null;

  function elegirSigno(id: string) {
    if (bloqueado || signo !== null) return;
    if (id === signoCorrecto) {
      setSigno(id);
      setMensaje(null);
      return;
    }
    setErroresSigno((n) => n + 1);
    setMensaje(
      mismosSignos
        ? "Los dos números tienen el mismo signo, y signos iguales dan resultado positivo."
        : "Los dos números tienen signos diferentes, y signos diferentes dan resultado negativo."
    );
  }

  function alResponderMagnitud(r: RespuestaPregunta) {
    // valor es -1 cuando el procedimiento (productos, restas) tiene errores; lo escrito va en respuestaDada
    setMagnitudEscrita(Number(r.respuestaDada));
    setTrabajoBien(r.valor === magnitud);
    setDetalleTrabajo(r.detalle ?? null);
    setPasosMagnitud(r.pasos);
  }

  function responder() {
    if (bloqueado || magnitudEscrita === null) return;
    const bien = erroresSigno === 0 && trabajoBien && magnitudEscrita === magnitud;
    const escrito = (signoCorrecto === "-" ? -1 : 1) * magnitudEscrita;
    onResponder({
      respuestaDada: conSigno(escrito),
      valor: bien ? escrito : NaN,
      pasos: {
        modo: "enteros",
        operacion,
        operandos: [a, b],
        errores_signo: erroresSigno,
        magnitud_escrita: magnitudEscrita,
        magnitud_correcta: magnitud,
        vertical: (pasosMagnitud ?? null) as Json,
        requeria_marcas: true,
        uso_marcas: true,
        marcas_correctas: bien,
      },
      detalle: bien
        ? undefined
        : !trabajoBien || magnitudEscrita !== magnitud
          ? (magnitudEscrita !== magnitud
              ? `La cuenta sin signos era ${absA} ${simbolo} ${absB} = ${magnitud}, y escribiste ${magnitudEscrita}. `
              : "") + (detalleTrabajo ?? "")
          : `Acertaste el resultado, pero fallaste ${erroresSigno} ${erroresSigno === 1 ? "vez" : "veces"} al elegir el signo, así que cuenta como incorrecto.`,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-mono text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {signado(a)} {simbolo} {signado(b)}
      </p>

      {signo === null ? (
        <>
          <p className="max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
            Regla de los signos: <strong>iguales → +</strong> · <strong>diferentes → −</strong>
          </p>
          <Opciones pregunta="¿Qué signo tendrá el resultado?" opciones={OPCIONES_SIGNO} deshabilitado={bloqueado} onElegir={elegirSigno} />
        </>
      ) : (
        <>
          <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            El resultado será {signo === "-" ? "negativo" : "positivo"}. Ahora haz la cuenta sin signos:{" "}
            <span className="font-mono text-zinc-700 dark:text-zinc-200">
              {absA} {simbolo} {absB}
            </span>
          </p>
          {!terminado &&
            (operacion === "multiplicacion" ? (
              <VerticalMultiplicacion a={absA} b={absB} bloqueado={bloqueado} enviando={enviando} onResponder={alResponderMagnitud} />
            ) : (
              <VerticalDivision dividendo={absA} divisor={absB} bloqueado={bloqueado} enviando={enviando} onResponder={alResponderMagnitud} />
            ))}
          {terminado && (
            <>
              <p className="font-mono text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                = {conSigno((signo === "-" ? -1 : 1) * (magnitudEscrita as number))}
              </p>
              {!bloqueado && <BotonResponder enviando={enviando} alClic={responder} />}
            </>
          )}
        </>
      )}

      <Mensaje texto={mensaje} />
    </div>
  );
}
