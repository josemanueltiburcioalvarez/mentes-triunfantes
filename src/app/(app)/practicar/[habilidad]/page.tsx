import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { HabilidadBasica } from "@/lib/ejercicios/generador";
import { descripcionDigito, NOMBRES_HABILIDAD_BASICA } from "@/lib/ejercicios/generador";

const HABILIDADES_VALIDAS = new Set<HabilidadBasica>(["suma", "resta", "tabla_multiplicacion"]);
const DIGITOS = [1, 2, 3, 4, 5] as const;
const EJERCICIOS = [1, 2, 3] as const;

export default async function PracticarPage({
  params,
}: {
  params: Promise<{ habilidad: string }>;
}) {
  const { habilidad } = await params;

  if (!HABILIDADES_VALIDAS.has(habilidad as HabilidadBasica)) {
    return (
      <MensajeCentrado
        titulo="Habilidad no disponible"
        mensaje="Esta habilidad todavía no tiene práctica generada. Vuelve pronto."
      />
    );
  }
  const nombreHabilidad = habilidad as HabilidadBasica;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: habilidadFila } = await supabase
    .from("habilidades")
    .select("id, nombre, nota_aprobacion")
    .eq("nombre", nombreHabilidad)
    .single();

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

  const { data: progresoEjercicios } = await supabase
    .from("progreso_ejercicio")
    .select("digito, numero_ejercicio, desbloqueado, aprobado, mejor_puntaje")
    .eq("estudiante_id", user.id)
    .eq("habilidad_id", habilidadFila.id);

  const { data: evaluaciones } = await supabase
    .from("evaluaciones_habilidad")
    .select("aprobado, puntaje, created_at")
    .eq("estudiante_id", user.id)
    .eq("habilidad_id", habilidadFila.id)
    .order("created_at", { ascending: false });

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
          {NOMBRES_HABILIDAD_BASICA[nombreHabilidad]}
        </h1>
        <Link href="/dashboard" className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
          Volver al panel
        </Link>
      </div>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        {totalAprobados} de 15 ejercicios aprobados · {Math.round(progresoHabilidad.porcentaje_dominio)}% de avance
      </p>

      <div className="flex flex-col gap-6">
        {DIGITOS.map((digito) => (
          <section key={digito}>
            <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Dígito {digito} · {descripcionDigito(nombreHabilidad, digito)}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {EJERCICIOS.map((numero) => {
                const estado = mapaProgreso.get(`${digito}-${numero}`);
                const desbloqueado = estado?.desbloqueado ?? false;
                const aprobado = estado?.aprobado ?? false;

                const contenido = (
                  <div
                    className={`rounded-xl border p-4 text-center ${
                      aprobado
                        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                        : desbloqueado
                          ? "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
                          : "border-zinc-100 bg-zinc-100/60 dark:border-zinc-900 dark:bg-zinc-900/40"
                    }`}
                  >
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Ejercicio {numero}
                    </div>
                    <div className="mt-1 text-lg">
                      {aprobado ? "✅" : desbloqueado ? "10" : "🔒"}
                    </div>
                    {aprobado && (
                      <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
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
              Examen final de {NOMBRES_HABILIDAD_BASICA[nombreHabilidad]}
            </h2>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
              20 preguntas mezclando los 5 dígitos · {habilidadFila.nota_aprobacion}% para aprobar
            </p>

            {examenAprobado ? (
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                ¡Aprobado! Puedes repetirlo si quieres reforzar.
              </span>
            ) : !examenDisponible ? (
              <span className="text-sm text-zinc-400">
                Aprueba los 15 ejercicios de arriba para desbloquear el examen
              </span>
            ) : null}

            {(examenDisponible || examenAprobado) && (
              <Link
                href={`/practicar/${nombreHabilidad}/examen`}
                className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {examenAprobado ? "Repetir examen" : "Tomar examen"}
              </Link>
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
