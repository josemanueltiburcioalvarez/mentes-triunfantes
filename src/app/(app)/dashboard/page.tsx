import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esHabilidadPracticable, HABILIDADES_PRACTICABLES, NOMBRES_HABILIDAD } from "@/lib/ejercicios/generador";
import FormularioAccion from "@/components/formulario-accion";
import { solicitarEvaluacionNivel } from "./acciones";

const ORDEN_HABILIDADES = [
  ...HABILIDADES_PRACTICABLES,
  "atajos",
  "razonamiento",
] as const;

const NOMBRES_LEGIBLES: Record<(typeof ORDEN_HABILIDADES)[number], string> = {
  ...NOMBRES_HABILIDAD,
  atajos: "Atajos",
  razonamiento: "Razonamiento",
};

export default async function DashboardPage() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // todas las consultas viajan juntas (en vez de esperar el rol y el resumen antes de lanzar el resto)
  const [
    { data: perfil },
    { data: filas },
    { data: nivelesTabla },
    { data: habilidadesTabla },
    { data: examenesHabilidad },
    { data: evaluacionesNivel },
    { data: autorizacionesNivel },
  ] = await Promise.all([
    supabase.from("perfiles").select("rol").eq("id", user.id).single(),
    supabase.from("vista_resumen_estudiante").select("*").eq("estudiante_id", user.id),
    supabase.from("niveles").select("id, nombre, orden"),
    supabase.from("habilidades").select("id, nivel_id, nombre"),
    supabase.from("evaluaciones_habilidad").select("habilidad_id").eq("estudiante_id", user.id).eq("aprobado", true),
    supabase.from("evaluaciones_nivel").select("nivel_id").eq("estudiante_id", user.id).eq("aprobado", true),
    supabase
      .from("autorizaciones_examen")
      .select("nivel_id, estado, meet_url")
      .eq("estudiante_id", user.id)
      .not("nivel_id", "is", null)
      .in("estado", ["solicitado", "autorizado"]),
  ]);

  if (perfil?.rol === "admin") redirect("/admin");
  if (perfil?.rol === "profesor") redirect("/profesor");

  const idsExamenesAprobados = new Set((examenesHabilidad ?? []).map((e) => e.habilidad_id));
  const idsNivelesAprobados = new Set((evaluacionesNivel ?? []).map((e) => e.nivel_id));

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
        {nivelesOrdenados.map((nivel) => {
          const nivelFila = (nivelesTabla ?? []).find((n) => n.orden === nivel.orden);
          const habilidadesDelNivel = (habilidadesTabla ?? []).filter((h) => h.nivel_id === nivelFila?.id);
          const nivelListoParaEvaluar =
            habilidadesDelNivel.length > 0 && habilidadesDelNivel.every((h) => esHabilidadPracticable(h.nombre));
          const todosExamenesAprobados = habilidadesDelNivel.every((h) => idsExamenesAprobados.has(h.id));
          const nivelAprobado = nivelFila ? idsNivelesAprobados.has(nivelFila.id) : false;
          const autorizacion = (autorizacionesNivel ?? []).find((a) => a.nivel_id === nivelFila?.id);

          return (
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
                    const tienePractica = esHabilidadPracticable(nombreHabilidad);

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
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/practicar/${nombreHabilidad}`}
                              className="inline-block rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                            >
                              Practicar
                            </Link>
                            <Link
                              href={`/guia/${nombreHabilidad}/1`}
                              className="text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                            >
                              Ver guía
                            </Link>
                          </div>
                        ) : desbloqueada ? (
                          <span className="text-xs text-zinc-400">Próximamente</span>
                        ) : (
                          <span className="text-xs text-zinc-400">Bloqueada</span>
                        )}
                      </div>
                    );
                  })}
              </div>

              {nivelListoParaEvaluar && nivelFila && (
                <div
                  className={`mt-3 rounded-xl border p-4 text-center ${
                    nivelAprobado
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <div className="mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Evaluación del nivel {nivel.nombre}
                  </div>

                  {nivelAprobado ? (
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      ¡Nivel aprobado!
                    </span>
                  ) : !todosExamenesAprobados ? (
                    <span className="text-xs text-zinc-400">
                      Aprueba el examen final de todas las habilidades del nivel para poder solicitarla
                    </span>
                  ) : autorizacion?.estado === "autorizado" && autorizacion.meet_url ? (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Tu profesor autorizó la evaluación. Entra a la reunión de Meet y luego comienza.
                      </p>
                      <a
                        href={autorizacion.meet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                      >
                        Abrir reunión de Meet
                      </a>
                      <Link
                        href={`/nivel/${nivel.orden}/examen`}
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                      >
                        Ir a la evaluación
                      </Link>
                    </div>
                  ) : autorizacion?.estado === "solicitado" ? (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      Solicitud enviada. Tu profesor te enviará el link de Meet.
                    </span>
                  ) : (
                    <FormularioAccion accion={solicitarEvaluacionNivel} className="flex flex-col items-center gap-2">
                      <input type="hidden" name="nivel_id" value={nivelFila.id} />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {nivel.orden >= nivelesOrdenados[nivelesOrdenados.length - 1].orden
                          ? "Se rinde en vivo por Meet con tu profesor y cierra el programa."
                          : "Se rinde en vivo por Meet con tu profesor y da acceso al siguiente nivel."}
                      </p>
                      <button
                        type="submit"
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                      >
                        Solicitar evaluación de nivel
                      </button>
                    </FormularioAccion>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
