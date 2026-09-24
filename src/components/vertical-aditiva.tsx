"use client";

import { useRef, useState } from "react";
import { digitoEn, marcasEsperadas, NOMBRES_COLUMNA, numColumnas } from "@/lib/ejercicios/vertical";
import {
  BOTON_RESPONDER,
  CAJA_DIGITO,
  CAJA_MARCA,
  CELDA_DIGITO,
  soloDigitos,
  type PropsComunes,
} from "./tipos-pregunta";

export default function VerticalAditiva({
  operacion,
  a,
  b,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { operacion: "suma" | "resta"; a: number; b: number }) {
  const n = numColumnas(operacion, a, b);
  // resultado[c] = casilla de la columna c (0 = derecha); marcas[k] = casilla sobre la columna k+1
  const [resultado, setResultado] = useState<string[]>(() => Array(n).fill(""));
  const [marcas, setMarcas] = useState<string[]>(() => Array(n - 1).fill(""));
  const refsResultado = useRef<(HTMLInputElement | null)[]>([]);

  const columnas = Array.from({ length: n }, (_, i) => n - 1 - i); // de izquierda a derecha

  const altoLleno = resultado.reduce((max, d, c) => (d !== "" ? c : max), -1);
  const valido = altoLleno >= 0 && resultado.slice(0, altoLleno + 1).every((d) => d !== "");

  function cambiarResultado(c: number, valor: string) {
    const digito = soloDigitos(valor);
    setResultado((prev) => prev.map((d, i) => (i === c ? digito : d)));
    if (digito && c + 1 < n) refsResultado.current[c + 1]?.focus();
  }

  function teclaResultado(c: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && resultado[c] === "" && c > 0) {
      refsResultado.current[c - 1]?.focus();
    }
  }

  function cambiarMarca(k: number, valor: string) {
    const digito = soloDigitos(valor);
    setMarcas((prev) => prev.map((m, i) => (i === k ? digito : m)));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || !valido) return;

    const digitos = resultado.slice(0, altoLleno + 1).reverse().join("");
    const esperadas = marcasEsperadas(operacion, a, b);
    const escritas = marcas.map((m) => (m === "" ? 0 : Number(m)));

    // Las llevadas / prestadas tambien cuentan: deben anotarse donde haya y no donde no haya.
    const errores: string[] = [];
    esperadas.forEach((esperada, k) => {
      const escrita = escritas[k] ?? 0;
      if (escrita === esperada) return;
      const columna = NOMBRES_COLUMNA[k] ?? `la columna ${k + 1}`;
      errores.push(
        operacion === "suma"
          ? `al sumar ${columna} ${esperada ? "había que llevar 1" : "no había llevada"} y anotaste ${escrita}`
          : `al restar ${columna} ${esperada ? "había que pedir prestado 1" : "no había que pedir prestado"} y anotaste ${escrita}`
      );
    });
    const marcasOk = errores.length === 0;

    // El resultado solo cuenta si las llevadas (o prestadas) estan bien anotadas.
    onResponder({
      respuestaDada: digitos,
      valor: marcasOk ? Number(digitos) : -1,
      detalle: marcasOk ? undefined : `Revisa tu procedimiento: ${errores.join("; ")}.`,
      pasos: {
        modo: "vertical",
        operacion,
        resultado_digitos: digitos.split(""),
        marcas: escritas,
        marcas_esperadas: esperadas,
        requeria_marcas: esperadas.some((m) => m === 1),
        uso_marcas: escritas.some((m) => m !== 0),
        marcas_correctas: marcasOk,
      },
    });
  }

  const columnasGrid = { gridTemplateColumns: `2rem repeat(${n}, 2.75rem)` };

  return (
    <form onSubmit={enviar} className="flex flex-col items-center gap-4">
      <div className="inline-grid items-center gap-y-1" style={columnasGrid}>
        <div />
        {columnas.map((c) =>
          c >= 1 ? (
            <input
              key={`m${c}`}
              type="text"
              inputMode="numeric"
              disabled={bloqueado}
              value={marcas[c - 1]}
              onChange={(e) => cambiarMarca(c - 1, e.target.value)}
              aria-label={operacion === "suma" ? "Llevada" : "Prestada"}
              className={CAJA_MARCA}
            />
          ) : (
            <div key="m0" />
          )
        )}

        <div />
        {columnas.map((c) => (
          <div key={`a${c}`} className={CELDA_DIGITO}>
            {digitoEn(a, c)}
          </div>
        ))}

        <div className="text-center font-mono text-3xl text-zinc-500">{operacion === "suma" ? "+" : "−"}</div>
        {columnas.map((c) => (
          <div key={`b${c}`} className={CELDA_DIGITO}>
            {digitoEn(b, c)}
          </div>
        ))}

        <div className="col-span-full my-1 h-px bg-zinc-400 dark:bg-zinc-600" />

        <div />
        {columnas.map((c) => (
          <input
            key={`r${c}`}
            ref={(el) => {
              refsResultado.current[c] = el;
            }}
            type="text"
            inputMode="numeric"
            autoFocus={c === 0}
            disabled={bloqueado}
            value={resultado[c]}
            onChange={(e) => cambiarResultado(c, e.target.value)}
            onKeyDown={(e) => teclaResultado(c, e)}
            aria-label={`Resultado, columna ${c + 1}`}
            className={CAJA_DIGITO}
          />
        ))}
      </div>

      <p className="max-w-xs text-xs text-zinc-400 dark:text-zinc-500">
        {operacion === "suma"
          ? "Escribe el resultado de derecha a izquierda. Si llevas, anótalo en las casillas de arriba: las llevadas se revisan."
          : "Escribe el resultado de derecha a izquierda. Si prestas, anota 1 arriba de la columna de la que prestas: las prestadas se revisan."}
      </p>

      {!bloqueado && (
        <button type="submit" disabled={enviando || !valido} className={BOTON_RESPONDER}>
          Responder
        </button>
      )}
    </form>
  );
}
