import Link from "next/link";
import { verificarAcceso } from "@/lib/suscripcion";
import PantallaPlanes from "@/components/pantalla-planes";
import { CheckCircle2, Circle, Lock, XCircle } from "lucide-react";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { HabilidadPracticable } from "@/lib/ejercicios/generador";
import { descripcionDigito, esHabilidadPracticable, NOMBRES_HABILIDAD, usaNombreDigito } from "@/lib/ejercicios/generador";
import { guiasDe } from "@/lib/guias/catalogo";
import { habilidadDelEstudiante } from "@/lib/habilidad-estudiante";
import FormularioAccion from "@/components/formulario-accion";
import { solicitarExamen } from "./acciones";

const DIGITOS = [1, 2, 3, 4, 5] as const;
const EJERCICIOS = [1, 2, 3] as const;

export default async function PracticarPage({
  params,
}: {
  params: Promise<{ habilidad: string }>;
}) {
  const { habilidad } = await params;

  const acceso = await verificarAcceso();
  if (!acceso.permitido) return <PantallaPlanes acceso={acceso} />;

  if (!esHabilidadPracticable(habilidad)) {
    return (
      <MensajeCentrado
        titulo="Habilidad no disponible"
        mensaje="Esta habilidad todavía no tiene práctica generada. Vuelve pronto."
      />
    );
  }
  const nombreHabilidad = habilidad as HabilidadPracticable;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const habilidadFila = await habilidadDelEstudiante(supabase, user.id, nombreHabilidad);

  if (!habilidadFila) {
    return <MensajeCentrado titulo="Habilidad no encontrada" mensaje="No se encontró en el catálogo." />;
  }

  const { data: progresoHabilidad } = await supabase
    .from("progreso_habilidad")
    .select("desbloqueada, porcentaje_dominio")
    .eq("estudiante_id", user.id)
    .eq("habilidad_id", habilidadFila.id)
    .maybeSingle();

  if (!progresoHabilidad?.desbloqueada) {
    return (
      <MensajeCentrado
        titulo="Habilidad bloqueada"
        mensaje="Todavía no has desbloqueado esta habilidad. Sigue practicando las anteriores."
      />
    );
  }

  const [{ data: progresoEjercicios }, { data: evaluaciones }, { data: autorizacionAbierta }] = await Promise.all([
    supabase
      .from("progreso_ejercicio")
      .select("digito, numero_ejercicio, desbloqueado, aprobado, mejor_puntaje, intentos")
      .eq("estudiante_id", user.id)
      .eq("habilidad_id", habilidadFila.id),
    supabase
      .from("evaluaciones_habilidad")
      .select("aprobado, puntaje, created_at")
      .eq("estudiante_id", user.id)
      .eq("habilidad_id", habilidadFila.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("autorizaciones_examen")
      .select("estado, meet_url")
      .eq("estudiante_id", user.id)
      .eq("habilidad_id", habilidadFila.id)
      .in("estado", ["solicitado", "autorizado"])
      .maybeSingle(),
  ]);

  const mapaProgreso = new Map(
    (progresoEjercicios ?? []).map((p) => [`${p.digito}-${p.numero_ejercicio}`, p])
  );

  const totalAprobados = (progresoEjercicios ?? []).filter((p) => p.aprobado).length;
  const examenDisponible = totalAprobados === 15;
  const examenAprobado = (evaluaciones ?? []).some((e) => e.aprobado);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {NOMBRES_HABILIDAD[nombreHabilidad]}
        </h1>
        <Link href="/dashboard" className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
          Volver al panel
        </Link>
      </div>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        {totalAprobados} de 15 ejercicios aprobados · {Math.round(progresoHabilidad.porcentaje_dominio)}% de avance
      </p>

      <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
        <h2 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Antes de empezar: mira cómo se hace
        </h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
          {guiasDe(nombreHabilidad).length > 1
            ? "Tienes 2 guías paso a paso con ejemplos. Míralas antes de practicar y vuelve a ellas cuando quieras."
            : "Mira los trucos antes de practicar y vuelve a ellos cuando quieras."}
        </p>
        <div className="flex flex-wrap gap-2">
          {guiasDe(nombreHabilidad).map((g) => (
            <Link
              key={g.numero}
              href={`/guia/${nombreHabilidad}/${g.numero}`}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Guía {g.numero}: {g.titulo}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {DIGITOS.map((digito) => (
          <section key={digito}>
            <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {usaNombreDigito(nombreHabilidad) ? `Dígito ${digito} · ` : ""}
              {descripcionDigito(nombreHabilidad, digito)}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {EJERCICIOS.map((numero) => {
                const estado = mapaProgreso.get(`${digito}-${numero}`);
                const desbloqueado = estado?.desbloqueado ?? false;
                const aprobado = estado?.aprobado ?? false;
                const intentos = estado?.intentos ?? 0;
                // desbloqueado, ya lo intento y no aprobo: mostrar el puntaje en rojo para que sepa
                // que tiene que volver a intentarlo (antes no se mostraba nada y parecia "sin hacer").
                const noAprobado = desbloqueado && !aprobado && intentos > 0;

                const contenido = (
                  <div
                    className={`rounded-xl border p-4 text-center ${
                      aprobado
                        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                        : noAprobado
                          ? "border-red-200 bg-red-50 hover:border-red-300 dark:border-red-900 dark:bg-red-950/30"
                          : desbloqueado
                            ? "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
                            : "border-zinc-100 bg-zinc-100/60 dark:border-zinc-900 dark:bg-zinc-900/40"
                    }`}
                  >
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Ejercicio {numero}
                    </div>
                    <div className="mt-1 flex justify-center">
                      {aprobado ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      ) : noAprobado ? (
                        <XCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
                      ) : desbloqueado ? (
                        <Circle className="h-6 w-6 text-zinc-300 dark:text-zinc-700" />
                      ) : (
                        <Lock className="h-5 w-5 text-zinc-400" />
                      )}
                    </div>
                    {(aprobado || noAprobado) && (
                      <div
                        className={`mt-1 text-xs ${
                          aprobado ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {Math.round(estado!.mejor_puntaje)}%
                      </div>
                    )}
                  </div>
                );

                return desbloqueado ? (
                  <Link key={numero} href={`/practicar/${nombreHabilidad}/${digito}/${numero}`}>
                    {contenido}
                  </Link>
                ) : (
                  <div key={numero}>{contenido}</div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="mt-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div
            className={`rounded-xl border p-5 text-center ${
              examenAprobado
                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <h2 className="mb-1 text-base font-semibold text-zinc-800 dark:text-zinc-200">
              Examen final de {NOMBRES_HABILIDAD[nombreHabilidad]}
            </h2>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
              20 preguntas mezclando {usaNombreDigito(nombreHabilidad) ? "los 5 dígitos" : "todos los niveles"} ·{" "}
              {habilidadFila.nota_aprobacion}% para aprobar
            </p>

            {examenAprobado ? (
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                ¡Examen aprobado!
              </span>
            ) : !examenDisponible ? (
              <span className="text-sm text-zinc-400">
                Aprueba los 15 ejercicios de arriba para poder solicitar el examen
              </span>
            ) : autorizacionAbierta?.estado === "autorizado" && autorizacionAbierta.meet_url ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tu profesor autorizó el examen. Entra a la reunión de Meet y luego comienza.
                </p>
                <a
                  href={autorizacionAbierta.meet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                >
                  Abrir reunión de Meet
                </a>
                <Link
                  href={`/practicar/${nombreHabilidad}/examen`}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Ir al examen
                </Link>
              </div>
            ) : autorizacionAbierta?.estado === "solicitado" ? (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Solicitud enviada. Tu profesor te enviará el link de Meet.
              </span>
            ) : (
              <FormularioAccion accion={solicitarExamen} className="flex flex-col items-center gap-2">
                <input type="hidden" name="habilidad" value={nombreHabilidad} />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  El examen se rinde en vivo por Meet con tu profesor.
                </p>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Solicitar examen
                </button>
              </FormularioAccion>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MensajeCentrado({ titulo, mensaje }: { titulo: string; mensaje: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">{titulo}</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{mensaje}</p>
      <Link
        href="/dashboard"
        className="mt-2 text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        Volver al panel
      </Link>
    </div>
  );
}
