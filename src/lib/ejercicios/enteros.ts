// Numeros enteros (positivos y negativos): generadores por digito para suma, resta,
// multiplicacion, division, potencia y raiz con signo.

import { superindice } from "./combinadas";

// respuesta especial de una raiz que no existe en los enteros (√ de un negativo)
export const NO_EXISTE = -1_000_000_000;

export const signado = (n: number) => (n < 0 ? `(−${-n})` : `(+${n})`);
export const signoDe = (n: number): 1 | -1 => (n < 0 ? -1 : 1);

const entre = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const signoAleatorio = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const conCifras = (cifras: number) => ({ min: cifras === 1 ? 2 : 10 ** (cifras - 1), max: 10 ** cifras - 1 });

export type SignoBinario = "+" | "−";

// ---------------------------------------------------------------- suma y resta
const MAGNITUD_SUMA: Record<number, [number, number]> = {
  1: [1, 9],
  2: [10, 99],
  3: [100, 999],
  4: [10, 99],
  5: [10, 99],
};
const TERMINOS_SUMA: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 3, 5: 4 };

export interface EnteroSumaResta {
  enunciado: string;
  respuesta: number;
  terminos: number[];
  operadores: SignoBinario[];
}

// En los digitos 4 y 5 (varios sumandos) el ejercicio 1, 2 y 3 usan numeros de 2, 3 y 4 cifras.
export function generarSumaRestaEnteros(digito: number, operador: SignoBinario, nivel = 1): EnteroSumaResta {
  const [min, max] =
    digito >= 4 && nivel === 2 ? [100, 999] : digito >= 4 && nivel === 3 ? [1000, 9999] : MAGNITUD_SUMA[digito];
  const cantidad = TERMINOS_SUMA[digito];
  for (;;) {
    const terminos = Array.from({ length: cantidad }, () => signoAleatorio() * entre(min, max));
    const operadores: SignoBinario[] = Array(cantidad - 1).fill(operador);
    let acumulado = terminos[0];
    let valido = true;
    for (let i = 1; i < cantidad; i++) {
      acumulado = operador === "+" ? acumulado + terminos[i] : acumulado - terminos[i];
      if (acumulado === 0) valido = false;
    }
    if (!valido) continue;
    const enunciado =
      terminos.map((t, i) => (i === 0 ? signado(t) : `${operador} ${signado(t)}`)).join(" ") + " =";
    return { enunciado, respuesta: acumulado, terminos, operadores };
  }
}

// ---------------------------------------------------------------- multiplicacion y division
const CIFRAS_MULT: Record<number, [number, number]> = { 1: [1, 1], 2: [2, 1], 3: [3, 1], 4: [2, 2], 5: [3, 2] };
const CIFRAS_DIV: Record<number, [number, number]> = { 1: [2, 1], 2: [3, 1], 3: [4, 1], 4: [3, 2], 5: [4, 2] };

export interface EnteroPareja {
  enunciado: string;
  respuesta: number;
  operandos: [number, number];
}

export function generarMultiplicacionEnteros(digito: number): EnteroPareja {
  const [cifrasA, cifrasB] = CIFRAS_MULT[digito];
  const a = signoAleatorio() * entre(conCifras(cifrasA).min, conCifras(cifrasA).max);
  const b = signoAleatorio() * entre(conCifras(cifrasB).min, conCifras(cifrasB).max);
  return { enunciado: `${signado(a)} × ${signado(b)} =`, respuesta: a * b, operandos: [a, b] };
}

export function generarDivisionEnteros(digito: number): EnteroPareja {
  const [cifrasDividendo, cifrasDivisor] = CIFRAS_DIV[digito];
  const minDividendo = 10 ** (cifrasDividendo - 1);
  const maxDividendo = 10 ** cifrasDividendo - 1;
  const minDivisor = cifrasDivisor === 1 ? 2 : 10;
  const maxDivisor = cifrasDivisor === 1 ? 9 : 99;
  for (;;) {
    const divisor = entre(minDivisor, maxDivisor);
    const minCociente = Math.max(2, Math.ceil(minDividendo / divisor));
    const maxCociente = Math.floor(maxDividendo / divisor);
    if (minCociente > maxCociente) continue;
    const cociente = entre(minCociente, maxCociente);
    const a = signoAleatorio() * divisor * cociente;
    const b = signoAleatorio() * divisor;
    return { enunciado: `${signado(a)} ÷ ${signado(b)} =`, respuesta: a / b, operandos: [a, b] };
  }
}

// ---------------------------------------------------------------- potencia
export interface EnteroPotencia {
  enunciado: string;
  respuesta: number;
  base: number; // con signo si va entre parentesis; magnitud si el menos esta afuera
  exponente: number;
  parentesis: boolean;
}

export function generarPotenciaEntera(digito: number): EnteroPotencia {
  let base: number;
  let exponente: number;
  let parentesis = true;
  switch (digito) {
    case 1:
      base = -entre(2, 20);
      exponente = 2;
      break;
    case 2:
      base = -entre(2, 12);
      exponente = 3;
      break;
    case 3:
      if (Math.random() < 0.65) {
        base = signoAleatorio() * entre(2, 15);
        exponente = 2;
      } else {
        base = signoAleatorio() * entre(2, 8);
        exponente = 3;
      }
      break;
    case 4: {
      const v = entre(0, 2);
      if (v === 0) {
        base = signoAleatorio() * entre(5, 12);
        exponente = 3;
      } else if (v === 1) {
        base = signoAleatorio() * entre(2, 9);
        exponente = 4;
      } else {
        base = -entre(2, 5);
        exponente = 5;
      }
      break;
    }
    default: {
      // el signo dentro y fuera del parentesis: −b² , (−b)² , −b³ , (−b)³
      const v = entre(0, 3);
      const maximo = v < 2 ? 15 : 9;
      exponente = v < 2 ? 2 : 3;
      if (v % 2 === 0) {
        base = entre(2, maximo); // el menos esta afuera
        parentesis = false;
      } else {
        base = -entre(2, maximo);
      }
    }
  }
  const respuesta = parentesis ? base ** exponente : -(base ** exponente);
  const enunciado = parentesis
    ? `${base < 0 ? `(−${-base})` : `(+${base})`}${superindice(exponente)} =`
    : `−${base}${superindice(exponente)} =`;
  return { enunciado, respuesta, base, exponente, parentesis };
}

// ---------------------------------------------------------------- raiz
export interface EnteroRaiz {
  enunciado: string;
  respuesta: number; // NO_EXISTE si no existe en los enteros
  respuestaTexto?: string;
  indice: 2 | 3;
  radicando: number;
  menosAfuera: boolean;
}

export function generarRaizEntera(digito: number): EnteroRaiz {
  let indice: 2 | 3 = 2;
  let raiz: number;
  let negativo = false;
  let menosAfuera = false;
  switch (digito) {
    case 1:
      raiz = entre(2, 15);
      negativo = Math.random() < 0.35;
      break;
    case 2:
      indice = 3;
      raiz = entre(2, 8);
      negativo = Math.random() < 0.5;
      break;
    case 3:
      raiz = entre(10, 25);
      negativo = Math.random() < 0.3;
      break;
    case 4:
      indice = 3;
      raiz = entre(6, 15);
      negativo = Math.random() < 0.5;
      break;
    default:
      menosAfuera = true;
      if (Math.random() < 0.55) {
        raiz = entre(2, 25);
      } else {
        indice = 3;
        raiz = entre(2, 10);
        negativo = Math.random() < 0.5;
      }
  }
  const potencia = raiz ** indice;
  const radicando = negativo ? -potencia : potencia;
  const existe = !(indice === 2 && radicando < 0);
  const valor = existe ? (indice === 3 ? Math.sign(radicando) * raiz : raiz) * (menosAfuera ? -1 : 1) : NO_EXISTE;
  const simbolo = indice === 3 ? "∛" : "√";
  const cuerpo = radicando < 0 ? `(−${-radicando})` : String(radicando);
  return {
    enunciado: `${menosAfuera ? "−" : ""}${simbolo}${cuerpo} =`,
    respuesta: valor,
    respuestaTexto: existe ? undefined : "no existe en los enteros",
    indice,
    radicando,
    menosAfuera,
  };
}

export const DESCRIPCIONES_ENTEROS: Record<string, string[]> = {
  suma_enteros: [
    "",
    "Dos números de 1 cifra con signo",
    "Dos números de 2 cifras con signo",
    "Dos números de 3 cifras con signo",
    "Tres números de 2 cifras con signo",
    "Cuatro números de 2 cifras con signo",
  ],
  resta_enteros: [
    "",
    "Restar números de 1 cifra con signo",
    "Restar números de 2 cifras con signo",
    "Restar números de 3 cifras con signo",
    "Tres números de 2 cifras (varias restas)",
    "Cuatro números de 2 cifras (varias restas)",
  ],
  multiplicacion_enteros: [
    "",
    "1 cifra × 1 cifra, con signo",
    "2 cifras × 1 cifra, con signo",
    "3 cifras × 1 cifra, con signo",
    "2 cifras × 2 cifras, con signo",
    "3 cifras × 2 cifras, con signo",
  ],
  division_enteros: [
    "",
    "2 cifras ÷ 1 cifra, con signo",
    "3 cifras ÷ 1 cifra, con signo",
    "4 cifras ÷ 1 cifra, con signo",
    "3 cifras ÷ 2 cifras, con signo",
    "4 cifras ÷ 2 cifras, con signo",
  ],
  potencia_enteros: [
    "",
    "Cuadrados de números negativos (hasta 20)",
    "Cubos de números negativos (hasta 12)",
    "Cuadrados y cubos, positivos y negativos",
    "Exponentes 3, 4 y 5, con base positiva o negativa",
    "El signo dentro y fuera del paréntesis: (−3)², −3², (−2)³, −2³",
  ],
  raiz_enteros: [
    "",
    "Raíz cuadrada hasta 225 (¿existe o no?)",
    "Raíz cúbica de 8 a 512, positiva y negativa",
    "Raíces cuadradas hasta 625",
    "Raíces cúbicas hasta 3 375",
    "Con signo menos afuera: −√49, −∛(−27)",
  ],
};
