"use client";

import { useRef, useState } from "react";
import { digitoEn, pasosDivision } from "@/lib/ejercicios/vertical";
import {
  BOTON_RESPONDER,
  CAJA_DIGITO,
  CAJA_LARGA,
  CELDA_DIGITO,
  soloDigitos,
  type PropsComunes,
} from "./tipos-pregunta";

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

  const [cociente, setCociente] = useState<string[]>(() => Array(n).fill(""));
  const [productos, setProductos] = useState<string[]>(() => Array(pasos.length).fill(""));
  const [restos, setRestos] = useState<string[]>(() => Array(pasos.length).fill(""));
  const refsCociente = useRef<(HTMLInputElement | null)[]>([]);

  const plantilla = `4.5rem repeat(${n}, 2.75rem)`;
  const columnas = Array.from({ length: n }, (_, c) => c); // izquierda -> derecha
  // la columna c (0 = izquierda) ocupa la linea c + 2 de la grilla; la 1 es la del divisor
  const abarca = (desde: number, hasta: number) => ({ gridColumn: `${desde + 2} / ${hasta + 3}` });

  const primero = cociente.findIndex((d) => d !== "");
  const valido = primero >= 0 && cociente.slice(primero).every((d) => d !== "");

  function cambiarCociente(c: number, valor: string) {
    const digito = soloDigitos(valor);
    setCociente((prev) => prev.map((d, i) => (i === c ? digito : d)));
    if (digito && c + 1 < n) refsCociente.current[c + 1]?.focus();
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || !valido) return;

    const digitos = cociente.slice(primero).join("");
    const productosEsperados = pasos.map((p) => p.producto);
    const restosEsperados = pasos.map((p) => p.resto);
    const numero = (texto: string) => (texto === "" ? 0 : Number(texto));

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
        marcas_correctas:
          productosEsperados.every((p, i) => numero(productos[i]) === p) &&
          restosEsperados.every((r, i) => numero(restos[i]) === r),
      },
    });
  }

  return (
    <form onSubmit={enviar} className="flex flex-col items-center gap-4">
      <div className="flex flex-col gap-1">
        <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
          <div />
          {columnas.map((c) => (
            <input
              key={`q${c}`}
              ref={(el) => {
                refsCociente.current[c] = el;
              }}
              type="text"
              inputMode="numeric"
              autoFocus={c === 0}
              disabled={bloqueado}
              value={cociente[c]}
              onChange={(e) => cambiarCociente(c, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && cociente[c] === "" && c > 0) refsCociente.current[c - 1]?.focus();
              }}
              aria-label={`Cociente, cifra ${c + 1}`}
              className={CAJA_DIGITO}
            />
          ))}
        </div>

        <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
          <div className="whitespace-nowrap pr-1 text-right font-mono text-3xl text-zinc-900 dark:text-zinc-50">
            {divisor} )
          </div>
          {columnas.map((c) => (
            <div key={`d${c}`} className={`${CELDA_DIGITO} border-t-2 border-zinc-400 dark:border-zinc-600`}>
              {digitoEn(dividendo, n - 1 - c)}
            </div>
          ))}
        </div>

        {pasos.map((paso, s) => {
          const ancho = Math.min(cifrasDivisor + 1, paso.columna + 1);
          const desde = paso.columna - ancho + 1;
          return (
            <div key={`p${s}`} className="flex flex-col gap-1">
              <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
                <div className="pr-1 text-right font-mono text-2xl text-zinc-500">−</div>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={bloqueado}
                  value={productos[s]}
                  onChange={(e) =>
                    setProductos((prev) => prev.map((p, i) => (i === s ? soloDigitos(e.target.value, ancho) : p)))
                  }
                  aria-label={`Producto del paso ${s + 1}`}
                  className={CAJA_LARGA}
                  style={abarca(desde, paso.columna)}
                />
              </div>
              <div className="grid items-center" style={{ gridTemplateColumns: plantilla }}>
                <div />
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={bloqueado}
                  value={restos[s]}
                  onChange={(e) =>
                    setRestos((prev) => prev.map((r, i) => (i === s ? soloDigitos(e.target.value, ancho) : r)))
                  }
                  aria-label={`Resto del paso ${s + 1}`}
                  className={`${CAJA_LARGA} border-t-2 border-t-zinc-400 dark:border-t-zinc-600`}
                  style={abarca(desde, paso.columna)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="max-w-xs text-xs text-zinc-400 dark:text-zinc-500">
        Escribe el cociente arriba, de izquierda a derecha. En cada paso anota el producto
        (cifra del cociente × divisor) y el resto.
      </p>

      {!bloqueado && (
        <button type="submit" disabled={enviando || !valido} className={BOTON_RESPONDER}>
          Responder
        </button>
      )}
    </form>
  );
}
