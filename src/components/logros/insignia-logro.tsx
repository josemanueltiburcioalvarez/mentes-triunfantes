import { Lock } from "lucide-react";
import { ESTILO_CATEGORIA, type LogroEvaluado } from "@/lib/logros";

// Medalla de un logro: a color si ya se logro, gris con candado si todavia no.
export default function InsigniaLogro({ logro, tamano = 52 }: { logro: LogroEvaluado; tamano?: number }) {
  const Icono = logro.icono;
  const estilo = logro.logrado
    ? ESTILO_CATEGORIA[logro.categoria].logrado
    : "bg-zinc-200 text-zinc-400 ring-transparent dark:bg-zinc-800 dark:text-zinc-600";
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full ring-2 ${estilo}`}
      style={{ width: tamano, height: tamano }}
      title={`${logro.nombre}: ${logro.descripcion}`}
      role="img"
      aria-label={`${logro.nombre}, ${logro.logrado ? "logrado" : "por lograr"}`}
    >
      <Icono style={{ width: tamano * 0.46, height: tamano * 0.46 }} className={logro.logrado ? "" : "opacity-60"} />
      {!logro.logrado && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-400 text-white dark:bg-zinc-600">
          <Lock className="h-2.5 w-2.5" />
        </span>
      )}
    </span>
  );
}
