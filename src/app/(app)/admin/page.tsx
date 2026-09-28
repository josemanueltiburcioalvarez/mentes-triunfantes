import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, haceDias, NOMBRES_HABILIDAD, tiempoRelativo } from "@/lib/admin";

export default async function ResumenPage() {
  const supabase = await crearClienteServidor();
  const hace7 = haceDias(7);

  const [total, activos, solicitudes, alertas, ingresos, atencion, examenes] = await Promise.all([
    supabase.from("vista_estudiantes_admin").select("id", { count: "exact", head: true }),
    supabase.from("vista_estudiantes_admin").select("id", { count: "exact", head: true }).gte("fecha_ultimo_acceso", hace7),
    supabase.from("autorizaciones_examen").select("id", { count: "exact", head: true }).eq("estado", "solicitado"),
    supabase.from("vista_sesiones_sospechosas").select("sesion_id", { count: "exact", head: true }).eq("sospechosa", true).is("revision_estado", null),
    supabase.from("vista_ingresos").select("vencidas, por_vencer_7_dias").maybeSingle(),
    supabase
      .from("vista_estudiantes_admin")
      .select("id, nombre, alertas, solicitudes_abiertas, fecha_ultimo_acceso")
      .eq("estado", "activo")
      .or(`alertas.gt.0,solicitudes_abiertas.gt.0,fecha_ultimo_acceso.is.null,fecha_ultimo_acceso.lt.${hace7}`)
      .order("alertas", { ascending: false })
      .order("fecha_ultimo_acceso", { ascending: true, nullsFirst: true })
      .limit(8),
    supabase
      .from("evaluaciones_habilidad")
      .select("id, puntaje, aprobado, created_at, estudiante_id, estudiante:perfiles!evaluaciones_habilidad_estudiante_id_fkey(nombre), habilidad:habilidades(nombre)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const tarjetas = [
    { titulo: "Estudiantes", valor: total.count ?? 0, ayuda: "registrados", href: "/admin/estudiantes" },
    { titulo: "Activos esta semana", valor: activos.count ?? 0, ayuda: "entraron en los últimos 7 días", href: "/admin/estudiantes?orden=reciente" },
    { titulo: "Exámenes por autorizar", valor: solicitudes.count ?? 0, ayuda: "solicitudes esperando el enlace de Meet", href: "/admin/examenes", alerta: (solicitudes.count ?? 0) > 0 },
    { titulo: "Sesiones sospechosas", valor: alertas.count ?? 0, ayuda: "para revisar", href: "/admin/alertas", alerta: (alertas.count ?? 0) > 0 },
    {
      titulo: "Suscripciones vencidas",
      valor: ingresos.data?.vencidas ?? 0,
      ayuda: `${ingresos.data?.por_vencer_7_dias ?? 0} más vencen en 7 días`,
      href: "/admin/suscripciones",
      alerta: (ingresos.data?.vencidas ?? 0) > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Resumen</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tarjetas.map((t) => (
          <Link
            key={t.titulo}
            href={t.href}
            className={`rounded-2xl border p-4 hover:border-zinc-400 dark:hover:border-zinc-600 ${
              t.alerta
                ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{t.valor}</div>
            <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{t.titulo}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{t.ayuda}</div>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">Necesitan atención</h2>
        {(atencion.data ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Todos los estudiantes activos están al día.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {(atencion.data ?? []).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <Link href={`/admin/estudiantes/${e.id}`} className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50">
                  {e.nombre}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {(e.alertas ?? 0) > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                      {e.alertas} alerta{e.alertas === 1 ? "" : "s"}
                    </span>
                  )}
                  {(e.solicitudes_abiertas ?? 0) > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Examen pendiente
                    </span>
                  )}
                  <span className="text-zinc-500 dark:text-zinc-400">último acceso {tiempoRelativo(e.fecha_ultimo_acceso)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">Últimos exámenes</h2>
        {(examenes.data ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Todavía no hay exámenes rendidos.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {(examenes.data ?? []).map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <Link href={`/admin/estudiantes/${x.estudiante_id}`} className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50">
                    {x.estudiante?.nombre ?? "Estudiante"}
                  </Link>{" "}
                  · {NOMBRES_HABILIDAD[x.habilidad?.nombre ?? ""] ?? x.habilidad?.nombre}
                </span>
                <span className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatearFecha(x.created_at)}
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      x.aprobado
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {Math.round(Number(x.puntaje))}% · {x.aprobado ? "Aprobado" : "No aprobado"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
