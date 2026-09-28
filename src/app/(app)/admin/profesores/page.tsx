import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, tiempoRelativo } from "@/lib/admin";
import FormularioAccion from "@/components/formulario-accion";
import { promoverProfesor } from "./acciones";

export default async function ProfesoresPage() {
  const supabase = await crearClienteServidor();
  const [profesores, resumen] = await Promise.all([
    supabase.from("perfiles").select("id, nombre, email, created_at").eq("rol", "profesor").order("nombre"),
    supabase.from("vista_resumen_profesor").select("*"),
  ]);
  const stats = new Map((resumen.data ?? []).map((r) => [r.profesor_id, r]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Profesores</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Un profesor entra con su propia cuenta y solo ve el progreso de los estudiantes que le asignes.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Hacer profesor a una cuenta</h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          La persona debe registrarse primero en <span className="font-mono">/login</span> (queda como estudiante). Escribe aquí su
          correo para volverla profesora.
        </p>
        <FormularioAccion accion={promoverProfesor} className="flex flex-wrap items-end gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder="correo@ejemplo.com"
            className="min-w-64 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Hacer profesor
          </button>
        </FormularioAccion>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">Profesores</h2>
        {(profesores.data ?? []).length === 0 ? (
          <p className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Todavía no hay ningún profesor.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {(profesores.data ?? []).map((p) => {
              const s = stats.get(p.id);
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <Link href={`/admin/profesores/${p.id}`} className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50">
                      {p.nombre}
                    </Link>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {p.email ?? "sin correo"} · desde {formatearFecha(p.created_at)}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {s?.estudiantes_activos ?? 0} estudiante{(s?.estudiantes_activos ?? 0) === 1 ? "" : "s"} · avance promedio{" "}
                    {Math.round(Number(s?.progreso_promedio ?? 0))}%
                    {s?.ultima_actividad_estudiantes ? ` · última actividad ${tiempoRelativo(s.ultima_actividad_estudiantes)}` : ""}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
