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

  const ventanas = pasos.map((paso) => {
    const i = paso.columna;
    const hayBajada = i + 1 < n;
    const anchoProducto = Math.min(cifrasDivisor + 1, i + 1);
    const finResto = hayBajada ? i + 1 : i;
    const anchoResto = Math.min(hayBajada ? cifrasDivisor + 1 : cifrasDivisor, finResto + 1);
    return {
      i,
      hayBajada,
      productoDesde: i - anchoProducto + 1,
      productoHasta: i,
      restoDesde: finResto - anchoResto + 1,
      restoHasta: finResto,
    };
  });

  const cajasCociente = pasos.map((_, j) => valor(`q${j}`));
  const primero = cajasCociente.findIndex((d) => d !== "");
  const valido = primero >= 0 && cajasCociente.slice(primero).every((d) => d !== "");

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

    const digitos = cajasCociente.slice(primero).join("");
    const productos = ventanas.map((v, s) => textoFila(`p${s}`, v.productoDesde, v.productoHasta));
    const restos = ventanas.map((v, s) => textoFila(`r${s}`, v.restoDesde, v.restoHasta));

    // el resto de cada paso se escribe junto con la cifra que se baja (salvo el ultimo)
    const restosEsperados = pasos.map((paso, s) =>
      ventanas[s].hayBajada ? paso.resto * 10 + Number(digitoEn(dividendo, n - 1 - (ventanas[s].i + 1))) : paso.resto
    );
    const productosEsperados = pasos.map((paso) => paso.producto);

    const correcta = pasos.every((paso, s) => {
      const productoOk = numero(productos[s]) === paso.producto;
      const restoOk =
        numero(restos[s]) === restosEsperados[s] ||
        (paso.cocienteDigito === 0 && (numero(restos[s]) === 0 || numero(restos[s]) === paso.resto));
      return productoOk && restoOk;
    });

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
            const productoCols = Array.from({ length: v.productoHasta - v.productoDesde + 1 }, (_, k) => v.productoDesde + k);
            const restoCols = Array.from({ length: v.restoHasta - v.restoDesde + 1 }, (_, k) => v.restoDesde + k);
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
        queda con la cifra que bajas (↓), alineado con su columna.
      </p>

      {!bloqueado && (
        <button type="submit" disabled={enviando || !valido} className={BOTON_RESPONDER}>
          Responder
        </button>
      )}
    </form>
  );
}
