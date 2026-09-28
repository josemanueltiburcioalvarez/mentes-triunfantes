import Link from "next/link";

// Paginacion por enlaces: conserva el resto de los filtros de la direccion.
export default function Paginacion({
  pagina,
  totalPaginas,
  total,
  porPagina,
  ruta,
  parametros,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  ruta: string;
  parametros: Record<string, string | undefined>;
}) {
  const enlace = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(parametros)) if (v) q.set(k, v);
    if (p > 1) q.set("pagina", String(p));
    const s = q.toString();
    return s ? `${ruta}?${s}` : ruta;
  };
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  // ventana de numeros alrededor de la pagina actual
  const numeros: number[] = [];
  for (let p = Math.max(1, pagina - 2); p <= Math.min(totalPaginas, pagina + 2); p++) numeros.push(p);

  const base = "rounded-lg border px-3 py-1.5 text-sm";
  const activo = "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900";
  const normal = "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";
  const apagado = "cursor-not-allowed border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-600";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {total === 0 ? "Sin resultados" : `Mostrando ${desde}–${hasta} de ${total}`}
      </p>
      {totalPaginas > 1 && (
        <div className="flex flex-wrap items-center gap-1" role="navigation" aria-label="Paginación">
          {pagina > 1 ? (
            <Link href={enlace(pagina - 1)} className={`${base} ${normal}`}>
              Anterior
            </Link>
          ) : (
            <span className={`${base} ${apagado}`}>Anterior</span>
          )}
          {numeros[0] > 1 && (
            <>
              <Link href={enlace(1)} className={`${base} ${normal}`}>
                1
              </Link>
              {numeros[0] > 2 && <span className="px-1 text-zinc-400">…</span>}
            </>
          )}
          {numeros.map((p) => (
            <Link
              key={p}
              href={enlace(p)}
              aria-current={p === pagina ? "page" : undefined}
              className={`${base} ${p === pagina ? activo : normal}`}
            >
              {p}
            </Link>
          ))}
          {numeros[numeros.length - 1] < totalPaginas && (
            <>
              {numeros[numeros.length - 1] < totalPaginas - 1 && <span className="px-1 text-zinc-400">…</span>}
              <Link href={enlace(totalPaginas)} className={`${base} ${normal}`}>
                {totalPaginas}
              </Link>
            </>
          )}
          {pagina < totalPaginas ? (
            <Link href={enlace(pagina + 1)} className={`${base} ${normal}`}>
              Siguiente
            </Link>
          ) : (
            <span className={`${base} ${apagado}`}>Siguiente</span>
          )}
        </div>
      )}
    </div>
  );
}
