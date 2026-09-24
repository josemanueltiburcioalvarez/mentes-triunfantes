"use client";

import { useRef, useState } from "react";
import VerticalMultiplicacion from "./vertical-multiplicacion";
import { BOTON_RESPONDER, CAJA_DIGITO, soloDigitos, type PropsComunes, type RespuestaPregunta } from "./tipos-pregunta";

// Raiz cuadrada por tanteo y comprobacion: el estudiante escribe la raiz y la comprueba
// multiplicandola por si misma en vertical (debe dar el radicando).
export default function VerticalRaiz({
  radicando,
  raiz,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { radicando: number; raiz: number }) {
  const cifras = String(raiz).length;
  const [digitos, setDigitos] = useState<string[]>(() => Array(cifras).fill(""));
  const [escrita, setEscrita] = useState<number | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const completo = digitos.every((d) => d !== "");

  function comprobar(e: React.FormEvent) {
    e.preventDefault();
    if (!completo || bloqueado) return;
    setEscrita(Number(digitos.join("")));
  }

  function alResponderComprobacion(r: RespuestaPregunta) {
    const candidata = escrita as number;
    const demuestra = r.valor === radicando;
    const cuadrado = candidata * candidata;
    onResponder({
      respuestaDada: String(candidata),
      valor: demuestra ? candidata : -1,
      pasos: {
        modo: "vertical",
        operacion: "raiz",
        raiz_escrita: candidata,
        producto_escrito: r.valor,
        comprobacion: r.pasos,
        requeria_marcas: true,
        uso_marcas: true,
        marcas_correctas: demuestra,
      },
      detalle: demuestra
        ? undefined
        : cuadrado === radicando
          ? `Tu raíz (${candidata}) era correcta, pero al comprobar ${candidata} × ${candidata} escribiste ${r.valor} y debía dar ${radicando}.`
          : `Tu raíz fue ${candidata}: ${candidata} × ${candidata} = ${cuadrado}, y no es ${radicando}.`,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">√{radicando}</p>

      {escrita === null ? (
        <form onSubmit={comprobar} className="flex flex-col items-center gap-3">
          <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            ¿Qué número multiplicado por sí mismo da {radicando}? Escríbelo y luego lo comprobarás multiplicando.
          </p>
          <div className="flex gap-1">
            {digitos.map((d, k) => (
              <input
                key={k}
                ref={(el) => {
                  refs.current[k] = el;
                }}
                type="text"
                inputMode="numeric"
                autoFocus={k === 0}
                disabled={bloqueado}
                value={d}
                onChange={(e) => {
                  const digito = soloDigitos(e.target.value);
                  setDigitos((prev) => prev.map((v, i) => (i === k ? digito : v)));
                  if (digito && k + 1 < cifras) refs.current[k + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && d === "" && k > 0) refs.current[k - 1]?.focus();
                }}
                aria-label={`Raíz, cifra ${k + 1}`}
                className={CAJA_DIGITO}
              />
            ))}
          </div>
          <button type="submit" disabled={!completo || enviando || bloqueado} className={BOTON_RESPONDER}>
            Comprobar
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            Comprueba tu raíz: <span className="font-mono text-zinc-700 dark:text-zinc-200">{escrita} × {escrita}</span>{" "}
            debe dar {radicando}.
          </p>
          <VerticalMultiplicacion
            a={escrita}
            b={escrita}
            bloqueado={bloqueado}
            enviando={enviando}
            onResponder={alResponderComprobacion}
          />
        </div>
      )}
    </div>
  );
}
