import type { EscenaLineas } from "@/lib/guias/tipos";

const ESTILOS = {
  normal: "text-zinc-900 dark:text-zinc-50",
  foco: "rounded-md bg-blue-500/20 px-2 font-semibold text-blue-700 ring-2 ring-blue-500 dark:text-blue-200",
  resultado: "font-bold text-emerald-700 dark:text-emerald-400",
  apagado: "text-zinc-400 dark:text-zinc-500",
  tachado: "text-zinc-400 line-through decoration-red-500 decoration-2",
} as const;

export default function TableroLineas({ escena }: { escena: EscenaLineas }) {
  return (
    <div className="flex max-w-full flex-col items-center gap-1.5 overflow-x-auto rounded-xl border border-zinc-200 bg-white px-5 py-4 font-mono text-xl dark:border-zinc-700 dark:bg-zinc-900">
      {escena.lineas.map((linea, i) =>
        linea.t === "" ? (
          <div key={i} className="h-2" />
        ) : (
          <div key={i} className={`whitespace-pre ${ESTILOS[linea.e ?? "normal"]}`}>
            {linea.t}
          </div>
        )
      )}
    </div>
  );
}
