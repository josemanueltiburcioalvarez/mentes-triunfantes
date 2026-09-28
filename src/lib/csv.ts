// CSV para abrir en Excel: comillas donde hace falta y BOM para que se vean bien las tildes.
export type CeldaCsv = string | number | boolean | null | undefined;

const celda = (v: CeldaCsv): string => {
  if (v === null || v === undefined) return "";
  const texto = String(v);
  return /[",\n\r;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

export function aCsv(encabezados: string[], filas: CeldaCsv[][]): string {
  return "﻿" + [encabezados, ...filas].map((f) => f.map(celda).join(",")).join("\r\n") + "\r\n";
}
