"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { marcarLogrosVistos } from "@/app/(app)/acciones";
import { infoLogro } from "@/lib/logros";
import InsigniaLogro from "./insignia-logro";

// Aviso "¡Nuevo logro!" al entrar al panel. Se queda hasta que el estudiante lo cierra; recien ahi se anota como
// visto, asi que si se va sin cerrarlo vuelve a aparecer la proxima vez.
export default function AvisoLogros({ ids }: { ids: string[] }) {
  const [visible, setVisible] = useState(true);
  const logros = ids.map(infoLogro).filter((l) => l !== null);
  if (!visible || logros.length === 0) return null;

  function cerrar() {
    setVisible(false);
    void marcarLogrosVistos(ids);
  }

  const uno = logros.length === 1 ? logros[0] : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div
        role="status"
        className="aparece-logro pointer-events-auto w-full max-w-sm rounded-2xl border border-amber-300 bg-white p-4 shadow-2xl dark:border-amber-700 dark:bg-zinc-900 dark:shadow-[0_0_40px_-8px_rgba(245,158,11,0.55)]"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
          <Sparkles className="h-4 w-4" />
          {uno ? "¡Nuevo logro!" : `¡${logros.length} logros nuevos!`}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex shrink-0 -space-x-2">
            {logros.slice(0, 4).map((logro) => (
              <InsigniaLogro key={logro.id} logro={logro} tamano={uno ? 56 : 44} />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            {uno ? (
              <>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{uno.nombre}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{uno.descripcion}</div>
              </>
            ) : (
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{logros.map((l) => l.nombre).join(" · ")}</div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={cerrar}
          className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_14px_-3px_rgba(16,185,129,0.6)] hover:bg-emerald-400"
        >
          ¡Genial!
        </button>
      </div>
    </div>
  );
}
