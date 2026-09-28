import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ahoraIso, formatearFecha, haceDias, NOMBRES_HABILIDAD, tiempoRelativo } from "@/lib/admin";
import BotonImprimir from "@/components/admin/boton-imprimir";

const ORDEN_NIVELES = ["Básico", "Intermedio", "Avanzado", "Experto"];

// Informe de progreso de un estudiante, pensado para imprimir o guardar como PDF (por ejemplo para los padres).
export default async function InformePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: estudiante } = await supabase.from("vista_estudiantes_admin").select("*").eq("id", id).maybeSingle();
  if (!estudiante) notFound();

  const desde30 = haceDias(30);
  const [progreso, ejercicios, evalHab, evalNivel, sesiones] = await Promise.all([
    supabase
      .from("progreso_habilidad")
      .select("habilidad_id, porcentaje_dominio, desbloqueada, total_intentos, habilidad:habilidades(nombre, orden, nivel:niveles(nombre, orden))")
      .eq("estudiante_id", id),
    supabase.from("progreso_ejercicio").select("habilidad_id, aprobado").eq("estudiante_id", id).eq("aprobado", true),
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
    supabase.from("sesiones").select("total_ejercicios, correctos").eq("estudiante_id", id).gte("inicio", desde30).gt("total_ejercicios", 0),
  ]);

  const aprobadosPor = new Map<string, number>();
  (ejercicios.data ?? []).forEach((e) => aprobadosPor.set(e.habilidad_id, (aprobadosPor.get(e.habilidad_id) ?? 0) + 1));

  const habilidades = (progreso.data ?? [])
    .filter((p) => p.habilidad?.nombre !== "atajos" && p.habilidad?.nombre !== "razonamiento")
    .sort(
      (a, b) =>
        ORDEN_NIVELES.indexOf(a.habilidad?.nivel?.nombre ?? "") - ORDEN_NIVELES.indexOf(b.habilidad?.nivel?.nombre ?? "") ||
        (a.habilidad?.orden ?? 0) - (b.habilidad?.orden ?? 0)
    );

  const respuestas30 = (sesiones.data ?? []).reduce((n, s) => n + s.total_ejercicios, 0);
  const correctas30 = (sesiones.data ?? []).reduce((n, s) => n + s.correctos, 0);
  const examenes = [
    ...(evalHab.data ?? []).map((e) => ({ id: e.id, nombre: NOMBRES_HABILIDAD[e.habilidad?.nombre ?? ""] ?? "—", puntaje: Number(e.puntaje), aprobado: e.aprobado, fecha: e.created_at })),
    ...(evalNivel.data ?? []).map((e) => ({ id: e.id, nombre: `Evaluación del nivel ${e.nivel?.nombre ?? ""}`, puntaje: Number(e.puntaje), aprobado: e.aprobado, fecha: e.created_at })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/estudiantes/${id}`} className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
          ← Volver a la ficha
        </Link>
        <BotonImprimir />
      </div>

      <article className="rounded-2xl border border-zinc-200 bg-white p-8 print:border-0 print:p-0 dark:border-zinc-800 dark:bg-zinc-900 print:dark:bg-white">
        <header className="mb-6 border-b border-zinc-300 pb-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Mentes Triunfantes · Informe de progreso</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50 print:text-black">{estudiante.nombre}</h1>
          <p className="text-sm text-zinc-500">
            {estudiante.email ?? ""} · Emitido el {formatearFecha(ahoraIso())}
          </p>
        </header>

        <dl className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Dato titulo="Nivel actual" valor={estudiante.nivel_actual ?? "—"} />
          <Dato titulo="Avance general" valor={`${Math.round(Number(estudiante.avance ?? 0))}%`} />
          <Dato titulo="Último acceso" valor={tiempoRelativo(estudiante.fecha_ultimo_acceso)} />
          <Dato
            titulo="Últimos 30 días"
            valor={respuestas30 ? `${respuestas30} respuestas · ${Math.round((100 * correctas30) / respuestas30)}% de aciertos` : "sin actividad"}
          />
        </dl>

        <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50 print:text-black">Avance por habilidad</h2>
        <table className="mb-6 w-full text-left text-sm">
          <thead className="border-b border-zinc-300 text-xs text-zinc-500">
            <tr>
              <th className="py-1.5 pr-2">Nivel</th>
              <th className="py-1.5 pr-2">Habilidad</th>
              <th className="py-1.5 pr-2">Ejercicios aprobados</th>
              <th className="py-1.5">Dominio</th>
            </tr>
          </thead>
          <tbody>
            {habilidades.map((p) => (
              <tr key={p.habilidad_id} className="border-b border-zinc-200 break-inside-avoid">
                <td className="py-1.5 pr-2 text-zinc-500">{p.habilidad?.nivel?.nombre}</td>
                <td className="py-1.5 pr-2">
                  {NOMBRES_HABILIDAD[p.habilidad?.nombre ?? ""] ?? p.habilidad?.nombre}
                  {!p.desbloqueada && <span className="text-zinc-400"> (aún no abierta)</span>}
                </td>
                <td className="py-1.5 pr-2">{aprobadosPor.get(p.habilidad_id) ?? 0} de 15</td>
                <td className="py-1.5">
                  <span className="mr-2 inline-block h-2 w-20 overflow-hidden rounded-full bg-zinc-200 align-middle">
                    <span className="block h-full bg-emerald-500" style={{ width: `${Math.min(100, Number(p.porcentaje_dominio))}%` }} />
                  </span>
                  {Math.round(Number(p.porcentaje_dominio))}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50 print:text-black">Exámenes</h2>
        {examenes.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no rindió ningún examen.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-300 text-xs text-zinc-500">
              <tr>
                <th className="py-1.5 pr-2">Examen</th>
                <th className="py-1.5 pr-2">Fecha</th>
                <th className="py-1.5 pr-2">Puntaje</th>
                <th className="py-1.5">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {examenes.map((e) => (
                <tr key={e.id} className="border-b border-zinc-200 break-inside-avoid">
                  <td className="py-1.5 pr-2">{e.nombre}</td>
                  <td className="py-1.5 pr-2">{formatearFecha(e.fecha)}</td>
                  <td className="py-1.5 pr-2">{Math.round(e.puntaje)}%</td>
                  <td className="py-1.5">{e.aprobado ? "Aprobado" : "No aprobado"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{titulo}</dt>
      <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-50 print:text-black">{valor}</dd>
    </div>
  );
}
