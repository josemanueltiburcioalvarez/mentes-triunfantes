"use client";

import { BOTON_RESPONDER } from "./tipos-pregunta";

export const BOTON_OPCION =
  "rounded-lg border border-zinc-300 px-4 py-2 text-left text-sm text-zinc-800 hover:bg-blue-500/10 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100";

export interface Opcion {
  id: string;
  etiqueta: string;
}

export const OPCIONES_SIGNO: Opcion[] = [
  { id: "+", etiqueta: "Positivo (+)" },
  { id: "-", etiqueta: "Negativo (−)" },
];

// Botones de eleccion (una pregunta con varias respuestas posibles).
export function Opciones({
  pregunta,
  opciones,
  deshabilitado,
  onElegir,
}: {
  pregunta: string;
  opciones: Opcion[];
  deshabilitado: boolean;
  onElegir: (id: string) => void;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{pregunta}</p>
      <div className="flex w-full flex-col gap-2">
        {opciones.map((o) => (
          <button key={o.id} type="button" disabled={deshabilitado} onClick={() => onElegir(o.id)} className={BOTON_OPCION}>
            {o.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}

// Numero entero que admite un signo menos al principio.
export function limpiarEntero(texto: string, maximoCifras = 7): string {
  const negativo = /^\s*[-−]/.test(texto);
  const digitos = texto.replace(/\D/g, "").slice(0, maximoCifras);
  return (negativo ? "−" : "") + digitos;
}

export function aNumero(texto: string): number {
  if (texto === "" || texto === "−") return NaN;
  return Number(texto.replace("−", "-"));
}

export function CampoEntero({
  valor,
  onCambio,
  etiqueta,
  deshabilitado,
}: {
  valor: string;
  onCambio: (v: string) => void;
  etiqueta: string;
  deshabilitado?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="text"
      autoFocus
      autoComplete="off"
      disabled={deshabilitado}
      value={valor}
      onChange={(e) => onCambio(limpiarEntero(e.target.value))}
      aria-label={etiqueta}
      placeholder="±"
      className="h-11 w-28 rounded-lg border border-zinc-300 px-2 text-center font-mono text-xl outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800"
    />
  );
}

export function Mensaje({ texto }: { texto: string | null }) {
  return texto ? <p className="max-w-xs text-sm text-red-600">{texto}</p> : null;
}

export function BotonResponder({ enviando, alClic }: { enviando: boolean; alClic: () => void }) {
  return (
    <button type="button" onClick={alClic} disabled={enviando} className={BOTON_RESPONDER}>
      Responder
    </button>
  );
}

export const conSigno = (n: number) => (n < 0 ? `−${-n}` : `${n}`);
