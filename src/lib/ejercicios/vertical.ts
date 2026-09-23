export type OperacionAditiva = "suma" | "resta";

export function numColumnas(operacion: OperacionAditiva, a: number, b: number): number {
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
export function marcasEsperadas(operacion: OperacionAditiva, a: number, b: number): number[] {
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

// Llevadas del producto parcial por la cifra de unidades del multiplicador.
// marcas[k] = llevada saliente de la columna k, escrita sobre la columna k+1 (columnas 0..cifras-2).
export function marcasMultiplicacion(a: number, b: number): number[] {
  const unidades = b % 10;
  const cifras = String(a).length;
  const marcas: number[] = [];
  let llevada = 0;
  for (let j = 0; j < cifras - 1; j++) {
    llevada = Math.floor((Number(digitoEn(a, j)) * unidades + llevada) / 10);
    marcas.push(llevada);
  }
  return marcas;
}

// Productos parciales: [a * unidades, a * decenas?]
export function parcialesMultiplicacion(a: number, b: number): number[] {
  return String(b)
    .split("")
    .reverse()
    .map((d) => a * Number(d));
}

export interface PasoDivision {
  columna: number; // columna del dividendo (0 = izquierda) donde termina este paso
  cocienteDigito: number;
  producto: number;
  resto: number;
}

// Division larga: un paso por cada cifra del dividendo desde que el numero parcial puede
// alcanzar al divisor (inicio = cifras del divisor - 1).
export function pasosDivision(dividendo: number, divisor: number): { inicio: number; pasos: PasoDivision[] } {
  const cifras = String(dividendo).split("").map(Number);
  const inicio = String(divisor).length - 1;
  const pasos: PasoDivision[] = [];
  let actual = 0;
  for (let i = 0; i < cifras.length; i++) {
    actual = actual * 10 + cifras[i];
    if (i < inicio) continue;
    const cocienteDigito = Math.floor(actual / divisor);
    const producto = cocienteDigito * divisor;
    const resto = actual - producto;
    pasos.push({ columna: i, cocienteDigito, producto, resto });
    actual = resto;
  }
  return { inicio, pasos };
}
