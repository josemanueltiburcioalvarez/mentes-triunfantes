import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, NOMBRES_HABILIDAD } from "@/lib/admin";
import { ETIQUETAS_ACCION, type TipoAccion } from "@/lib/admin-log";
import Paginacion from "@/components/admin/paginacion";

const POR_PAGINA = 20;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const GRUPOS: Record<string, { texto: string; tipos: TipoAccion[] }> = {
  examenes: { texto: "Exámenes", tipos: ["autorizar_examen", "cancelar_autorizacion"] },
  estudiantes: { texto: "Estudiantes", tipos: ["cambiar_estado", "abrir_habilidad"] },
  alertas: { texto: "Alertas", tipos: ["revisar_alerta", "deshacer_revision"] },
};

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const grupo = uno(sp.grupo) in GRUPOS ? uno(sp.grupo) : "";
  const pagina = Math.max(1, Math.floor(Number(uno(sp.pagina))) || 1);

  const supabase = await crearClienteServidor();
  let consulta = supabase.from("acciones_admin").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (grupo) consulta = consulta.in("tipo", GRUPOS[grupo].tipos);
  const { data, count } = await consulta.range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  const acciones = data ?? [];

  // nombres de las personas, habilidades y niveles que aparecen en esta pagina
  const idsPersonas = [...new Set(acciones.flatMap((a) => [a.admin_id, a.estudiante_id]).filter((x): x is string => !!x))];
  const [personas, habilidades, niveles] = await Promise.all([
    idsPersonas.length ? supabase.from("perfiles").select("id, nombre").in("id", idsPersonas) : Promise.resolve({ data: [] }),
    supabase.from("habilidades").select("id, nombre"),
    supabase.from("niveles").select("id, nombre"),
  ]);
  const nombrePersona = new Map((personas.data ?? []).map((p) => [p.id, p.nombre]));
  const nombreHabilidad = new Map((habilidades.data ?? []).map((h) => [h.id, NOMBRES_HABILIDAD[h.nombre] ?? h.nombre]));
  const nombreNivel = new Map((niveles.data ?? []).map((n) => [n.id, n.nombre]));

  function detalleTexto(a: (typeof acciones)[number]): string {
    const d = (a.detalle ?? {}) as Record<string, unknown>;
    const hab = typeof d.habilidad_id === "string" ? nombreHabilidad.get(d.habilidad_id) : undefined;
    const niv = typeof d.nivel_id === "string" ? nombreNivel.get(d.nivel_id) : undefined;
    const objeto = hab ?? (niv ? `Evaluación del nivel ${niv}` : "");
    switch (a.tipo) {
      case "autorizar_examen":
      case "cancelar_autorizacion":
        return objeto;
      case "cambiar_estado":
        return `Nuevo estado: ${String(d.estado ?? "")}`;
      case "abrir_habilidad":
        return objeto;
      case "revisar_alerta":
        return `${d.estado === "descartada" ? "Descartada" : "Revisada"}${d.nota ? `: ${String(d.nota)}` : ""}`;
      default:
        return "";
    }
  }

  const total = count ?? 0;
  const chip = (activo: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${
      activo
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
    }`;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Registro de acciones</h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Quién hizo qué en el panel: autorizaciones de examen, cambios de estado, habilidades abiertas y alertas revisadas.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/registro" className={chip(!grupo)}>
          Todas
        </Link>
        {Object.entries(GRUPOS).map(([clave, g]) => (
          <Link key={clave} href={`/admin/registro?grupo=${clave}`} className={chip(grupo === clave)}>
            {g.texto}
          </Link>
        ))}
      </div>

      {acciones.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Todavía no hay acciones registradas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Administrador</th>
                <th className="px-3 py-2">Acción</th>
                <th className="px-3 py-2">Estudiante</th>
                <th className="px-3 py-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {acciones.map((a) => (
                <tr key={a.id} className="border-t border-zinc-200 bg-white align-top dark:border-zinc-800 dark:bg-zinc-950">
                  <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(a.created_at)}</td>
                  <td className="px-3 py-2">{a.admin_id ? (nombrePersona.get(a.admin_id) ?? "—") : "—"}</td>
                  <td className="px-3 py-2">{ETIQUETAS_ACCION[a.tipo as TipoAccion] ?? a.tipo}</td>
                  <td className="px-3 py-2">
                    {a.estudiante_id ? (
                      <Link href={`/admin/estudiantes/${a.estudiante_id}`} className="underline-offset-2 hover:underline">
                        {nombrePersona.get(a.estudiante_id) ?? "Estudiante"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{detalleTexto(a)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacion
        pagina={pagina}
        totalPaginas={Math.max(1, Math.ceil(total / POR_PAGINA))}
        total={total}
        porPagina={POR_PAGINA}
        ruta="/admin/registro"
        parametros={{ grupo: grupo || undefined }}
      />
    </div>
  );
}
