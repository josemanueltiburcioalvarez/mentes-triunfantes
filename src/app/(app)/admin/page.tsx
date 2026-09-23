import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { autorizarExamen, cancelarAutorizacion } from "./acciones";

const NOMBRES_HABILIDAD: Record<string, string> = {
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

const TIPOS_SESION: Record<string, string> = {
  practica: "Práctica",
  evaluacion_habilidad: "Examen de habilidad",
  evaluacion: "Evaluación de nivel",
};

function formatearFecha(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminPage() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol !== "admin") redirect("/dashboard");

  const { data: solicitudes } = await supabase
    .from("autorizaciones_examen")
    .select(
      "id, estado, meet_url, created_at, estudiante:perfiles!autorizaciones_examen_estudiante_id_fkey(nombre), habilidad:habilidades(nombre), nivel:niveles(nombre)"
    )
    .in("estado", ["solicitado", "autorizado"])
    .order("created_at", { ascending: true });

  const { data: sospechosas } = await supabase
    .from("vista_sesiones_sospechosas")
    .select("*")
    .eq("sospechosa", true)
    .order("inicio", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Panel de administración
      </h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">Exámenes finales</h2>
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
                    {s.estudiante?.nombre ?? "Estudiante"} ·{" "}
                    {s.nivel
                      ? `Evaluación del nivel ${s.nivel.nombre}`
                      : (NOMBRES_HABILIDAD[s.habilidad?.nombre ?? ""] ?? s.habilidad?.nombre)}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Solicitado {formatearFecha(s.created_at)}
                  </span>
                </div>

                {s.estado === "solicitado" ? (
                  <form action={autorizarExamen} className="flex flex-wrap items-center gap-2">
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
                    <button
                      type="submit"
                      formAction={cancelarAutorizacion}
                      formNoValidate
                      className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
                    >
                      Rechazar
                    </button>
                  </form>
                ) : (
                  <form action={cancelarAutorizacion} className="flex flex-wrap items-center gap-3">
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
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-medium text-zinc-800 dark:text-zinc-200">
          Sesiones sospechosas
        </h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Sesiones con muchas respuestas más rápidas de lo posible a mano, u operaciones con llevadas
          resueltas sin escribir ninguna.
        </p>
        {(sospechosas ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin sesiones marcadas.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Estudiante</th>
                  <th className="px-3 py-2">Habilidad</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Aciertos</th>
                  <th className="px-3 py-2">Tiempo prom.</th>
                  <th className="px-3 py-2">Muy rápidas</th>
                  <th className="px-3 py-2">Sin llevadas</th>
                </tr>
              </thead>
              <tbody>
                {(sospechosas ?? []).map((s) => (
                  <tr key={s.sesion_id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-3 py-2">{s.estudiante_nombre}</td>
                    <td className="px-3 py-2">
                      {s.habilidad_nombre
                        ? (NOMBRES_HABILIDAD[s.habilidad_nombre] ?? s.habilidad_nombre)
                        : `Nivel ${s.nivel_nombre ?? ""}`}
                    </td>
                    <td className="px-3 py-2">{TIPOS_SESION[s.tipo ?? ""] ?? s.tipo}</td>
                    <td className="px-3 py-2">{formatearFecha(s.inicio)}</td>
                    <td className="px-3 py-2">
                      {s.correctos}/{s.total_intentos}
                    </td>
                    <td className="px-3 py-2">{s.segundos_promedio}s</td>
                    <td className="px-3 py-2">
                      {s.respuestas_rapidas}/{s.total_intentos}
                    </td>
                    <td className="px-3 py-2">
                      {s.sin_marcas}/{s.requerian_marcas}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
