import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, NOMBRES_HABILIDAD, TIPOS_SESION, tiempoRelativo } from "@/lib/admin";
import FormularioAccion from "@/components/formulario-accion";
import Paginacion from "@/components/admin/paginacion";
import { abrirHabilidad, cambiarEstadoEstudiante } from "../acciones";

const SESIONES_POR_PAGINA = 10;
const ORDEN_NIVELES = ["Básico", "Intermedio", "Avanzado", "Experto"];

const ETIQUETA_ESTADO: Record<string, string> = { activo: "Activo", inactivo: "Inactivo", suspendido: "Suspendido" };

export default async function FichaEstudiantePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const bruto = Array.isArray(sp.pagina) ? sp.pagina[0] : sp.pagina;
  const pagina = Math.max(1, Math.floor(Number(bruto)) || 1);

  const supabase = await crearClienteServidor();

  const { data: estudiante } = await supabase.from("vista_estudiantes_admin").select("*").eq("id", id).maybeSingle();
  if (!estudiante) notFound();

  const [progresoHab, progresoEj, evalHab, evalNivel, sesiones, sospechosas] = await Promise.all([
    supabase
      .from("progreso_habilidad")
      .select(
        "habilidad_id, porcentaje_dominio, desbloqueada, total_intentos, ultima_practica, habilidad:habilidades(nombre, orden, nivel:niveles(nombre, orden))"
      )
      .eq("estudiante_id", id),
    supabase
      .from("progreso_ejercicio")
      .select("habilidad_id, digito, numero_ejercicio, desbloqueado, aprobado, mejor_puntaje")
      .eq("estudiante_id", id),
    supabase
      .from("evaluaciones_habilidad")
      .select("id, puntaje, aprobado, created_at, habilidad:habilidades(nombre)")
      .eq("estudiante_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("evaluaciones_nivel")
      .select("id, puntaje, aprobado, created_at, nivel:niveles(nombre)")
      .eq("estudiante_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("sesiones")
      .select(
        "id, tipo, inicio, fin, total_ejercicios, correctos, digito, numero_ejercicio, habilidad:habilidades(nombre), nivel:niveles(nombre)",
        { count: "exact" }
      )
      .eq("estudiante_id", id)
      .gt("total_ejercicios", 0) // las sesiones abiertas sin ninguna respuesta no aportan informacion
      .order("inicio", { ascending: false })
      .range((pagina - 1) * SESIONES_POR_PAGINA, pagina * SESIONES_POR_PAGINA - 1),
    supabase
      .from("vista_sesiones_sospechosas")
      .select("*")
      .eq("estudiante_id", id)
      .eq("sospechosa", true)
      .order("inicio", { ascending: false })
      .limit(10),
  ]);

  // estado de cada uno de los 15 ejercicios, por habilidad
  const ejercicios = new Map<string, { desbloqueado: boolean; aprobado: boolean; puntaje: number }>();
  (progresoEj.data ?? []).forEach((p) =>
    ejercicios.set(`${p.habilidad_id}-${p.digito}-${p.numero_ejercicio}`, {
      desbloqueado: p.desbloqueado,
      aprobado: p.aprobado,
      puntaje: Number(p.mejor_puntaje),
    })
  );

  // habilidades agrupadas por nivel
  const porNivel = new Map<string, NonNullable<typeof progresoHab.data>>();
  (progresoHab.data ?? []).forEach((ph) => {
    const nivel = ph.habilidad?.nivel?.nombre ?? "—";
    porNivel.set(nivel, [...(porNivel.get(nivel) ?? []), ph]);
  });
  const niveles = ORDEN_NIVELES.filter((n) => porNivel.has(n));

  const examenes = [
    ...(evalHab.data ?? []).map((e) => ({
      id: e.id,
      nombre: NOMBRES_HABILIDAD[e.habilidad?.nombre ?? ""] ?? e.habilidad?.nombre ?? "—",
      puntaje: Number(e.puntaje),
      aprobado: e.aprobado,
      fecha: e.created_at,
    })),
    ...(evalNivel.data ?? []).map((e) => ({
      id: e.id,
      nombre: `Evaluación del nivel ${e.nivel?.nombre ?? ""}`,
      puntaje: Number(e.puntaje),
      aprobado: e.aprobado,
      fecha: e.created_at,
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const totalSesiones = sesiones.count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalSesiones / SESIONES_POR_PAGINA));
  const avance = Math.round(Number(estudiante.avance ?? 0));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/estudiantes" className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
          ← Volver a estudiantes
        </Link>
      </div>

      {/* Datos generales */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{estudiante.nombre}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{estudiante.email ?? "Sin correo"}</p>
          </div>
          <FormularioAccion accion={cambiarEstadoEstudiante} className="flex flex-col items-end gap-1">
            <input type="hidden" name="id" value={id} />
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              Estado
              <select
                key={estudiante.estado}
                name="estado"
                defaultValue={estudiante.estado ?? "activo"}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                {Object.entries(ETIQUETA_ESTADO).map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Guardar
              </button>
            </label>
          </FormularioAccion>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Dato titulo="Nivel actual" valor={estudiante.nivel_actual ?? "—"} />
          <Dato titulo="Avance general" valor={`${avance}%`} />
          <Dato titulo="Último acceso" valor={tiempoRelativo(estudiante.fecha_ultimo_acceso)} ayuda={formatearFecha(estudiante.fecha_ultimo_acceso)} />
          <Dato titulo="Registrado" valor={formatearFecha(estudiante.created_at)} />
        </dl>
        {(estudiante.solicitudes_abiertas ?? 0) > 0 && (
          <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
            Tiene una solicitud de examen abierta.{" "}
            <Link href="/admin/examenes" className="font-medium underline-offset-2 hover:underline">
              Ir a exámenes
            </Link>
          </p>
        )}
      </section>

      {/* Progreso por nivel y habilidad */}
      <section>
        <h2 className="mb-1 text-lg font-medium text-zinc-800 dark:text-zinc-200">Progreso</h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Cada cuadro es un ejercicio (5 niveles de dificultad × 3 ejercicios):{" "}
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500 align-middle" /> aprobado ·{" "}
          <span className="inline-block h-3 w-3 rounded-sm border border-zinc-400 align-middle" /> disponible ·{" "}
          <span className="inline-block h-3 w-3 rounded-sm bg-zinc-200 align-middle dark:bg-zinc-800" /> bloqueado.
        </p>
        <div className="flex flex-col gap-5">
          {niveles.map((nivel) => (
            <div key={nivel}>
              <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{nivel}</h3>
              <ul className="flex flex-col gap-2">
                {(porNivel.get(nivel) ?? [])
                  .slice()
                  .sort((a, b) => (a.habilidad?.orden ?? 0) - (b.habilidad?.orden ?? 0))
                  .map((ph) => {
                    const nombre = NOMBRES_HABILIDAD[ph.habilidad?.nombre ?? ""] ?? ph.habilidad?.nombre ?? "—";
                    const sinContenido = ph.habilidad?.nombre === "atajos" || ph.habilidad?.nombre === "razonamiento";
                    return (
                      <li
                        key={ph.habilidad_id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="w-56 min-w-40">
                          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {nombre} {!ph.desbloqueada && <span title="Bloqueada">🔒</span>}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {Math.round(Number(ph.porcentaje_dominio))}% · {ph.total_intentos} respuestas
                            {ph.ultima_practica ? ` · ${tiempoRelativo(ph.ultima_practica)}` : ""}
                          </div>
                        </div>
                        <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1" style={{ width: "15rem" }} aria-label={`Ejercicios de ${nombre}`}>
                          {[1, 2, 3, 4, 5].flatMap((d) =>
                            [1, 2, 3].map((n) => {
                              const e = ejercicios.get(`${ph.habilidad_id}-${d}-${n}`);
                              return (
                                <span
                                  key={`${d}-${n}`}
                                  title={`Nivel ${d} · ejercicio ${n}: ${
                                    e?.aprobado ? `aprobado (${Math.round(e.puntaje)}%)` : e?.desbloqueado ? "disponible" : "bloqueado"
                                  }`}
                                  className={`h-4 rounded-sm ${
                                    e?.aprobado
                                      ? "bg-emerald-500"
                                      : e?.desbloqueado
                                        ? "border border-zinc-400 dark:border-zinc-500"
                                        : "bg-zinc-200 dark:bg-zinc-800"
                                  }`}
                                />
                              );
                            })
                          )}
                        </div>
                        <div className="ml-auto">
                          {!ph.desbloqueada && !sinContenido && (
                            <FormularioAccion accion={abrirHabilidad} className="flex flex-col items-end gap-1">
                              <input type="hidden" name="estudiante_id" value={id} />
                              <input type="hidden" name="habilidad_id" value={ph.habilidad_id} />
                              <button
                                type="submit"
                                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                Abrir habilidad
                              </button>
                            </FormularioAccion>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Exámenes */}
      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">Exámenes y evaluaciones</h2>
        {examenes.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Todavía no rindió ningún examen.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Examen</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Puntaje</th>
                  <th className="px-3 py-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {examenes.map((e) => (
                  <tr key={e.id} className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    <td className="px-3 py-2">{e.nombre}</td>
                    <td className="px-3 py-2">{formatearFecha(e.fecha)}</td>
                    <td className="px-3 py-2">{Math.round(e.puntaje)}%</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          e.aprobado
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {e.aprobado ? "Aprobado" : "No aprobado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Alertas */}
      {(sospechosas.data ?? []).length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">Sesiones sospechosas</h2>
          <div className="overflow-x-auto rounded-xl border border-red-200 dark:border-red-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-red-50 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <tr>
                  <th className="px-3 py-2">Habilidad</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Aciertos</th>
                  <th className="px-3 py-2">Tiempo prom.</th>
                  <th className="px-3 py-2">Muy rápidas</th>
                  <th className="px-3 py-2">Sin llevadas</th>
                </tr>
              </thead>
              <tbody>
                {(sospechosas.data ?? []).map((s) => (
                  <tr key={s.sesion_id} className="border-t border-red-100 bg-white dark:border-red-950 dark:bg-zinc-950">
                    <td className="px-3 py-2">
                      {s.habilidad_nombre ? (NOMBRES_HABILIDAD[s.habilidad_nombre] ?? s.habilidad_nombre) : `Nivel ${s.nivel_nombre ?? ""}`}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sesiones */}
      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">Sesiones</h2>
        {(sesiones.data ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Todavía no practicó.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Habilidad</th>
                  <th className="px-3 py-2">Aciertos</th>
                  <th className="px-3 py-2">Duración</th>
                </tr>
              </thead>
              <tbody>
                {(sesiones.data ?? []).map((s) => {
                  const minutos = s.fin ? Math.max(1, Math.round((new Date(s.fin).getTime() - new Date(s.inicio).getTime()) / 60000)) : null;
                  return (
                    <tr key={s.id} className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                      <td className="px-3 py-2">{formatearFecha(s.inicio)}</td>
                      <td className="px-3 py-2">{TIPOS_SESION[s.tipo] ?? s.tipo}</td>
                      <td className="px-3 py-2">
                        {s.habilidad?.nombre
                          ? `${NOMBRES_HABILIDAD[s.habilidad.nombre] ?? s.habilidad.nombre}${s.digito ? ` · ${s.digito}.${s.numero_ejercicio}` : ""}`
                          : `Nivel ${s.nivel?.nombre ?? ""}`}
                      </td>
                      <td className="px-3 py-2">
                        {s.total_ejercicios > 0 ? `${s.correctos}/${s.total_ejercicios}` : s.fin ? "—" : "sin respuestas"}
                      </td>
                      <td className="px-3 py-2">{minutos ? `${minutos} min` : "sin terminar"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={totalSesiones}
          porPagina={SESIONES_POR_PAGINA}
          ruta={`/admin/estudiantes/${id}`}
          parametros={{}}
        />
      </section>
    </div>
  );
}

function Dato({ titulo, valor, ayuda }: { titulo: string; valor: string; ayuda?: string }) {
  return (
    <div title={ayuda}>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{titulo}</dt>
      <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50">{valor}</dd>
    </div>
  );
}
