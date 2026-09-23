import type { Json } from "@/lib/supabase/database.types";

export interface RespuestaPregunta {
  respuestaDada: string;
  valor: number;
  pasos: Json | null;
}

export interface PropsComunes {
  bloqueado: boolean;
  enviando: boolean;
  onResponder: (respuesta: RespuestaPregunta) => void;
}

export const BOTON_RESPONDER =
  "rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export const CELDA_DIGITO =
  "flex h-12 w-11 items-center justify-center font-mono text-3xl text-zinc-900 dark:text-zinc-50";

export const CAJA_DIGITO =
  "mx-auto h-12 w-10 rounded-lg border border-zinc-300 text-center font-mono text-2xl outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800";

export const CAJA_MARCA =
  "mx-auto h-7 w-8 rounded border border-dashed border-zinc-300 text-center text-sm outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800";

export const CAJA_LARGA =
  "h-11 w-full rounded-lg border border-zinc-300 px-2 text-right font-mono text-2xl outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800";

export function soloDigitos(valor: string, maximo?: number): string {
  const limpio = valor.replace(/\D/g, "");
  return maximo === undefined ? limpio.slice(-1) : limpio.slice(0, maximo);
}

export function normalizarNumero(texto: string): string {
  return texto.replace(/^0+(?=\d)/, "");
}
