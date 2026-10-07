import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ESTILO_CATEGORIA, type LogroEvaluado, type Racha } from "@/lib/logros";
import InsigniaLogro from "./insignia-logro";
import RachaTira from "./racha-tira";

// Tarjeta del panel: racha de dias, unas cuantas medallas y el logro mas cercano. Todo en la pagina /logros.
export default function TarjetaRachaLogros({ racha, logros }: { racha: Racha; logros: LogroEvaluado[] }) {
  const logrados = logros.filter((l) => l.logrado);
  const pendientes = logros
    .filter((l) => !l.logrado)
    .sort((a, b) => b.actual / b.meta - a.actual / a.meta);
  const proximo = pendientes[0];
  // primero los logrados; si hay pocos, se completan con los pendientes mas avanzados
  const vitrina = [...logrados, ...pendientes].slice(0, 6);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <RachaTira racha={racha} />

      <div className="my-4 border-t border-zinc-200 dark:border-zinc-800" />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Logros</h2>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {logrados.length}/{logros.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {vitrina.map((logro) => (
          <InsigniaLogro key={logro.id} logro={logro} tamano={44} />
        ))}
      </div>

      {proximo && (
        <div className="mt-3">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">Próximo: {proximo.nombre}</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {proximo.actual}/{proximo.meta}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${ESTILO_CATEGORIA[proximo.categoria].barra}`}
              style={{ width: `${Math.round((proximo.actual / proximo.meta) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{proximo.descripcion}</p>
        </div>
      )}

      <Link
        href="/logros"
        className="mt-3 flex items-center justify-end gap-0.5 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
      >
        Ver todos los logros <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
