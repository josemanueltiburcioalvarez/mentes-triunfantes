"use client";

import { useRef, useState } from "react";
import type { EjercicioGenerado } from "@/lib/ejercicios/generador";
import { digitoEn, marcasEsperadas, numColumnas } from "@/lib/ejercicios/vertical";
import type { Json } from "@/lib/supabase/database.types";

export interface RespuestaPregunta {
  respuestaDada: string;
  valor: number;
  pasos: Json | null;
}

interface Props {
  ejercicio: EjercicioGenerado;
  bloqueado: boolean;
  enviando: boolean;
  onResponder: (respuesta: RespuestaPregunta) => void;
}

export default function Pregunta(props: Props) {
  const { ejercicio } = props;
  if (ejercicio.operacion && ejercicio.operandos) {
    return (
      <Vertical
        {...props}
        operacion={ejercicio.operacion}
        a={ejercicio.operandos[0]}
        b={ejercicio.operandos[1]}
      />
    );
  }
  return <Simple {...props} />;
}

const BOTON =
  "rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

function Simple({ ejercicio, bloqueado, enviando, onResponder }: Props) {
  const [respuesta, setRespuesta] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || respuesta === "") return;
    onResponder({
      respuestaDada: respuesta,
      valor: Number(respuesta.replace(",", ".")),
      pasos: null,
    });
  }

  return (
    <div>
      <p className="mb-6 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {ejercicio.enunciado}
      </p>
      {!bloqueado && (
        <form onSubmit={enviar} className="flex flex-col items-center gap-4">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-center text-xl outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button type="submit" disabled={enviando || respuesta === ""} className={BOTON}>
            Responder
          </button>
        </form>
      )}
    </div>
  );
}

const CELDA = "flex h-12 w-11 items-center justify-center font-mono text-3xl text-zinc-900 dark:text-zinc-50";

function Vertical({
  operacion,
  a,
  b,
  bloqueado,
  enviando,
  onResponder,
}: Props & { operacion: "suma" | "resta"; a: number; b: number }) {
  const n = numColumnas(operacion, a, b);
  // resultado[c] = casilla de la columna c (0 = derecha); marcas[k] = casilla sobre la columna k+1
  const [resultado, setResultado] = useState<string[]>(() => Array(n).fill(""));
  const [marcas, setMarcas] = useState<string[]>(() => Array(n - 1).fill(""));
  const refsResultado = useRef<(HTMLInputElement | null)[]>([]);

  const columnas = Array.from({ length: n }, (_, i) => n - 1 - i); // de izquierda a derecha

  const altoLleno = resultado.reduce((max, d, c) => (d !== "" ? c : max), -1);
  const valido = altoLleno >= 0 && resultado.slice(0, altoLleno + 1).every((d) => d !== "");

  function cambiarResultado(c: number, valor: string) {
    const digito = valor.replace(/\D/g, "").slice(-1);
    setResultado((prev) => prev.map((d, i) => (i === c ? digito : d)));
    if (digito && c + 1 < n) refsResultado.current[c + 1]?.focus();
  }

  function teclaResultado(c: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && resultado[c] === "" && c > 0) {
      refsResultado.current[c - 1]?.focus();
    }
  }

  function cambiarMarca(k: number, valor: string) {
    const digito = valor.replace(/\D/g, "").slice(-1);
    setMarcas((prev) => prev.map((m, i) => (i === k ? digito : m)));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || !valido) return;

    const digitos = resultado.slice(0, altoLleno + 1).reverse().join("");
    const esperadas = marcasEsperadas(operacion, a, b);
    const escritas = marcas.map((m) => (m === "" ? 0 : Number(m)));
    onResponder({
      respuestaDada: digitos,
      valor: Number(digitos),
      pasos: {
        modo: "vertical",
        operacion,
        resultado_digitos: digitos.split(""),
        marcas: escritas,
        marcas_esperadas: esperadas,
        requeria_marcas: esperadas.some((m) => m === 1),
        uso_marcas: escritas.some((m) => m !== 0),
        marcas_correctas: esperadas.every((m, i) => (escritas[i] ?? 0) === m),
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
              className="mx-auto h-7 w-8 rounded border border-dashed border-zinc-300 text-center text-sm outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800"
            />
          ) : (
            <div key="m0" />
          )
        )}

        <div />
        {columnas.map((c) => (
          <div key={`a${c}`} className={CELDA}>
            {digitoEn(a, c)}
          </div>
        ))}

        <div className="text-center font-mono text-3xl text-zinc-500">{operacion === "suma" ? "+" : "−"}</div>
        {columnas.map((c) => (
          <div key={`b${c}`} className={CELDA}>
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
            className="mx-auto h-12 w-10 rounded-lg border border-zinc-300 text-center font-mono text-2xl outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800"
          />
        ))}
      </div>

      <p className="max-w-xs text-xs text-zinc-400 dark:text-zinc-500">
        {operacion === "suma"
          ? "Escribe el resultado de derecha a izquierda. Si llevas, anótalo en las casillas de arriba."
          : "Escribe el resultado de derecha a izquierda. Si prestas, anota 1 arriba de la columna de la que prestas."}
      </p>

      {!bloqueado && (
        <button type="submit" disabled={enviando || !valido} className={BOTON}>
          Responder
        </button>
      )}
    </form>
  );
}
