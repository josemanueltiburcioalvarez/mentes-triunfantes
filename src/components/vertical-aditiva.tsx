"use client";

import { useRef, useState } from "react";
import { digitoEn, digitosTopeResta, marcasEsperadas, NOMBRES_COLUMNA, numColumnas } from "@/lib/ejercicios/vertical";
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
  const esResta = operacion === "resta";
  const cifras = Math.max(String(a).length, String(b).length);
  // La ultima llevada (la que se convierte en la primera cifra del resultado, sin que sobre ninguna
  // columna mas por sumar) se coloca directa en el resultado, sin casilla de marca: ya no hay nada mas
  // que sumarle. En el digito 1 esa es la unica llevada del ejercicio, asi que ahi no hay ninguna casilla.
  const sumaSinMarcaFinal = !esResta;
  // resultado[c] = casilla de la columna c (0 = derecha).
  // Suma: marcas[k] = llevada sobre la columna k+1. Resta: marcas[c] = cifra nueva de arriba en la
  // columna c despues de prestar (14, 8...), de hasta 2 cifras.
  const [resultado, setResultado] = useState<string[]>(() => Array(n).fill(""));
  const [marcas, setMarcas] = useState<string[]>(() => Array(esResta ? n : n - 1).fill(""));
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
    const digito = esResta ? soloDigitos(valor, 2) : soloDigitos(valor);
    setMarcas((prev) => prev.map((m, i) => (i === k ? digito : m)));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || !valido) return;

    const digitos = resultado.slice(0, altoLleno + 1).reverse().join("");
    const esperadasCompletas = esResta ? digitosTopeResta(a, b) : marcasEsperadas(operacion, a, b);
    const esperadas = sumaSinMarcaFinal ? esperadasCompletas.slice(0, -1) : esperadasCompletas;
    // en la resta, una casilla vacia significa que la cifra de arriba no cambio
    const escritas = marcas.map((m, k) => (m === "" ? (esResta ? Number(digitoEn(a, k)) : 0) : Number(m)));

    // Las llevadas / cifras prestadas tambien cuentan: deben anotarse donde haya y no donde no haya.
    const errores: string[] = [];
    esperadas.forEach((esperada, k) => {
      const escrita = escritas[k] ?? 0;
      if (escrita === esperada) return;
      const columna = NOMBRES_COLUMNA[k] ?? `la columna ${k + 1}`;
      if (esResta) {
        const original = Number(digitoEn(a, k));
        errores.push(
          esperada === original
            ? `en ${columna} el ${original} no cambiaba y anotaste ${escrita}`
            : marcas[k] === ""
              ? `en ${columna} el ${original} tenía que quedar en ${esperada} y no lo anotaste`
              : `en ${columna} el ${original} tenía que quedar en ${esperada} y anotaste ${escrita}`
        );
        return;
      }
      errores.push(
        `al sumar ${columna} ${esperada ? "había que llevar 1" : "no había llevada"} y anotaste ${escrita}`
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
        requeria_marcas: esResta ? esperadas.some((m, k) => m !== Number(digitoEn(a, k))) : esperadas.some((m) => m === 1),
        uso_marcas: marcas.some((m) => m !== ""),
        marcas_correctas: marcasOk,
      },
    });
  }

  const CAJA_TOPE =
    "mx-auto h-7 w-10 rounded border border-dashed border-zinc-300 text-center text-sm outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800";
  const columnasGrid = { gridTemplateColumns: `2rem repeat(${n}, 2.75rem)` };

  return (
    <form onSubmit={enviar} className="flex flex-col items-center gap-4">
      <div className="inline-grid items-center gap-y-1" style={columnasGrid}>
        <div />
        {columnas.map((c) =>
          esResta ? (
            <input
              key={`m${c}`}
              type="text"
              inputMode="numeric"
              disabled={bloqueado}
              value={marcas[c]}
              onChange={(e) => cambiarMarca(c, e.target.value)}
              aria-label={`Cifra nueva de arriba, columna ${c + 1}`}
              className={CAJA_TOPE}
            />
          ) : c >= 1 && !(sumaSinMarcaFinal && c === n - 1) ? (
            <input
              key={`m${c}`}
              type="text"
              inputMode="numeric"
              disabled={bloqueado}
              value={marcas[c - 1]}
              onChange={(e) => cambiarMarca(c - 1, e.target.value)}
              aria-label="Llevada"
              className={CAJA_MARCA}
            />
          ) : (
            <div key={`m${c}`} />
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
          ? cifras === 1
            ? "Escribe el resultado. Si la suma llega a 10 o más, escribe las dos cifras directamente: no hace falta casillero de llevada."
            : "Escribe el resultado de derecha a izquierda. Si llevas para la siguiente columna, anótalo arriba: se revisa. La última llevada, la que ya no se suma con nada más, se coloca directa en el resultado."
          : "Escribe el resultado de derecha a izquierda. Si una cifra de arriba es menor, pide prestado: anota arriba la cifra nueva (la que presta baja 1, la que recibe suma 10: 4 pasa a 14 y 9 pasa a 8). Se revisa."}
      </p>

      {!bloqueado && (
        <button type="submit" disabled={enviando || !valido} className={BOTON_RESPONDER}>
          Responder
        </button>
      )}
    </form>
  );
}
