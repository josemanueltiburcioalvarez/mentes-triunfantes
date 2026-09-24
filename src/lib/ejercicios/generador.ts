import { generarCombinada, aTexto, superindice, type Token } from "./combinadas";

export const HABILIDADES_PRACTICABLES = [
  "suma",
  "resta",
  "tabla_multiplicacion",
  "multiplicacion",
  "division",
  "potencia",
  "raiz",
  "operaciones_combinadas",
] as const;

export type HabilidadPracticable = (typeof HABILIDADES_PRACTICABLES)[number];

export function esHabilidadPracticable(valor: string): valor is HabilidadPracticable {
  return (HABILIDADES_PRACTICABLES as readonly string[]).includes(valor);
}

export type OperacionVertical =
  | "suma"
  | "resta"
  | "multiplicacion"
  | "division"
  | "potencia"
  | "raiz"
  | "combinadas";

export interface EjercicioGenerado {
  enunciado: string;
  respuesta: number;
  operacion?: OperacionVertical;
  operandos?: [number, number];
  expresion?: Token[];
}

export interface EjercicioConDigito extends EjercicioGenerado {
  digito: number;
  habilidad: HabilidadPracticable;
}

function entreAleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function conCifras(cifras: number): { min: number; max: number } {
  return { min: 10 ** (cifras - 1), max: 10 ** cifras - 1 };
}

interface RangoDigito {
  min: number;
  max: number;
  descripcion: string;
}

const RANGOS_SUMA_RESTA: Record<number, RangoDigito> = {
  1: { min: 1, max: 9, descripcion: "Números de 1 cifra" },
  2: { min: 10, max: 99, descripcion: "Números de 2 cifras" },
  3: { min: 100, max: 999, descripcion: "Números de 3 cifras" },
  4: { min: 1000, max: 9999, descripcion: "Números de 4 cifras" },
  5: { min: 10000, max: 99999, descripcion: "Números de 5 cifras" },
};

const RANGOS_TABLA: Record<number, RangoDigito> = {
  1: { min: 1, max: 2, descripcion: "Tablas del 1 al 2" },
  2: { min: 3, max: 4, descripcion: "Tablas del 3 al 4" },
  3: { min: 5, max: 6, descripcion: "Tablas del 5 al 6" },
  4: { min: 7, max: 8, descripcion: "Tablas del 7 al 8" },
  5: { min: 9, max: 12, descripcion: "Tablas del 9 al 12" },
};

// Cifras de (multiplicando, multiplicador) por digito
const CIFRAS_MULTIPLICACION: Record<number, [number, number]> = {
  1: [2, 1],
  2: [3, 1],
  3: [4, 1],
  4: [2, 2],
  5: [3, 2],
};

// Cifras de (dividendo, divisor) por digito; las divisiones son siempre exactas
const CIFRAS_DIVISION: Record<number, [number, number]> = {
  1: [2, 1],
  2: [3, 1],
  3: [4, 1],
  4: [3, 2],
  5: [4, 2],
};

function generarSuma(digito: number): EjercicioGenerado {
  const { min, max } = RANGOS_SUMA_RESTA[digito];
  const a = entreAleatorio(min, max);
  const b = entreAleatorio(min, max);
  return { enunciado: `${a} + ${b} =`, respuesta: a + b, operacion: "suma", operandos: [a, b] };
}

function generarResta(digito: number): EjercicioGenerado {
  const { min, max } = RANGOS_SUMA_RESTA[digito];
  const a = entreAleatorio(min, max);
  const b = entreAleatorio(min, a); // aseguramos resultado no negativo
  return { enunciado: `${a} - ${b} =`, respuesta: a - b, operacion: "resta", operandos: [a, b] };
}

function generarTablaMultiplicacion(digito: number): EjercicioGenerado {
  const { min, max } = RANGOS_TABLA[digito];
  const a = entreAleatorio(min, max);
  const b = entreAleatorio(2, 12);
  return { enunciado: `${a} × ${b} =`, respuesta: a * b };
}

function generarMultiplicacion(digito: number): EjercicioGenerado {
  const [cifrasA, cifrasB] = CIFRAS_MULTIPLICACION[digito];
  const a = entreAleatorio(conCifras(cifrasA).min, conCifras(cifrasA).max);
  const b = cifrasB === 1 ? entreAleatorio(2, 9) : entreAleatorio(10, 99);
  return {
    enunciado: `${a} × ${b} =`,
    respuesta: a * b,
    operacion: "multiplicacion",
    operandos: [a, b],
  };
}

function generarDivision(digito: number): EjercicioGenerado {
  const [cifrasDividendo, cifrasDivisor] = CIFRAS_DIVISION[digito];
  const { min: minDividendo, max: maxDividendo } = conCifras(cifrasDividendo);
  const minDivisor = cifrasDivisor === 1 ? 2 : 10;
  const maxDivisor = cifrasDivisor === 1 ? 9 : 99;

  for (;;) {
    const divisor = entreAleatorio(minDivisor, maxDivisor);
    const minCociente = Math.max(2, Math.ceil(minDividendo / divisor));
    const maxCociente = Math.floor(maxDividendo / divisor);
    if (minCociente > maxCociente) continue;
    const cociente = entreAleatorio(minCociente, maxCociente);
    const dividendo = divisor * cociente;
    return {
      enunciado: `${dividendo} ÷ ${divisor} =`,
      respuesta: cociente,
      operacion: "division",
      operandos: [dividendo, divisor],
    };
  }
}

// potencia: [base, exponente] por digito
function generarPotencia(digito: number): EjercicioGenerado {
  let base: number;
  let exponente: number;
  switch (digito) {
    case 1:
      base = entreAleatorio(2, 9);
      exponente = 2;
      break;
    case 2:
      base = entreAleatorio(2, 5);
      exponente = 3;
      break;
    case 3:
      base = entreAleatorio(6, 9);
      exponente = 3;
      break;
    case 4:
      base = entreAleatorio(11, 25);
      exponente = 2;
      break;
    default:
      if (Math.random() < 0.5) {
        base = entreAleatorio(2, 6);
        exponente = 4;
      } else {
        base = entreAleatorio(2, 3);
        exponente = 5;
      }
  }
  return {
    enunciado: `${base}${superindice(exponente)} =`,
    respuesta: base ** exponente,
    operacion: "potencia",
    operandos: [base, exponente],
  };
}

const RANGO_RAIZ: Record<number, [number, number]> = {
  1: [2, 9],
  2: [10, 20],
  3: [21, 30],
  4: [31, 50],
  5: [51, 99],
};

function generarRaiz(digito: number): EjercicioGenerado {
  const [min, max] = RANGO_RAIZ[digito];
  const raiz = entreAleatorio(min, max);
  return {
    enunciado: `√${raiz * raiz} =`,
    respuesta: raiz,
    operacion: "raiz",
    operandos: [raiz * raiz, raiz],
  };
}

function generarOperacionesCombinadas(digito: number): EjercicioGenerado {
  const { tokens, respuesta } = generarCombinada(digito);
  return { enunciado: `${aTexto(tokens)} =`, respuesta, operacion: "combinadas", expresion: tokens };
}

export function generarEjercicio(habilidad: HabilidadPracticable, digito: number): EjercicioGenerado {
  switch (habilidad) {
    case "suma":
      return generarSuma(digito);
    case "resta":
      return generarResta(digito);
    case "tabla_multiplicacion":
      return generarTablaMultiplicacion(digito);
    case "multiplicacion":
      return generarMultiplicacion(digito);
    case "division":
      return generarDivision(digito);
    case "potencia":
      return generarPotencia(digito);
    case "raiz":
      return generarRaiz(digito);
    case "operaciones_combinadas":
      return generarOperacionesCombinadas(digito);
  }
}

export function descripcionDigito(habilidad: HabilidadPracticable, digito: number): string {
  switch (habilidad) {
    case "tabla_multiplicacion":
      return RANGOS_TABLA[digito].descripcion;
    case "multiplicacion": {
      const [a, b] = CIFRAS_MULTIPLICACION[digito];
      return `${a} cifras × ${b} ${b === 1 ? "cifra" : "cifras"}`;
    }
    case "division": {
      const [a, b] = CIFRAS_DIVISION[digito];
      return `${a} cifras ÷ ${b} ${b === 1 ? "cifra" : "cifras"} (exacta)`;
    }
    case "potencia":
      return [
        "",
        "Cuadrados: de 2² a 9²",
        "Cubos pequeños: de 2³ a 5³",
        "Cubos: de 6³ a 9³",
        "Cuadrados de 2 cifras: de 11² a 25²",
        "Potencias de exponente 4 y 5 (3⁴, 2⁵...)",
      ][digito];
    case "raiz":
      return [
        "",
        "Raíces de 4 a 81 (√81 = 9)",
        "Raíces de 100 a 400",
        "Raíces de 441 a 900",
        "Raíces de 961 a 2 500",
        "Raíces de 2 601 a 9 801",
      ][digito];
    case "operaciones_combinadas":
      return [
        "",
        "Multiplicar antes de sumar o restar",
        "Varias operaciones (y de izquierda a derecha)",
        "Con paréntesis",
        "Paréntesis y varias operaciones",
        "Con potencias y raíces",
      ][digito];
    default:
      return RANGOS_SUMA_RESTA[digito].descripcion;
  }
}

function mezclar<T>(lista: T[]): T[] {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

function preguntasPorDigito(
  habilidad: HabilidadPracticable,
  cantidadPorDigito: number
): EjercicioConDigito[] {
  const preguntas: EjercicioConDigito[] = [];
  for (let digito = 1; digito <= 5; digito++) {
    for (let i = 0; i < cantidadPorDigito; i++) {
      preguntas.push({ ...generarEjercicio(habilidad, digito), digito, habilidad });
    }
  }
  return preguntas;
}

// Examen final de una habilidad: 4 preguntas de cada digito (20), mezcladas.
export function generarExamenHabilidad(habilidad: HabilidadPracticable): EjercicioConDigito[] {
  return mezclar(preguntasPorDigito(habilidad, 4));
}

// Evaluacion de nivel: 10 preguntas por habilidad (2 de cada digito), mezcladas.
export function generarExamenNivel(habilidades: HabilidadPracticable[]): EjercicioConDigito[] {
  return mezclar(habilidades.flatMap((habilidad) => preguntasPorDigito(habilidad, 2)));
}

export const NOMBRES_HABILIDAD: Record<HabilidadPracticable, string> = {
  suma: "Suma",
  resta: "Resta",
  tabla_multiplicacion: "Tabla de multiplicar",
  multiplicacion: "Multiplicación",
  division: "División",
  potencia: "Potencia",
  raiz: "Raíz",
  operaciones_combinadas: "Operaciones combinadas",
};
