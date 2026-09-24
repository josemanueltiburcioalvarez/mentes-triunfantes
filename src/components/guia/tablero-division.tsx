import { digitoEn, pasosDivision } from "@/lib/ejercicios/vertical";
import type { EscenaDivision } from "@/lib/guias/tipos";

const CELDA = "flex h-10 w-full items-center justify-center font-mono text-2xl";

export default function TableroDivision({ escena }: { escena: EscenaDivision }) {
  const { dividendo, divisor, paso, fase, focoDesde, focoHasta } = escena;
  const n = String(dividendo).length;
  const cifrasDivisor = String(divisor).length;
  const { pasos } = pasosDivision(dividendo, divisor);
  const columnasDerecha = Math.max(cifrasDivisor, pasos.length);

  const colDividendo = (c: number) => 2 + c;
  const colDerecha = (j: number) => n + 3 + j;
  const plantilla = `1.5rem repeat(${n}, 2.75rem) 0.5rem repeat(${columnasDerecha}, 2.75rem)`;

  // digitos de un numero alineados a la derecha en la columna `fin` (0 = izquierda)
  const celdasDe = (texto: string, fin: number) =>
    texto.split("").map((d, k) => ({ d, c: fin - texto.length + 1 + k }));

  return (
    <div className="max-w-full overflow-x-auto">
      <div
        className="inline-grid items-center gap-y-1 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
        style={{ gridTemplateColumns: plantilla }}
      >
        {Array.from({ length: n }, (_, c) => (
          <div
            key={`d${c}`}
            className={`${CELDA} ${
              c >= focoDesde && c <= focoHasta && focoDesde >= 0
                ? "rounded-md bg-blue-500/25 font-semibold text-blue-700 ring-2 ring-blue-500 dark:text-blue-200"
                : "text-zinc-900 dark:text-zinc-50"
            }`}
            style={{ gridRow: 1, gridColumn: colDividendo(c) }}
          >
            {digitoEn(dividendo, n - 1 - c)}
          </div>
        ))}
        {Array.from({ length: columnasDerecha }, (_, j) => (
          <div
            key={`v${j}`}
            className={`${CELDA} border-b-2 border-zinc-500 text-zinc-900 dark:text-zinc-50 ${j === 0 ? "border-l-2" : ""}`}
            style={{ gridRow: 1, gridColumn: colDerecha(j) }}
          >
            {j < cifrasDivisor ? digitoEn(divisor, cifrasDivisor - 1 - j) : ""}
          </div>
        ))}

        {pasos.map((p, s) => {
          const cocienteVisible = s < paso || (s === paso && fase >= 1);
          const productoVisible = s < paso || (s === paso && fase >= 2);
          const restoVisible = s < paso || (s === paso && fase >= 3);
          const conBajada = p.restoConBajada !== null && (s < paso || (s === paso && fase >= 4));
          const filaProducto = 2 + 2 * s;
          const filaResto = 3 + 2 * s;
          const activoProducto = s === paso && fase === 2;
          const activoResto = s === paso && (fase === 3 || fase === 4);

          return (
            <div key={`paso${s}`} className="contents">
              {cocienteVisible && (
                <div
                  className={`${CELDA} ${
                    s === paso && fase === 1
                      ? "rounded-md bg-blue-500/25 font-bold text-blue-700 ring-2 ring-blue-500 dark:text-blue-200"
                      : "font-bold text-emerald-700 dark:text-emerald-400"
                  }`}
                  style={{ gridRow: 2, gridColumn: colDerecha(s) }}
                >
                  {p.cocienteDigito}
                </div>
              )}

              {productoVisible && (
                <>
                  <div
                    className="flex items-center justify-end pr-1 font-mono text-xl text-zinc-500"
                    style={{ gridRow: filaProducto, gridColumn: 1 }}
                  >
                    −
                  </div>
                  {celdasDe(String(p.producto).padStart(cifrasDivisor, "0"), p.columna).map(({ d, c }) => (
                    <div
                      key={`p${s}-${c}`}
                      className={`${CELDA} border-b-2 border-zinc-500 ${
                        activoProducto
                          ? "font-bold text-blue-700 dark:text-blue-200"
                          : "text-zinc-900 dark:text-zinc-50"
                      }`}
                      style={{ gridRow: filaProducto, gridColumn: colDividendo(c) }}
                    >
                      {d}
                    </div>
                  ))}
                </>
              )}

              {conBajada && p.restoConBajada !== null && (
                <div
                  className="flex items-center justify-center text-lg text-blue-600 dark:text-blue-300"
                  style={{ gridRow: filaProducto, gridColumn: colDividendo(p.columna + 1) }}
                  aria-hidden
                >
                  ↓
                </div>
              )}

              {restoVisible &&
                celdasDe(
                  conBajada && p.restoConBajada !== null ? `${p.resto}${p.restoConBajada % 10}` : String(p.resto),
                  conBajada ? p.columna + 1 : p.columna
                ).map(
                  ({ d, c }) => (
                    <div
                      key={`r${s}-${c}`}
                      className={`${CELDA} ${
                        activoResto ? "font-bold text-blue-700 dark:text-blue-200" : "text-zinc-900 dark:text-zinc-50"
                      }`}
                      style={{ gridRow: filaResto, gridColumn: colDividendo(c) }}
                    >
                      {d}
                    </div>
                  )
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
