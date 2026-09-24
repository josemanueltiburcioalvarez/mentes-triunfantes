"use client";

import { useRef, useState } from "react";
import { digitoEn, pasosDivision } from "@/lib/ejercicios/vertical";
import { BOTON_RESPONDER, soloDigitos, type PropsComunes } from "./tipos-pregunta";

// --c = ancho de una columna; se reduce en pantallas chicas para que la division quepa en la tarjeta
const CAJA =
  "mx-auto h-10 w-[calc(var(--c)-0.3rem)] rounded-md border border-zinc-300 text-center font-mono text-xl outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800";

const CELDA =
  "flex h-11 w-full items-center justify-center font-mono text-2xl text-zinc-900 dark:text-zinc-50";

const numero = (texto: string) => (texto === "" ? 0 : Number(texto));

// Division "dividendo | divisor": cociente bajo el divisor y, bajo el dividendo, un par de filas
// por paso (producto que se resta y resto con la cifra que se baja), una casilla por cifra.
export default function VerticalDivision({
  dividendo,
  divisor,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { dividendo: number; divisor: number }) {
  const n = String(dividendo).length;
  const cifrasDivisor = String(divisor).length;
  const { pasos } = pasosDivision(dividendo, divisor);
  const columnasDerecha = Math.max(cifrasDivisor, pasos.length);

  const [celdas, setCeldas] = useState<Record<string, string>>({});
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const valor = (clave: string) => celdas[clave] ?? "";

  // columnas de la grilla (1 = signo de operacion, luego el dividendo, un espacio y el bloque derecho)
  const colDividendo = (c: number) => 2 + c;
  const colDerecha = (j: number) => n + 3 + j;
  const plantilla = `1.5rem repeat(${n}, var(--c)) 0.5rem repeat(${columnasDerecha}, var(--c))`;

  // Una casilla por cifra del producto y del resto de cada paso, alineadas a la derecha
  // con la columna donde termina el paso (el resto llega hasta la cifra que se baja).
  const ventanas = pasos.map((paso) => {
    const i = paso.columna;
    const hayBajada = paso.restoConBajada !== null;
    // Un producto ocupa al menos tantas casillas como cifras tiene el divisor (0 × 21 = 00) y el
    // resto se escribe con la cifra bajada al lado (0 y 5 -> 05), sin comerse los ceros.
    const anchoProducto = Math.max(String(paso.producto).length, cifrasDivisor);
    const finResto = hayBajada ? i + 1 : i;
    const anchoResto = String(paso.resto).length + (hayBajada ? 1 : 0);
    return {
      i,
      hayBajada,
      productoDesde: i - anchoProducto + 1,
      productoHasta: i,
      restoDesde: finResto - anchoResto + 1,
      restoHasta: finResto,
    };
  });

  const columnasDe = (desde: number, hasta: number) =>
    Array.from({ length: hasta - desde + 1 }, (_, k) => desde + k);

  // Todos los cuadros son obligatorios: cociente, productos y restos de cada paso.
  const cajasCociente = pasos.map((_, j) => valor(`q${j}`));
  const pasosCompletos = ventanas.every(
    (v, s) =>
      columnasDe(v.productoDesde, v.productoHasta).every((c) => valor(`p${s}-${c}`) !== "") &&
      columnasDe(v.restoDesde, v.restoHasta).every((c) => valor(`r${s}-${c}`) !== "")
  );
  const valido = cajasCociente.every((d) => d !== "") && pasosCompletos;

  function escribir(clave: string, siguiente: string | null, texto: string) {
    const digito = soloDigitos(texto);
    setCeldas((prev) => ({ ...prev, [clave]: digito }));
    if (digito && siguiente) refs.current[siguiente]?.focus();
  }

  function teclaAtras(clave: string, anterior: string | null, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && valor(clave) === "" && anterior) refs.current[anterior]?.focus();
  }

  function textoFila(prefijo: string, desde: number, hasta: number): string {
    let texto = "";
    for (let c = desde; c <= hasta; c++) texto += valor(`${prefijo}-${c}`);
    return texto;
  }

  function caja(clave: string, etiqueta: string, anterior: string | null, siguiente: string | null) {
    return (
      <input
        type="text"
        inputMode="numeric"
        disabled={bloqueado}
        value={valor(clave)}
        ref={(el) => {
          refs.current[clave] = el;
        }}
        onChange={(e) => escribir(clave, siguiente, e.target.value)}
        onKeyDown={(e) => teclaAtras(clave, anterior, e)}
        aria-label={etiqueta}
        className={CAJA}
      />
    );
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || !valido) return;

    const digitos = cajasCociente.join("");
    const productos = ventanas.map((v, s) => textoFila(`p${s}`, v.productoDesde, v.productoHasta));
    const restos = ventanas.map((v, s) => textoFila(`r${s}`, v.restoDesde, v.restoHasta));

    // el resto de cada paso se escribe junto con la cifra que se baja (salvo el ultimo)
    const restosEsperados = pasos.map((paso) => paso.restoConBajada ?? paso.resto);
    const productosEsperados = pasos.map((paso) => paso.producto);

    const correcta = pasos.every(
      (_, s) => numero(productos[s]) === productosEsperados[s] && numero(restos[s]) === restosEsperados[s]
    );

    onResponder({
      respuestaDada: digitos,
      valor: Number(digitos),
      pasos: {
        modo: "vertical",
        operacion: "division",
        cociente_digitos: digitos.split(""),
        productos,
        restos,
        productos_esperados: productosEsperados,
        restos_esperados: restosEsperados,
        requeria_marcas: true,
        uso_marcas: productos.some((p) => p !== "") || restos.some((r) => r !== ""),
        marcas_correctas: correcta,
      },
    });
  }

  return (
    <form onSubmit={enviar} className="flex max-w-full flex-col items-center gap-4">
      <div className="max-w-full overflow-x-auto pb-1">
        <div
          className="inline-grid items-center gap-y-1 [--c:2.1rem] sm:[--c:2.5rem]"
          style={{ gridTemplateColumns: plantilla }}
        >
          {/* fila 1: dividendo | divisor */}
          {Array.from({ length: n }, (_, c) => (
            <div key={`d${c}`} className={CELDA} style={{ gridRow: 1, gridColumn: colDividendo(c) }}>
              {digitoEn(dividendo, n - 1 - c)}
            </div>
          ))}
          {Array.from({ length: columnasDerecha }, (_, j) => (
            <div
              key={`v${j}`}
              className={`${CELDA} border-b-2 border-zinc-500 ${j === 0 ? "border-l-2" : ""}`}
              style={{ gridRow: 1, gridColumn: colDerecha(j) }}
            >
              {j < cifrasDivisor ? digitoEn(divisor, cifrasDivisor - 1 - j) : ""}
            </div>
          ))}

          {/* cociente bajo el divisor */}
          {pasos.map((_, j) => (
            <div key={`q${j}`} style={{ gridRow: 2, gridColumn: colDerecha(j) }}>
              {caja(`q${j}`, `Cociente, cifra ${j + 1}`, j > 0 ? `q${j - 1}` : null, j < pasos.length - 1 ? `q${j + 1}` : null)}
            </div>
          ))}

          {/* pasos: producto que se resta y resto con la cifra que se baja */}
          {ventanas.map((v, s) => {
            const filaProducto = 2 + 2 * s;
            const filaResto = 3 + 2 * s;
            const productoCols = columnasDe(v.productoDesde, v.productoHasta);
            const restoCols = columnasDe(v.restoDesde, v.restoHasta);
            return (
              <div key={`paso${s}`} className="contents">
                <div
                  className="pr-1 text-right font-mono text-2xl text-zinc-500"
                  style={{ gridRow: filaProducto, gridColumn: 1 }}
                >
                  −
                </div>
                {productoCols.map((c, k) => (
                  <div
                    key={`p${s}-${c}`}
                    className="border-b-2 border-zinc-500 pb-1"
                    style={{ gridRow: filaProducto, gridColumn: colDividendo(c) }}
                  >
                    {caja(
                      `p${s}-${c}`,
                      `Producto del paso ${s + 1}, cifra ${k + 1}`,
                      k > 0 ? `p${s}-${c - 1}` : null,
                      k < productoCols.length - 1 ? `p${s}-${c + 1}` : null
                    )}
                  </div>
                ))}
                {v.hayBajada && (
                  <div
                    className="text-center text-lg text-zinc-400"
                    style={{ gridRow: filaProducto, gridColumn: colDividendo(v.i + 1) }}
                    aria-hidden
                  >
                    ↓
                  </div>
                )}
                {restoCols.map((c, k) => (
                  <div key={`r${s}-${c}`} style={{ gridRow: filaResto, gridColumn: colDividendo(c) }}>
                    {caja(
                      `r${s}-${c}`,
                      `Resto del paso ${s + 1}, cifra ${k + 1}`,
                      k > 0 ? `r${s}-${c - 1}` : null,
                      k < restoCols.length - 1 ? `r${s}-${c + 1}` : null
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <p className="max-w-xs text-xs text-zinc-400 dark:text-zinc-500">
        Escribe el cociente debajo del divisor. En cada paso anota el producto que restas y, debajo, lo que
        queda con la cifra que bajas (↓), alineado con su columna.{" "}
        <span className="font-medium text-zinc-500 dark:text-zinc-400">
          Todos los cuadros son obligatorios para poder responder.
        </span>
      </p>

      {!bloqueado && (
        <button type="submit" disabled={enviando || !valido} className={BOTON_RESPONDER}>
          Responder
        </button>
      )}
    </form>
  );
}
