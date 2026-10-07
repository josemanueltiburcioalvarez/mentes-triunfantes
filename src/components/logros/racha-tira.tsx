import { Check, Flame } from "lucide-react";
import { hoyLima, type Racha } from "@/lib/logros";

const INICIALES = ["D", "L", "M", "M", "J", "V", "S"];

// Los ultimos 7 dias (hoy al final), con la fecha de Lima, y cuales tuvieron practica.
function ultimosSieteDias(): { fecha: string; inicial: string; esHoy: boolean }[] {
  const [a, m, d] = hoyLima().split("-").map(Number);
  const hoy = Date.UTC(a, m - 1, d);
  return Array.from({ length: 7 }, (_, i) => {
    const t = new Date(hoy - (6 - i) * 86_400_000);
    return { fecha: t.toISOString().slice(0, 10), inicial: INICIALES[t.getUTCDay()], esHoy: i === 6 };
  });
}

export default function RachaTira({ racha }: { racha: Racha }) {
  const viva = racha.actual > 0;
  const dias = ultimosSieteDias();
  const mensaje = racha.practicoHoy
    ? "¡Hoy ya sumaste a tu racha!"
    : viva
      ? `Practica hoy para no perder tu racha de ${racha.actual} ${racha.actual === 1 ? "día" : "días"}.`
      : "Practica hoy para empezar tu racha.";

  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            viva
              ? "bg-orange-100 text-orange-500 dark:bg-orange-950 dark:text-orange-400 dark:shadow-[0_0_20px_-4px_rgba(249,115,22,0.8)]"
              : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
          }`}
        >
          <Flame className="h-6 w-6" fill={viva ? "currentColor" : "none"} />
        </span>
        <div>
          <div className="text-2xl font-bold leading-none text-zinc-900 dark:text-zinc-50">
            {racha.actual} <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{racha.actual === 1 ? "día seguido" : "días seguidos"}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Mejor racha: {racha.mejor} {racha.mejor === 1 ? "día" : "días"}</div>
        </div>
      </div>

      <div className="mt-3 flex justify-between gap-1" aria-label="Actividad de los últimos 7 días">
        {dias.map((dia) => {
          const practico = racha.diasRecientes.includes(dia.fecha);
          return (
            <div key={dia.fecha} className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  practico
                    ? "bg-orange-500 text-white shadow-[0_0_10px_-2px_rgba(249,115,22,0.8)]"
                    : dia.esHoy
                      ? "border-2 border-dashed border-orange-400 text-orange-400"
                      : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                }`}
                title={dia.fecha}
              >
                {practico && <Check className="h-4 w-4" strokeWidth={3} />}
              </span>
              <span className={`text-[10px] font-semibold ${dia.esHoy ? "text-orange-500" : "text-zinc-500 dark:text-zinc-400"}`}>{dia.inicial}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">{mensaje}</p>
    </div>
  );
}
