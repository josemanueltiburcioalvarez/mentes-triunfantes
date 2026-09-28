import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, NOMBRES_HABILIDAD, TIPOS_SESION } from "@/lib/admin";
import FormularioAccion from "@/components/formulario-accion";
import Paginacion from "@/components/admin/paginacion";
import { reabrirAlerta, revisarAlerta } from "./acciones";

const POR_PAGINA = 20;
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AlertasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const verRevisadas = uno(sp.ver) === "revisadas";
  const pagina = Math.max(1, Math.floor(Number(uno(sp.pagina))) || 1);

  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("vista_sesiones_sospechosas")
    .select("*", { count: "exact" })
    .eq("sospechosa", true)
    .order("inicio", { ascending: false });
  consulta = verRevisadas ? consulta.not("revision_estado", "is", null) : consulta.is("revision_estado", null);

  const { data, count } = await consulta.range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  const sesiones = data ?? [];
  const total = count ?? 0;

  const pestana = (activa: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${
      activa
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
    }`;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Sesiones sospechosas</h1>
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        Sesiones con muchas respuestas más rápidas de lo posible a mano, u operaciones con llevadas resueltas sin
        escribir ninguna. Revisa cada una y márcala como <strong>revisada</strong> (confirmaste que hay que vigilar) o{" "}
        <strong>descartada</strong> (falsa alarma).
      </p>

      <div className="mb-4 flex gap-2">
        <Link href="/admin/alertas" className={pestana(!verRevisadas)}>
          Pendientes
        </Link>
        <Link href="/admin/alertas?ver=revisadas" className={pestana(verRevisadas)}>
          Revisadas
        </Link>
      </div>

      {sesiones.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {verRevisadas ? "Todavía no revisaste ninguna alerta." : "No hay alertas pendientes."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Estudiante</th>
                <th className="px-3 py-2">Habilidad</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Aciertos</th>
                <th className="px-3 py-2">Tiempo prom.</th>
                <th className="px-3 py-2">Muy rápidas</th>
                <th className="px-3 py-2">Sin llevadas</th>
                <th className="px-3 py-2">{verRevisadas ? "Revisión" : "Acción"}</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <tr key={s.sesion_id} className="border-t border-zinc-200 bg-white align-top dark:border-zinc-800 dark:bg-zinc-950">
                  <td className="px-3 py-2">
                    <Link href={`/admin/estudiantes/${s.estudiante_id}`} className="underline-offset-2 hover:underline">
                      {s.estudiante_nombre}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {s.habilidad_nombre
                      ? (NOMBRES_HABILIDAD[s.habilidad_nombre] ?? s.habilidad_nombre)
                      : `Nivel ${s.nivel_nombre ?? ""}`}
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{TIPOS_SESION[s.tipo ?? ""] ?? s.tipo}</div>
                  </td>
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
                  <td className="px-3 py-2">
                    {verRevisadas ? (
                      <div className="flex flex-col gap-1">
                        <span
                          className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.revision_estado === "descartada"
                              ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {s.revision_estado === "descartada" ? "Descartada" : "Revisada"} · {formatearFecha(s.revision_fecha)}
                        </span>
                        {s.revision_nota && <span className="max-w-56 text-xs text-zinc-600 dark:text-zinc-300">{s.revision_nota}</span>}
                        <FormularioAccion accion={reabrirAlerta} className="flex flex-col gap-1">
                          <input type="hidden" name="sesion_id" value={s.sesion_id ?? ""} />
                          <button type="submit" className="w-fit text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
                            Volver a pendientes
                          </button>
                        </FormularioAccion>
                      </div>
                    ) : (
                      <FormularioAccion accion={revisarAlerta} className="flex min-w-56 flex-col gap-1.5">
                        <input type="hidden" name="sesion_id" value={s.sesion_id ?? ""} />
                        <input
                          type="text"
                          name="nota"
                          maxLength={500}
                          placeholder="Nota (opcional)"
                          className="rounded-lg border border-zinc-300 px-2 py-1 text-xs outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            name="estado"
                            value="revisada"
                            className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                          >
                            Revisada
                          </button>
                          <button
                            type="submit"
                            name="estado"
                            value="descartada"
                            className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Descartar
                          </button>
                        </div>
                      </FormularioAccion>
                    )}
                  </td>
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
        ruta="/admin/alertas"
        parametros={{ ver: verRevisadas ? "revisadas" : undefined }}
      />
    </div>
  );
}
