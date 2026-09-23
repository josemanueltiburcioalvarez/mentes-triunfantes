"use client";

import { useRef, useState } from "react";
import { digitoEn, marcasMultiplicacion, parcialesMultiplicacion } from "@/lib/ejercicios/vertical";
import {
  BOTON_RESPONDER,
  CAJA_DIGITO,
  CAJA_LARGA,
  CAJA_MARCA,
  CELDA_DIGITO,
  normalizarNumero,
  soloDigitos,
  type PropsComunes,
} from "./tipos-pregunta";

export default function VerticalMultiplicacion({
  a,
  b,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { a: number; b: number }) {
  const cifrasA = String(a).length;
  const cifrasB = String(b).length;
  const n = cifrasA + cifrasB; // columnas del resultado
  const [resultado, setResultado] = useState<string[]>(() => Array(n).fill(""));
  const [marcas, setMarcas] = useState<string[]>(() => Array(cifrasA - 1).fill(""));
  const [parcial1, setParcial1] = useState("");
  const [parcial2, setParcial2] = useState("");
  const refsResultado = useRef<(HTMLInputElement | null)[]>([]);

  const columnas = Array.from({ length: n }, (_, i) => n - 1 - i); // izquierda -> derecha
  const plantilla = `2rem repeat(${n}, 2.75rem)`;
  // posicion de grilla (1 = columna del operador) de la columna c contada desde la derecha
  const posicion = (c: number) => n - c + 1;
  const abarca = (desde: number, hasta: number) => ({
    gridColumn: `${posicion(hasta)} / ${posicion(desde) + 1}`,
  });

  const altoLleno = resultado.reduce((max, d, c) => (d !== "" ? c : max), -1);
  const valido = altoLleno >= 0 && resultado.slice(0, altoLleno + 1).every((d) => d !== "");

  function cambiarResultado(c: number, valor: string) {
    const digito = soloDigitos(valor);
    setResultado((prev) => prev.map((d, i) => (i === c ? digito : d)));
    if (digito && c + 1 < n) refsResultado.current[c + 1]?.focus();
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || !valido) return;

    const digitos = resultado.slice(0, altoLleno + 1).reverse().join("");
    const esperadasMarcas = marcasMultiplicacion(a, b);
    const escritas = marcas.map((m) => (m === "" ? 0 : Number(m)));
    const parcialesEsperados = parcialesMultiplicacion(a, b).map(String);
    const parcialesEscritos = cifrasB === 2 ? [parcial1, parcial2] : [];
    const parcialesOk = parcialesEscritos.every(
      (p, i) => normalizarNumero(p) === parcialesEsperados[i]
    );

    onResponder({
      respuestaDada: digitos,
      valor: Number(digitos),
      pasos: {
        modo: "vertical",
        operacion: "multiplicacion",
        resultado_digitos: digitos.split(""),
        marcas: escritas,
        marcas_esperadas: esperadasMarcas,
        parciales: parcialesEscritos,
        parciales_esperados: parcialesEsperados,
        requeria_marcas: esperadasMarcas.some((m) => m > 0) || cifrasB === 2,
        uso_marcas: escritas.some((m) => m !== 0) || parcialesEscritos.some((p) => p !== ""),
        marcas_correctas: esperadasMarcas.every((m, i) => (escritas[i] ?? 0) === m) && parcialesOk,
      },
    });
  }

  return (
    <form onSubmit={enviar} className="flex flex-col items-center gap-4">
      <div className="flex flex-col gap-1">
        <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
          <div />
          {columnas.map((c) =>
            c >= 1 && c <= cifrasA - 1 ? (
              <input
                key={`m${c}`}
                type="text"
                inputMode="numeric"
                disabled={bloqueado}
                value={marcas[c - 1]}
                onChange={(e) =>
                  setMarcas((prev) => prev.map((m, i) => (i === c - 1 ? soloDigitos(e.target.value) : m)))
                }
                aria-label="Llevada"
                className={CAJA_MARCA}
              />
            ) : (
              <div key={`m${c}`} />
            )
          )}
        </div>

        <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
          <div />
          {columnas.map((c) => (
            <div key={`a${c}`} className={CELDA_DIGITO}>
              {c < cifrasA ? digitoEn(a, c) : ""}
            </div>
          ))}
        </div>

        <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
          <div className="text-center font-mono text-3xl text-zinc-500">×</div>
          {columnas.map((c) => (
            <div key={`b${c}`} className={CELDA_DIGITO}>
              {c < cifrasB ? digitoEn(b, c) : ""}
            </div>
          ))}
        </div>

        <div className="my-1 h-px bg-zinc-400 dark:bg-zinc-600" />

        {cifrasB === 2 && (
          <>
            <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
              <div />
              <input
                type="text"
                inputMode="numeric"
                disabled={bloqueado}
                value={parcial1}
                onChange={(e) => setParcial1(soloDigitos(e.target.value, cifrasA + 1))}
                aria-label="Producto parcial por las unidades"
                className={CAJA_LARGA}
                style={abarca(0, cifrasA)}
              />
            </div>
            <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
              <div className="text-center font-mono text-2xl text-zinc-500">+</div>
              <input
                type="text"
                inputMode="numeric"
                disabled={bloqueado}
                value={parcial2}
                onChange={(e) => setParcial2(soloDigitos(e.target.value, cifrasA + 1))}
                aria-label="Producto parcial por las decenas"
                className={CAJA_LARGA}
                style={abarca(1, cifrasA + 1)}
              />
            </div>
            <div className="my-1 h-px bg-zinc-400 dark:bg-zinc-600" />
          </>
        )}

        <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
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
              onKeyDown={(e) => {
                if (e.key === "Backspace" && resultado[c] === "" && c > 0) refsResultado.current[c - 1]?.focus();
              }}
              aria-label={`Resultado, columna ${c + 1}`}
              className={CAJA_DIGITO}
            />
          ))}
        </div>
      </div>

      <p className="max-w-xs text-xs text-zinc-400 dark:text-zinc-500">
        {cifrasB === 1
          ? "Multiplica cifra por cifra de derecha a izquierda. Anota las llevadas arriba."
          : "Anota el producto por las unidades, luego el de las decenas (corrido a la izquierda) y suma. Las llevadas van arriba."}
      </p>

      {!bloqueado && (
        <button type="submit" disabled={enviando || !valido} className={BOTON_RESPONDER}>
          Responder
        </button>
      )}
    </form>
  );
}
