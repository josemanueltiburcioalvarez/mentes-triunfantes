"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { List, Map as IconoMapa } from "lucide-react";

type Vista = "mapa" | "lista";

const CLAVE = "vista-panel";
const EVENTO = "vista-panel-cambio";

function suscribir(avisar: () => void) {
  window.addEventListener("storage", avisar);
  window.addEventListener(EVENTO, avisar);
  return () => {
    window.removeEventListener("storage", avisar);
    window.removeEventListener(EVENTO, avisar);
  };
}

function leerGuardada(): Vista {
  try {
    return localStorage.getItem(CLAVE) === "lista" ? "lista" : "mapa";
  } catch {
    return "mapa";
  }
}

// Alterna entre el mapa y la lista de niveles. Por defecto el mapa; se recuerda la ultima eleccion.
export default function SelectorVista({ mapa, lista }: { mapa: ReactNode; lista: ReactNode }) {
  const guardada = useSyncExternalStore(suscribir, leerGuardada, () => "mapa" as Vista);
  // por si el navegador no deja guardar (modo privado): la eleccion igual vale mientras la pagina siga abierta
  const [local, setLocal] = useState<Vista | null>(null);
  const vista = local ?? guardada;

  function elegir(v: Vista) {
    setLocal(v);
    try {
      localStorage.setItem(CLAVE, v);
      window.dispatchEvent(new Event(EVENTO));
    } catch {
      /* sin almacenamiento: se queda solo en esta pagina */
    }
  }

  const boton = (v: Vista, texto: string, icono: ReactNode) => (
    <button
      type="button"
      onClick={() => elegir(v)}
      aria-pressed={vista === v}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        vista === v
          ? "bg-emerald-500 text-white shadow-[0_0_12px_-3px_rgba(16,185,129,0.7)]"
          : "text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {icono}
      {texto}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div className="inline-flex gap-1 rounded-full border border-zinc-200 bg-white/70 p-1 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          {boton("mapa", "Mapa", <IconoMapa className="h-3.5 w-3.5" />)}
          {boton("lista", "Lista", <List className="h-3.5 w-3.5" />)}
        </div>
      </div>
      <div key={vista}>{vista === "mapa" ? mapa : lista}</div>
    </div>
  );
}
