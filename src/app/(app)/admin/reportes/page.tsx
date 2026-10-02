import { crearClienteServidor } from "@/lib/supabase/server";
import { diaCorto, NOMBRES_HABILIDAD, ultimosDias } from "@/lib/admin";

const DIAS_GRAFICO = 30;

function colorPorcentaje(p: number): string {
  if (p < 70) return "text-red-600 dark:text-red-400";
  if (p < 85) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

export default async function ReportesPage() {
  const supabase = await crearClienteServidor();
  const dias = ultimosDias(DIAS_GRAFICO);

  const [habilidades, actividad, estudiantes] = await Promise.all([
    supabase.from("vista_reporte_habilidades").select("*").order("modalidad").order("nivel_orden").order("habilidad_orden"),
    supabase.from("vista_actividad_diaria").select("*").gte("dia", dias[0]),
    supabase.from("vista_estudiantes_admin").select("id", { count: "exact", head: true }),
  ]);

  // Atajos y Razonamiento todavia no tienen ejercicios
  const filas = (habilidades.data ?? []).filter((h) => h.habilidad !== "atajos" && h.habilidad !== "razonamiento");
  const porDia = new Map((actividad.data ?? []).map((a) => [a.dia ?? "", a]));
  const serie = dias.map((d) => ({
    dia: d,
    respuestas: porDia.get(d)?.respuestas ?? 0,
    activos: porDia.get(d)?.estudiantes_activos ?? 0,
    sesiones: porDia.get(d)?.sesiones ?? 0,
  }));
  const maximo = Math.max(1, ...serie.map((s) => s.respuestas));

  // totales (los porcentajes y tiempos se ponderan por la cantidad de respuestas)
  const totalRespuestas = filas.reduce((n, h) => n + (h.respuestas ?? 0), 0);
  const pctGlobal = totalRespuestas
    ? filas.reduce((n, h) => n + Number(h.pct_correctas ?? 0) * (h.respuestas ?? 0), 0) / totalRespuestas
    : 0;
  const segundosGlobal = totalRespuestas
    ? filas.reduce((n, h) => n + Number(h.segundos_promedio ?? 0) * (h.respuestas ?? 0), 0) / totalRespuestas
    : 0;
  const rendidos = filas.reduce((n, h) => n + (h.examenes_rendidos ?? 0), 0);
  const aprobados = filas.reduce((n, h) => n + (h.examenes_aprobados ?? 0), 0);
  const activosPeriodo = serie.reduce((n, s) => n + s.sesiones, 0);

  // habilidades donde mas se equivocan (con suficientes respuestas para que el dato valga)
  const dificiles = filas
    .filter((h) => (h.respuestas ?? 0) >= 10)
    .sort((a, b) => Number(a.pct_correctas) - Number(b.pct_correctas))
    .slice(0, 3);

  const hoy = dias[dias.length - 1];
  const hace30 = dias[0];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Reportes</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cómo va el grupo en conjunto: rendimiento por habilidad, actividad diaria y archivos para Excel.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cifra titulo="Estudiantes" valor={String(estudiantes.count ?? 0)} />
        <Cifra titulo="Respuestas registradas" valor={totalRespuestas.toLocaleString("es-PE")} />
        <Cifra titulo="Aciertos" valor={`${pctGlobal.toFixed(1)}%`} color={colorPorcentaje(pctGlobal)} />
        <Cifra
          titulo="Exámenes aprobados"
          valor={rendidos ? `${aprobados}/${rendidos}` : "—"}
          ayuda={rendidos ? `${Math.round((100 * aprobados) / rendidos)}% de los rendidos` : "todavía no hay exámenes"}
        />
      </div>

      {/* Actividad */}
      <section>
        <h2 className="mb-1 text-lg font-medium text-zinc-800 dark:text-zinc-200">Actividad de los últimos {DIAS_GRAFICO} días</h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Respuestas por día. {activosPeriodo} sesiones en el período; el tiempo promedio por respuesta es de{" "}
          {segundosGlobal.toFixed(0)} s.
        </p>
        <div
          className="flex h-40 items-end gap-1 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          role="img"
          aria-label="Gráfico de respuestas por día"
        >
          {serie.map((s) => (
            <div
              key={s.dia}
              className="flex h-full flex-1 flex-col justify-end"
              title={`${diaCorto(s.dia)}: ${s.respuestas} respuestas, ${s.activos} estudiante${s.activos === 1 ? "" : "s"}, ${s.sesiones} sesiones`}
            >
              <div
                className={s.respuestas > 0 ? "rounded-t bg-emerald-500" : "rounded-t bg-zinc-200 dark:bg-zinc-800"}
                style={{ height: s.respuestas > 0 ? `${Math.max(4, (100 * s.respuestas) / maximo)}%` : "2px" }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{diaCorto(serie[0].dia)}</span>
          <span>{diaCorto(serie[serie.length - 1].dia)}</span>
        </div>
      </section>

      {/* Habilidades */}
      <section>
        <h2 className="mb-1 text-lg font-medium text-zinc-800 dark:text-zinc-200">Rendimiento por habilidad</h2>
        {dificiles.length > 0 && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Donde más se equivocan:</strong>{" "}
            {dificiles
              .map((h) => `${NOMBRES_HABILIDAD[h.habilidad ?? ""] ?? h.habilidad} (${Number(h.pct_correctas).toFixed(0)}% de aciertos)`)
              .join(" · ")}
          </p>
        )}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Habilidad</th>
                <th className="px-3 py-2">Modalidad</th>
                <th className="px-3 py-2">Nivel</th>
                <th className="px-3 py-2">Habilitados</th>
                <th className="px-3 py-2">Dominio prom.</th>
                <th className="px-3 py-2">Respuestas</th>
                <th className="px-3 py-2">Aciertos</th>
                <th className="px-3 py-2">Tiempo prom.</th>
                <th className="px-3 py-2">Exámenes</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((h) => (
                <tr key={h.habilidad_id} className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                  <td className="px-3 py-2 font-medium">{NOMBRES_HABILIDAD[h.habilidad ?? ""] ?? h.habilidad}</td>
                  <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">
                    {h.modalidad === "secundaria" ? "Secundaria" : "Primaria"}
                  </td>
                  <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">{h.nivel}</td>
                  <td className="px-3 py-2">{h.estudiantes_habilitados}</td>
                  <td className="px-3 py-2">{Math.round(Number(h.dominio_promedio ?? 0))}%</td>
                  <td className="px-3 py-2">{h.respuestas}</td>
                  <td className={`px-3 py-2 font-medium ${(h.respuestas ?? 0) > 0 ? colorPorcentaje(Number(h.pct_correctas)) : "text-zinc-400"}`}>
                    {(h.respuestas ?? 0) > 0 ? `${Number(h.pct_correctas).toFixed(0)}%` : "—"}
                  </td>
                  <td className="px-3 py-2">{(h.respuestas ?? 0) > 0 ? `${Number(h.segundos_promedio).toFixed(0)} s` : "—"}</td>
                  <td className="px-3 py-2">
                    {(h.examenes_rendidos ?? 0) > 0 ? `${h.examenes_aprobados}/${h.examenes_rendidos} aprobados` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Exportar */}
      <section>
        <h2 className="mb-1 text-lg font-medium text-zinc-800 dark:text-zinc-200">Exportar a Excel</h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Archivos CSV que se abren directamente en Excel. Para el informe de un solo estudiante entra a su ficha y elige
          «Informe imprimible».
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-1 text-sm font-semibold">Lista de estudiantes</h3>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Nombre, correo, nivel, avance, último acceso, estado y alertas.</p>
            {/* descarga de un archivo, no una pagina: por eso no usa Link */}
            <a
              download
              href="/admin/reportes/exportar/estudiantes"
              className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Descargar CSV
            </a>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-1 text-sm font-semibold">Progreso por habilidad</h3>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Una fila por estudiante y habilidad: dominio, respuestas y última práctica.</p>
            {/* descarga de un archivo, no una pagina: por eso no usa Link */}
            <a
              download
              href="/admin/reportes/exportar/progreso"
              className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Descargar CSV
            </a>
          </div>
          <form
            action="/admin/reportes/exportar/sesiones"
            method="get"
            className="rounded-xl border border-zinc-200 bg-white p-4 sm:col-span-2 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="mb-1 text-sm font-semibold">Sesiones</h3>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">Cada práctica o examen con su fecha, aciertos y duración.</p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                Desde
                <input
                  type="date"
                  name="desde"
                  defaultValue={hace30}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                Hasta
                <input
                  type="date"
                  name="hasta"
                  defaultValue={hoy}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Descargar CSV
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Cifra({ titulo, valor, ayuda, color }: { titulo: string; valor: string; ayuda?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`text-3xl font-semibold ${color ?? "text-zinc-900 dark:text-zinc-50"}`}>{valor}</div>
      <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{titulo}</div>
      {ayuda && <div className="text-xs text-zinc-500 dark:text-zinc-400">{ayuda}</div>}
    </div>
  );
}
