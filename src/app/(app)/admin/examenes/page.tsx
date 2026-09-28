import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, NOMBRES_HABILIDAD } from "@/lib/admin";
import FormularioAccion from "@/components/formulario-accion";
import { autorizarExamen, cancelarAutorizacion } from "../acciones";

export default async function ExamenesPage() {
  const supabase = await crearClienteServidor();

  const { data: solicitudes } = await supabase
    .from("autorizaciones_examen")
    .select(
      "id, estado, meet_url, created_at, estudiante_id, estudiante:perfiles!autorizaciones_examen_estudiante_id_fkey(nombre), habilidad:habilidades(nombre), nivel:niveles(nombre)"
    )
    .in("estado", ["solicitado", "autorizado"])
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Exámenes finales</h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Solicitudes de los estudiantes: pega el enlace de Meet para autorizar el examen en vivo.
      </p>
      <section>
        {(solicitudes ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {(solicitudes ?? []).map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    <Link href={`/admin/estudiantes/${s.estudiante_id}`} className="underline-offset-2 hover:underline">
                      {s.estudiante?.nombre ?? "Estudiante"}
                    </Link>{" "}
                    ·{" "}
                    {s.nivel
                      ? `Evaluación del nivel ${s.nivel.nombre}`
                      : (NOMBRES_HABILIDAD[s.habilidad?.nombre ?? ""] ?? s.habilidad?.nombre)}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Solicitado {formatearFecha(s.created_at)}
                  </span>
                </div>

                {s.estado === "solicitado" ? (
                  <div className="flex flex-wrap items-start gap-3">
                  <FormularioAccion accion={autorizarExamen} className="flex flex-1 flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      type="url"
                      name="meet_url"
                      required
                      pattern="https://.*"
                      placeholder="https://meet.google.com/abc-defg-hij"
                      className="min-w-64 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                      Autorizar
                    </button>
                  </FormularioAccion>
                  <FormularioAccion accion={cancelarAutorizacion} className="flex items-center py-2">
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
                    >
                      Rechazar
                    </button>
                  </FormularioAccion>
                  </div>
                ) : (
                  <FormularioAccion accion={cancelarAutorizacion} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="id" value={s.id} />
                    <span className="text-sm text-emerald-700 dark:text-emerald-400">Autorizado</span>
                    {s.meet_url && (
                      <a
                        href={s.meet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                      >
                        {s.meet_url}
                      </a>
                    )}
                    <button
                      type="submit"
                      className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
                    >
                      Cancelar autorización
                    </button>
                  </FormularioAccion>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
