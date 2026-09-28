"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/admin", texto: "Resumen", exacto: true },
  { href: "/admin/estudiantes", texto: "Estudiantes" },
  { href: "/admin/examenes", texto: "Exámenes", insignia: "solicitudes" as const },
  { href: "/admin/alertas", texto: "Alertas", insignia: "alertas" as const },
];

export default function AdminNav({ solicitudes, alertas }: { solicitudes: number; alertas: number }) {
  const ruta = usePathname();
  const cuentas = { solicitudes, alertas };

  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800" aria-label="Secciones del panel">
      {SECCIONES.map((s) => {
        const activa = s.exacto ? ruta === s.href : ruta.startsWith(s.href);
        const n = s.insignia ? cuentas[s.insignia] : 0;
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={activa ? "page" : undefined}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
              activa
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {s.texto}
            {n > 0 && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{n}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
