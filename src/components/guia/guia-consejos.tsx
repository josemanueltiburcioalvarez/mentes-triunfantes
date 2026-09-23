import type { SeccionConsejo } from "@/lib/guias/tipos";

export default function GuiaConsejosVista({
  secciones,
  mostrarTabla,
}: {
  secciones: SeccionConsejo[];
  mostrarTabla?: boolean;
}) {
  const numeros = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-4">
      {secciones.map((s) => (
        <div
          key={s.titulo}
          className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">{s.titulo}</h3>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{s.texto}</p>
          {s.ejemplo && (
            <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 font-mono text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
              {s.ejemplo}
            </p>
          )}
        </div>
      ))}

      {mostrarTabla && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">La tabla completa (del 1 al 10)</h3>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
            Busca una fila y una columna: donde se cruzan está el resultado. Fíjate que es simétrica (3 × 7 y 7 × 3
            dan lo mismo) y que la diagonal son los cuadrados (1, 4, 9, 16...).
          </p>
          <div className="overflow-x-auto">
            <table className="mx-auto border-separate border-spacing-0.5 text-center font-mono text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-zinc-400">×</th>
                  {numeros.map((n) => (
                    <th key={n} className="rounded bg-sky-500/20 px-2 py-1 text-sky-700 dark:text-sky-300">
                      {n}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {numeros.map((f) => (
                  <tr key={f}>
                    <th className="rounded bg-sky-500/20 px-2 py-1 text-sky-700 dark:text-sky-300">{f}</th>
                    {numeros.map((c) => (
                      <td
                        key={c}
                        className={`rounded px-2 py-1 ${
                          f === c
                            ? "bg-amber-500/30 font-bold text-amber-800 dark:text-amber-200"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {f * c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
