"use client";

import { useState } from "react";
import type { Json } from "@/lib/supabase/database.types";
import type { EnteroPotencia } from "@/lib/ejercicios/enteros";
import { superindice } from "@/lib/ejercicios/combinadas";
import VerticalPotencia from "./vertical-potencia";
import { BotonResponder, Mensaje, Opciones, OPCIONES_SIGNO, conSigno } from "./entero-comun";
import type { PropsComunes, RespuestaPregunta } from "./tipos-pregunta";

// Potencia con signo: primero se decide el signo (par/impar, o menos afuera del parentesis)
// y luego la potencia de los numeros sin signo se resuelve con multiplicaciones en vertical.
export default function EnteroPotencia({
  potencia,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { potencia: EnteroPotencia }) {
  const { base, exponente, parentesis } = potencia;
  const magnitudBase = Math.abs(base);
  const [signo, setSigno] = useState<"+" | "-" | null>(null);
  const [erroresSigno, setErroresSigno] = useState(0);
  const [magnitudEscrita, setMagnitudEscrita] = useState<number | null>(null);
  const [pasosMagnitud, setPasosMagnitud] = useState<unknown>(null);
  const [trabajoBien, setTrabajoBien] = useState(true);
  const [detalleTrabajo, setDetalleTrabajo] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const magnitud = magnitudBase ** exponente;
  const negativo = parentesis ? base < 0 && exponente % 2 === 1 : true;
  const signoCorrecto = negativo ? "-" : "+";
  const terminado = magnitudEscrita !== null;
  const textoBase = parentesis ? (base < 0 ? `(−${magnitudBase})` : `(+${magnitudBase})`) : `−${magnitudBase}`;

  function elegirSigno(id: string) {
    if (bloqueado || signo !== null) return;
    if (id === signoCorrecto) {
      setSigno(id);
      setMensaje(null);
      return;
    }
    setErroresSigno((n) => n + 1);
    setMensaje(
      !parentesis
        ? "Aquí el menos está afuera, sin paréntesis: primero se calcula la potencia y al resultado se le pone el signo menos."
        : negativo
          ? `El exponente ${exponente} es impar: una base negativa elevada a un exponente impar da resultado negativo.`
          : base < 0
            ? `El exponente ${exponente} es par: los negativos se cancelan de dos en dos y el resultado es positivo.`
            : "Una base positiva siempre da un resultado positivo."
    );
  }

  function alResponderMagnitud(r: RespuestaPregunta) {
    // valor es -1 cuando alguna multiplicación intermedia tiene errores; lo escrito va en respuestaDada
    setMagnitudEscrita(Number(r.respuestaDada));
    setTrabajoBien(r.valor === magnitud);
    setDetalleTrabajo(r.detalle ?? null);
    setPasosMagnitud(r.pasos);
  }

  function responder() {
    if (bloqueado || magnitudEscrita === null) return;
    const bien = erroresSigno === 0 && trabajoBien && magnitudEscrita === magnitud;
    const escrito = (negativo ? -1 : 1) * magnitudEscrita;
    onResponder({
      respuestaDada: conSigno(escrito),
      valor: bien ? escrito : NaN,
      pasos: {
        modo: "enteros",
        operacion: "potencia",
        base,
        exponente,
        parentesis,
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
              ? `La potencia sin signo era ${magnitudBase}${superindice(exponente)} = ${magnitud}, y escribiste ${magnitudEscrita}. `
              : "") + (detalleTrabajo ?? "")
          : `Acertaste el número, pero fallaste ${erroresSigno} ${erroresSigno === 1 ? "vez" : "veces"} al elegir el signo, así que cuenta como incorrecto.`,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-mono text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {textoBase}
        {superindice(exponente)}
      </p>

      {signo === null ? (
        <>
          <p className="max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
            {parentesis
              ? "Fíjate en el exponente: si es par el resultado es positivo; si es impar, conserva el signo de la base."
              : "Sin paréntesis, el exponente solo afecta al número; el signo menos queda afuera."}
          </p>
          <Opciones pregunta="¿Qué signo tendrá el resultado?" opciones={OPCIONES_SIGNO} deshabilitado={bloqueado} onElegir={elegirSigno} />
        </>
      ) : (
        <>
          <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            El resultado será {negativo ? "negativo" : "positivo"}. Ahora calcula la potencia sin signos:{" "}
            <span className="font-mono text-zinc-700 dark:text-zinc-200">
              {magnitudBase}
              {superindice(exponente)}
            </span>
          </p>
          {!terminado && (
            <VerticalPotencia base={magnitudBase} exponente={exponente} bloqueado={bloqueado} enviando={enviando} onResponder={alResponderMagnitud} />
          )}
          {terminado && (
            <>
              <p className="font-mono text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                = {conSigno((negativo ? -1 : 1) * (magnitudEscrita as number))}
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
