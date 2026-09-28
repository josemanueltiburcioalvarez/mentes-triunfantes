import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha } from "@/lib/admin";
import FormularioAccion from "@/components/formulario-accion";
import { asignarEstudiante, quitarEstudiante, quitarProfesor } from "../acciones";

type Parametros = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ProfesorDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Parametros>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const buscar = uno(sp.buscar).trim().slice(0, 60);

  const supabase = await crearClienteServidor();

  const { data: profesor } = await supabase.from("perfiles").select("id, nombre, email, created_at, rol").eq("id", id).maybeSingle();
  if (!profesor || profesor.rol !== "profesor") notFound();

  const { data: asignaciones } = await supabase
    .from("profesor_estudiante")
    .select("estudiante_id, fecha_asignacion, estudiante:perfiles!profesor_estudiante_estudiante_id_fkey(nombre, email)")
    .eq("profesor_id", id)
    .eq("activo", true)
    .order("fecha_asignacion", { ascending: false });

  const idsAsignados = new Set((asignaciones ?? []).map((a) => a.estudiante_id));

  let resultados: { id: string; nombre: string; email: string | null }[] = [];
  if (buscar) {
    const t = buscar.replace(/[%,()"\\*]/g, " ").trim();
    if (t) {
      const { data } = await supabase
        .from("perfiles")
        .select("id, nombre, email")
        .eq("rol", "estudiante")
        .or(`nombre.ilike.%${t}%,email.ilike.%${t}%`)
        .order("nombre")
        .limit(10);
      resultados = (data ?? []).filter((e) => !idsAsignados.has(e.id));
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/profesores" className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
          ← Volver a profesores
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{profesor.nombre}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {profesor.email ?? "Sin correo"} · profesor desde {formatearFecha(profesor.created_at)}
            </p>
          </div>
          <FormularioAccion accion={quitarProfesor}>
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Quitar rol de profesor
            </button>
          </FormularioAccion>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">Estudiantes asignados</h2>
        {(asignaciones ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Todavía no tiene estudiantes asignados.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {(asignaciones ?? []).map((a) => (
              <li key={a.estudiante_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">{a.estudiante?.nombre ?? "Estudiante"}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {a.estudiante?.email ?? "sin correo"} · asignado {formatearFecha(a.fecha_asignacion)}
                  </div>
                </div>
                <FormularioAccion accion={quitarEstudiante}>
                  <input type="hidden" name="profesor_id" value={id} />
                  <input type="hidden" name="estudiante_id" value={a.estudiante_id} />
                  <button type="submit" className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
                    Quitar
                  </button>
                </FormularioAccion>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">Asignar un estudiante</h2>
        <form method="get" className="mb-3 flex flex-wrap gap-2">
          <input
            type="search"
            name="buscar"
            defaultValue={buscar}
            placeholder="Nombre o correo del estudiante"
            className="min-w-64 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Buscar
          </button>
        </form>

        {buscar && (
          <>
            {resultados.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin resultados (o ya está asignado).</p>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {resultados.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-50">{e.nombre}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{e.email ?? "sin correo"}</div>
                    </div>
                    <FormularioAccion accion={asignarEstudiante}>
                      <input type="hidden" name="profesor_id" value={id} />
                      <input type="hidden" name="estudiante_id" value={e.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Asignar
                      </button>
                    </FormularioAccion>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
