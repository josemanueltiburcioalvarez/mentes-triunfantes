"use client";

import { useState } from "react";
import { superindice } from "@/lib/ejercicios/combinadas";
import type { Json } from "@/lib/supabase/database.types";
import VerticalMultiplicacion from "./vertical-multiplicacion";
import type { PropsComunes, RespuestaPregunta } from "./tipos-pregunta";

interface Etapa {
  a: number;
  b: number;
  escrito: number;
  correcto: boolean;
  pasos: Json | null;
}

// Una potencia se resuelve como multiplicaciones sucesivas: base^n = base x base x ... .
// Cada multiplicacion se hace en vertical, una etapa tras otra.
export default function VerticalPotencia({
  base,
  exponente,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { base: number; exponente: number }) {
  const etapasTotal = exponente - 1;
  const [etapa, setEtapa] = useState(0);
  const [hechas, setHechas] = useState<Etapa[]>([]);

  const a = base ** (etapa + 1);

  function alResponderEtapa(r: RespuestaPregunta) {
    const nueva: Etapa[] = [
      ...hechas,
      { a, b: base, escrito: r.valor, correcto: r.valor === a * base, pasos: r.pasos },
    ];
    setHechas(nueva);
    if (etapa + 1 < etapasTotal) {
      setEtapa(etapa + 1);
      return;
    }

    const todasBien = nueva.every((e) => e.correcto);
    onResponder({
      respuestaDada: r.respuestaDada,
      valor: todasBien ? r.valor : -1,
      pasos: {
        modo: "vertical",
        operacion: "potencia",
        base,
        exponente,
        etapas: nueva.map((e) => ({
          multiplicando: e.a,
          multiplicador: e.b,
          escrito: e.escrito,
          correcto: e.correcto,
          pasos: e.pasos,
        })),
        requeria_marcas: true,
        uso_marcas: true,
        marcas_correctas: todasBien,
      },
      detalle: todasBien
        ? undefined
        : "Alguna multiplicación intermedia estuvo mal: " +
          nueva
            .filter((e) => !e.correcto)
            .map((e) => `${e.a} × ${e.b} = ${e.a * e.b} (escribiste ${e.escrito})`)
            .join("; ") +
          ".",
    });
  }

  const expansion = Array(exponente).fill(base).join(" × ");

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {base}
        {superindice(exponente)}
      </p>
      <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        {base}
        {superindice(exponente)} significa multiplicar el {base} por sí mismo {exponente} veces:{" "}
        <span className="font-mono text-zinc-700 dark:text-zinc-200">{expansion}</span>
      </p>

      {hechas.length > 0 && (
        <ul className="flex flex-col gap-0.5 font-mono text-sm">
          {hechas.map((e, i) => (
            <li key={i} className={e.correcto ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}>
              {e.a} × {e.b} = {e.escrito} {e.correcto ? "✓" : `✗ (era ${e.a * e.b})`}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
        Multiplicación {Math.min(etapa + 1, etapasTotal)} de {etapasTotal}: {a} × {base}
      </p>

      <VerticalMultiplicacion
        key={etapa}
        a={a}
        b={base}
        bloqueado={bloqueado}
        enviando={enviando}
        onResponder={alResponderEtapa}
      />
    </div>
  );
}
