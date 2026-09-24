"use client";

import { useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { digitoEn, marcasMultiplicacion, parcialesMultiplicacion } from "@/lib/ejercicios/vertical";
import {
  BOTON_RESPONDER,
  CAJA_DIGITO,
  CAJA_MARCA,
  CELDA_DIGITO,
  normalizarNumero,
  soloDigitos,
  type PropsComunes,
} from "./tipos-pregunta";

type Refs = MutableRefObject<(HTMLInputElement | null)[]>;

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
  const parcialesEsperados = parcialesMultiplicacion(a, b).map(String);

  // Una casilla por cifra: k = 0 es la de la derecha. El segundo producto parcial va
  // corrido una columna a la izquierda (vale decenas).
  const [resultado, setResultado] = useState<string[]>(() => Array(n).fill(""));
  const [marcas, setMarcas] = useState<string[]>(() => Array(cifrasA - 1).fill(""));
  const [parcial1, setParcial1] = useState<string[]>(() => Array(parcialesEsperados[0].length).fill(""));
  const [parcial2, setParcial2] = useState<string[]>(() => Array((parcialesEsperados[1] ?? "").length).fill(""));
  const refsResultado: Refs = useRef([]);
  const refsParcial1: Refs = useRef([]);
  const refsParcial2: Refs = useRef([]);

  const columnas = Array.from({ length: n }, (_, i) => n - 1 - i); // izquierda -> derecha
  const plantilla = `2rem repeat(${n}, 2.75rem)`;

  const altoLleno = resultado.reduce((max, d, c) => (d !== "" ? c : max), -1);
  const valido = altoLleno >= 0 && resultado.slice(0, altoLleno + 1).every((d) => d !== "");

  function cajasDe(
    etiqueta: string,
    valores: string[],
    setValores: Dispatch<SetStateAction<string[]>>,
    refs: Refs,
    desplazamiento: number,
    autoFoco: boolean
  ) {
    return columnas.map((c) => {
      const k = c - desplazamiento;
      if (k < 0 || k >= valores.length) return <div key={`${etiqueta}${c}`} />;
      return (
        <input
          key={`${etiqueta}${c}`}
          ref={(el) => {
            refs.current[k] = el;
          }}
          type="text"
          inputMode="numeric"
          autoFocus={autoFoco && k === 0}
          disabled={bloqueado}
          value={valores[k]}
          onChange={(e) => {
            const digito = soloDigitos(e.target.value);
            setValores((prev) => prev.map((v, i) => (i === k ? digito : v)));
            if (digito && k + 1 < valores.length) refs.current[k + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && valores[k] === "" && k > 0) refs.current[k - 1]?.focus();
          }}
          aria-label={`${etiqueta}, columna ${k + 1}`}
          className={CAJA_DIGITO}
        />
      );
    });
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || !valido) return;

    const digitos = resultado.slice(0, altoLleno + 1).reverse().join("");
    const esperadasMarcas = marcasMultiplicacion(a, b);
    const escritas = marcas.map((m) => (m === "" ? 0 : Number(m)));
    const textoDe = (valores: string[]) => [...valores].reverse().join("");
    const parcialesEscritos = cifrasB === 2 ? [textoDe(parcial1), textoDe(parcial2)] : [];
    const parcialesOk = parcialesEscritos.every((p, i) => normalizarNumero(p) === parcialesEsperados[i]);

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
      <div className="flex max-w-full flex-col gap-1 overflow-x-auto">
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
              {cajasDe("Producto por las unidades", parcial1, setParcial1, refsParcial1, 0, true)}
            </div>
            <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
              <div className="text-center font-mono text-2xl text-zinc-500">+</div>
              {cajasDe("Producto por las decenas", parcial2, setParcial2, refsParcial2, 1, false)}
            </div>
            <div className="my-1 h-px bg-zinc-400 dark:bg-zinc-600" />
          </>
        )}

        <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
          <div />
          {cajasDe("Resultado", resultado, setResultado, refsResultado, 0, cifrasB === 1)}
        </div>
      </div>

      <p className="max-w-xs text-xs text-zinc-400 dark:text-zinc-500">
        {cifrasB === 1
          ? "Multiplica cifra por cifra de derecha a izquierda. Anota las llevadas arriba."
          : "Escribe el producto por las unidades y, debajo, el de las decenas corrido una columna a la izquierda. Luego suma. Las llevadas van arriba."}
      </p>

      {!bloqueado && (
        <button type="submit" disabled={enviando || !valido} className={BOTON_RESPONDER}>
          Responder
        </button>
      )}
    </form>
  );
}
