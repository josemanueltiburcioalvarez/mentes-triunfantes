import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { HabilidadBasica } from "@/lib/ejercicios/generador";

const ORDEN_HABILIDADES = [
  "suma",
  "resta",
  "tabla_multiplicacion",
  "multiplicacion",
  "division",
  "potencia",
  "raiz",
  "operaciones_combinadas",
  "atajos",
  "razonamiento",
] as const;

const NOMBRES_LEGIBLES: Record<(typeof ORDEN_HABILIDADES)[number], string> = {
  suma: "Suma",
  resta: "Resta",
  tabla_multiplicacion: "Tabla de multiplicar",
  multiplicacion: "Multiplicación",
  division: "División",
  potencia: "Potencia",
  raiz: "Raíz",
  operaciones_combinadas: "Operaciones combinadas",
  atajos: "Atajos",
  razonamiento: "Razonamiento",
};

const HABILIDADES_CON_PRACTICA = new Set<HabilidadBasica>([
  "suma",
  "resta",
  "tabla_multiplicacion",
]);

export default async function DashboardPage() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol === "admin") redirect("/admin");

  const { data: filas } = await supabase
    .from("vista_resumen_estudiante")
    .select("*")
    .eq("estudiante_id", user.id);

  const niveles = new Map<
    string,
    { nombre: string; orden: number; habilidades: NonNullable<typeof filas>[number][] }
  >();

  for (const fila of filas ?? []) {
    if (!fila.nivel_nombre) continue;
    const clave = fila.nivel_nombre;
    if (!niveles.has(clave)) {
      niveles.set(clave, { nombre: clave, orden: fila.nivel_orden ?? 0, habilidades: [] });
    }
    niveles.get(clave)!.habilidades.push(fila);
  }

  const nivelesOrdenados = Array.from(niveles.values()).sort((a, b) => a.orden - b.orden);
  const nivelActual = filas?.[0]?.nivel_actual ?? null;
  const diasActivos = filas?.[0]?.dias_activos ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Tu progreso</h1>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {nivelActual && <span>Nivel actual: {nivelActual} · </span>}
          <span>{diasActivos} días activos</span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {nivelesOrdenados.map((nivel) => (
          <section key={nivel.nombre}>
            <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">
              {nivel.nombre}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {nivel.habilidades
                .slice()
                .sort(
                  (a, b) =>
                    ORDEN_HABILIDADES.indexOf(a.habilidad_nombre as (typeof ORDEN_HABILIDADES)[number]) -
                    ORDEN_HABILIDADES.indexOf(b.habilidad_nombre as (typeof ORDEN_HABILIDADES)[number])
                )
                .map((h) => {
                  const nombreHabilidad = h.habilidad_nombre as (typeof ORDEN_HABILIDADES)[number];
                  const dominio = Math.round(h.porcentaje_dominio ?? 0);
                  const desbloqueada = h.desbloqueada ?? false;
                  const tienePractica = HABILIDADES_CON_PRACTICA.has(nombreHabilidad as HabilidadBasica);

                  return (
                    <div
                      key={nombreHabilidad}
                      className={`rounded-xl border p-4 ${
                        desbloqueada
                          ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                          : "border-zinc-100 bg-zinc-100/60 dark:border-zinc-900 dark:bg-zinc-900/40"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {NOMBRES_LEGIBLES[nombreHabilidad]}
                        </span>
                        {!desbloqueada && <span className="text-xs text-zinc-400">🔒</span>}
                      </div>

                      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${dominio}%` }}
                        />
                      </div>
                      <div className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {dominio}% de dominio
                      </div>

                      {desbloqueada && tienePractica ? (
                        <Link
                          href={`/practicar/${nombreHabilidad}`}
                          className="inline-block rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          Practicar
                        </Link>
                      ) : desbloqueada ? (
                        <span className="text-xs text-zinc-400">Próximamente</span>
                      ) : (
                        <span className="text-xs text-zinc-400">Bloqueada</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
