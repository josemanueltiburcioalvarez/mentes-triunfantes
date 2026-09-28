import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, NOMBRES_HABILIDAD, TIPOS_SESION } from "@/lib/admin";

export default async function AlertasPage() {
  const supabase = await crearClienteServidor();

  const { data: sospechosas } = await supabase
    .from("vista_sesiones_sospechosas")
    .select("*")
    .eq("sospechosa", true)
    .order("inicio", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Sesiones sospechosas</h1>
      <section>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Sesiones con muchas respuestas más rápidas de lo posible a mano, u operaciones con llevadas
          resueltas sin escribir ninguna.
        </p>
        {(sospechosas ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin sesiones marcadas.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Estudiante</th>
                  <th className="px-3 py-2">Habilidad</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Aciertos</th>
                  <th className="px-3 py-2">Tiempo prom.</th>
                  <th className="px-3 py-2">Muy rápidas</th>
                  <th className="px-3 py-2">Sin llevadas</th>
                </tr>
              </thead>
              <tbody>
                {(sospechosas ?? []).map((s) => (
                  <tr key={s.sesion_id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-3 py-2">
                      <Link href={`/admin/estudiantes/${s.estudiante_id}`} className="underline-offset-2 hover:underline">
                        {s.estudiante_nombre}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {s.habilidad_nombre
                        ? (NOMBRES_HABILIDAD[s.habilidad_nombre] ?? s.habilidad_nombre)
                        : `Nivel ${s.nivel_nombre ?? ""}`}
                    </td>
                    <td className="px-3 py-2">{TIPOS_SESION[s.tipo ?? ""] ?? s.tipo}</td>
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
        )}
      </section>
    </div>
  );
}
