"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PasoGuia } from "@/lib/guias/tipos";
import TableroColumnas from "./tablero-columnas";
import TableroDivision from "./tablero-division";

function Texto({ texto }: { texto: string }) {
  return (
    <>
      {texto.split("**").map((parte, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-50">
            {parte}
          </strong>
        ) : (
          <span key={i}>{parte}</span>
        )
      )}
    </>
  );
}

const BOTON =
  "rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export default function GuiaPasoAPaso({
  pasos,
  practicarHref,
}: {
  pasos: PasoGuia[];
  practicarHref: string;
}) {
  const [indice, setIndice] = useState(0);
  const paso = pasos[indice];
  const esUltimo = indice === pasos.length - 1;

  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setIndice((i) => Math.min(pasos.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndice((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [pasos.length]);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap justify-center gap-1.5" aria-label="Progreso de la guía">
        {pasos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndice(i)}
            aria-label={`Ir al paso ${i + 1}`}
            className={`h-2.5 rounded-full transition-all ${
              i === indice
                ? "w-6 bg-blue-600"
                : i < indice
                  ? "w-2.5 bg-blue-300 dark:bg-blue-800"
                  : "w-2.5 bg-zinc-300 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>

      <div className="flex min-h-56 w-full items-center justify-center">
        {paso.escena.tipo === "columnas" ? (
          <TableroColumnas escena={paso.escena} />
        ) : (
          <TableroDivision escena={paso.escena} />
        )}
      </div>

      <div className="w-full rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
        <p className="mb-1 text-xs font-medium text-blue-700 dark:text-blue-300">
          Paso {indice + 1} de {pasos.length}
        </p>
        <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{paso.titulo}</h3>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <Texto texto={paso.texto} />
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" className={BOTON} onClick={() => setIndice((i) => i - 1)} disabled={indice === 0}>
          Anterior
        </button>
        {esUltimo ? (
          <Link href={practicarHref} className={BOTON}>
            Ir a practicar
          </Link>
        ) : (
          <button type="button" className={BOTON} onClick={() => setIndice((i) => i + 1)}>
            Siguiente
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">También puedes usar las flechas ← → del teclado.</p>
    </div>
  );
}
