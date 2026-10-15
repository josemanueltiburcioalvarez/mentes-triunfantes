"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";

// Evento que Chrome/Edge en Android y escritorio lanzan cuando la web se puede instalar como app.
interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Entorno = "app" | "ios" | "otro";

// "app": ya abierta como app instalada; "ios": Safari de iPhone/iPad (no hay boton nativo, se explica el paso).
function leerEntorno(): Entorno {
  const instalada =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (instalada) return "app";
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "otro";
}

const sinSuscripcion = () => () => {};

export default function BotonInstalar({ className = "" }: { className?: string }) {
  const entorno = useSyncExternalStore<Entorno | null>(sinSuscripcion, leerEntorno, () => null);
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [ayudaIos, setAyudaIos] = useState(false);

  useEffect(() => {
    const alPoderInstalar = (e: Event) => {
      e.preventDefault(); // guardamos el aviso para mostrarlo con nuestro propio boton
      setEvento(e as EventoInstalacion);
    };
    const alInstalar = () => setInstalada(true);
    window.addEventListener("beforeinstallprompt", alPoderInstalar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alPoderInstalar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  if (instalada || entorno === null || entorno === "app") return null;
  if (!evento && entorno !== "ios") return null;

  async function instalar() {
    if (!evento) {
      setAyudaIos((v) => !v);
      return;
    }
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={instalar}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/60 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-300"
      >
        <Download className="h-3.5 w-3.5" />
        Instalar app
      </button>
      {ayudaIos && (
        <p className="max-w-60 text-center text-xs text-zinc-500 dark:text-zinc-400">
          En Safari toca el botón <strong>Compartir</strong> y luego <strong>«Añadir a pantalla de inicio»</strong>.
        </p>
      )}
    </div>
  );
}
