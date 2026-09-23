import { Fragment } from "react";
import type { EscenaColumnas, EstiloCelda } from "@/lib/guias/tipos";

// un color por valor posicional: unidades, decenas, centenas, millares...
const TINTES = ["bg-sky-500/15", "bg-emerald-500/15", "bg-amber-500/15", "bg-violet-500/15", "bg-rose-500/15", "bg-teal-500/15"];
const ETIQUETAS = ["U", "D", "C", "UM", "DM", "CM"];
const NOMBRES = ["Unidades", "Decenas", "Centenas", "Unidades de millar", "Decenas de millar", "Centenas de millar"];

const ESTILOS: Record<EstiloCelda, string> = {
  normal: "text-zinc-900 dark:text-zinc-50",
  foco: "rounded-md bg-blue-500/25 font-semibold text-blue-700 ring-2 ring-blue-500 dark:text-blue-200",
  marca: "font-bold text-red-600 dark:text-red-400",
  resultado: "font-bold text-emerald-700 dark:text-emerald-400",
  tachado: "text-zinc-400 line-through decoration-red-500 decoration-2",
  apagado: "text-zinc-400 dark:text-zinc-500",
};

export default function TableroColumnas({ escena }: { escena: EscenaColumnas }) {
  const n = escena.columnas;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="inline-grid gap-y-1 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
        style={{ gridTemplateColumns: `1.75rem repeat(${n}, 3rem)` }}
      >
        <div />
        {Array.from({ length: n }, (_, i) => {
          const c = n - 1 - i;
          return (
            <div
              key={`e${i}`}
              className={`rounded-t-md py-0.5 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-300 ${TINTES[c]}`}
            >
              {ETIQUETAS[c]}
            </div>
          );
        })}

        {escena.filas.map((fila, r) => (
          <Fragment key={r}>
            <div className="flex items-center justify-center font-mono text-2xl text-zinc-500">{fila.op ?? ""}</div>
            {fila.celdas.map((celda, i) => {
              const c = n - 1 - i;
              return (
                <div
                  key={`${r}-${i}`}
                  className={`flex items-center justify-center font-mono ${fila.chica ? "h-8 text-base" : "h-11 text-2xl"} ${
                    TINTES[c]
                  } ${fila.linea ? "border-b-2 border-zinc-500" : ""} ${ESTILOS[celda.e ?? "normal"]}`}
                >
                  {celda.t}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      <p className="max-w-sm text-center text-xs text-zinc-500 dark:text-zinc-400">
        {Array.from({ length: n }, (_, i) => n - 1 - i)
          .reverse()
          .map((c) => `${ETIQUETAS[c]} = ${NOMBRES[c].toLowerCase()}`)
          .join(" · ")}
      </p>
    </div>
  );
}
