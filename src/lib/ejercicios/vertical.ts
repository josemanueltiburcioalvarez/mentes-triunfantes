export type OperacionVertical = "suma" | "resta";

export function numColumnas(operacion: OperacionVertical, a: number, b: number): number {
  return operacion === "suma"
    ? Math.max(String(a).length, String(b).length) + 1
    : String(a).length;
}

// columna 0 = la de la derecha (unidades)
export function digitoEn(n: number, columna: number): string {
  const s = String(n);
  const idx = s.length - 1 - columna;
  return idx >= 0 ? s[idx] : "";
}

// marcas[k] = llevada (suma) o prestada (resta) generada en la columna k, que el estudiante
// escribe encima de la columna k+1.
export function marcasEsperadas(operacion: OperacionVertical, a: number, b: number): number[] {
  const n = numColumnas(operacion, a, b);
  const marcas: number[] = [];
  let acarreo = 0;
  for (let j = 0; j < n - 1; j++) {
    const da = Number(digitoEn(a, j) || 0);
    const db = Number(digitoEn(b, j) || 0);
    if (operacion === "suma") {
      acarreo = da + db + acarreo >= 10 ? 1 : 0;
    } else {
      acarreo = da - acarreo < db ? 1 : 0;
    }
    marcas.push(acarreo);
  }
  return marcas;
}
