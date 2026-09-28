import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, haceDias, tiempoRelativo } from "@/lib/admin";
import FiltrosEstudiantes from "@/components/admin/filtros-estudiantes";
import Paginacion from "@/components/admin/paginacion";

const POR_PAGINA = 20;

type Parametros = Record<string, string | string[] | undefined>;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

// Lista de estudiantes con busqueda, filtros, orden y paginacion. La usa tanto el panel de admin
// (todos los estudiantes) como la vista del profesor (el RLS de la base de datos restringe
// "vista_estudiantes_admin" a los estudiantes que tiene asignados y activos).
export default async function ListaEstudiantes({ searchParams, basePath }: { searchParams: Parametros; basePath: string }) {
  const sp = searchParams;
  const filtros = {
    q: uno(sp.q).trim().slice(0, 60),
    nivel: ["1", "2", "3", "4"].includes(uno(sp.nivel)) ? uno(sp.nivel) : "",
    estado: ["activo", "inactivo", "suspendido"].includes(uno(sp.estado)) ? uno(sp.estado) : "",
    inactivo: ["7", "15", "30"].includes(uno(sp.inactivo)) ? uno(sp.inactivo) : "",
    alerta: ["alertas", "examen"].includes(uno(sp.alerta)) ? uno(sp.alerta) : "",
    orden: ["avance", "avance_asc", "reciente", "antiguo"].includes(uno(sp.orden)) ? uno(sp.orden) : "",
  };
  const pagina = Math.max(1, Math.floor(Number(uno(sp.pagina))) || 1);

  const supabase = await crearClienteServidor();
  let consulta = supabase.from("vista_estudiantes_admin").select("*", { count: "exact" });

  if (filtros.q) {
    // se quitan los caracteres con significado especial en los filtros de la API
    const t = filtros.q.replace(/[%,()"\\*]/g, " ").trim();
    if (t) consulta = consulta.or(`nombre.ilike.%${t}%,email.ilike.%${t}%`);
  }
  if (filtros.nivel) consulta = consulta.eq("nivel_orden", Number(filtros.nivel));
  if (filtros.estado) consulta = consulta.eq("estado", filtros.estado as "activo" | "inactivo" | "suspendido");
  if (filtros.inactivo) {
    const limite = haceDias(Number(filtros.inactivo));
    consulta = consulta.or(`fecha_ultimo_acceso.is.null,fecha_ultimo_acceso.lt.${limite}`);
  }
  if (filtros.alerta === "alertas") consulta = consulta.gt("alertas", 0);
  if (filtros.alerta === "examen") consulta = consulta.gt("solicitudes_abiertas", 0);

  switch (filtros.orden) {
    case "avance":
      consulta = consulta.order("avance", { ascending: false }).order("nombre");
      break;
    case "avance_asc":
      consulta = consulta.order("avance", { ascending: true }).order("nombre");
      break;
    case "reciente":
      consulta = consulta.order("fecha_ultimo_acceso", { ascending: false, nullsFirst: false }).order("nombre");
      break;
    case "antiguo":
      consulta = consulta.order("fecha_ultimo_acceso", { ascending: true, nullsFirst: true }).order("nombre");
      break;
    default:
      consulta = consulta.order("nombre");
  }

  const { data, count, error } = await consulta.range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  // pagina fuera de rango (por ejemplo tras filtrar): vuelve a la primera
  if (error && pagina > 1) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filtros)) if (v) q.set(k, v);
    redirect(q.toString() ? `${basePath}?${q}` : basePath);
  }

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const estudiantes = data ?? [];

  return (
    <div>
      <FiltrosEstudiantes inicial={filtros} />

      {error && pagina === 1 ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          No se pudo cargar la lista. Inténtalo de nuevo.
        </p>
      ) : estudiantes.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          No hay estudiantes con esos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Estudiante</th>
                <th className="px-3 py-2">Nivel</th>
                <th className="px-3 py-2">Avance</th>
                <th className="px-3 py-2">Último acceso</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Pendientes</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`${basePath}/${e.id}`}
                      className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
                    >
                      {e.nombre}
                    </Link>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{e.email ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2">{e.nivel_actual ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Number(e.avance ?? 0))}%` }} />
                      </div>
                      <span className="text-xs text-zinc-600 dark:text-zinc-300">{Math.round(Number(e.avance ?? 0))}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2" title={formatearFecha(e.fecha_ultimo_acceso)}>
                    {tiempoRelativo(e.fecha_ultimo_acceso)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.estado === "activo"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {e.estado === "activo" ? "Activo" : e.estado === "suspendido" ? "Suspendido" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(e.solicitudes_abiertas ?? 0) > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Examen
                        </span>
                      )}
                      {(e.alertas ?? 0) > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                          {e.alertas} alerta{e.alertas === 1 ? "" : "s"}
                        </span>
                      )}
                      {(e.solicitudes_abiertas ?? 0) === 0 && (e.alertas ?? 0) === 0 && (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacion pagina={pagina} totalPaginas={totalPaginas} total={total} porPagina={POR_PAGINA} ruta={basePath} parametros={filtros} />
    </div>
  );
}
