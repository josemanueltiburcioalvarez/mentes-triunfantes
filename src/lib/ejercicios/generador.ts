import { generarCombinada, aTexto, superindice, type TamanoNumeros, type Token } from "./combinadas";
import {
  DESCRIPCIONES_ENTEROS,
  generarDivisionEnteros,
  generarMultiplicacionEnteros,
  generarPotenciaEntera,
  generarRaizEntera,
  generarSumaRestaEnteros,
  SIMBOLO_RAIZ,
  type EnteroPotencia,
  type EnteroRaiz,
} from "./enteros";
import { DESCRIPCIONES_ECUACIONES, generarEcuacion, type Ecuacion, type NivelEcuacion } from "./ecuaciones";
import { DESCRIPCIONES_ATAJOS, generarAtajo } from "./atajos";
import { DESCRIPCIONES_RAZONAMIENTO, generarRazonamiento } from "./razonamiento";

export const HABILIDADES_PRACTICABLES = [
  "suma",
  "resta",
  "tabla_multiplicacion",
  "multiplicacion",
  "division",
  "potencia",
  "raiz",
  "operaciones_combinadas",
  "suma_enteros",
  "resta_enteros",
  "multiplicacion_enteros",
  "division_enteros",
  "potencia_enteros",
  "raiz_enteros",
  "ecuaciones",
  "combinadas_enteros",
  "atajos",
  "razonamiento",
] as const;

export type HabilidadPracticable = (typeof HABILIDADES_PRACTICABLES)[number];

// Solo en suma y resta el "dígito" es el número de cifras de los números; en las demás habilidades
// es simplemente un grupo de dificultad y no se le pone ese nombre en pantalla.
export function usaNombreDigito(habilidad: string): boolean {
  return habilidad === "suma" || habilidad === "resta";
}

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
  | "combinadas"
  | "suma_enteros"
  | "resta_enteros"
  | "multiplicacion_enteros"
  | "division_enteros"
  | "potencia_enteros"
  | "raiz_enteros"
  | "ecuacion"
  | "combinadas_enteros";

export interface EjercicioGenerado {
  enunciado: string;
  respuesta: number;
  operacion?: OperacionVertical;
  operandos?: [number, number];
  expresion?: Token[];
  // raiz cuadrada (2), cubica (3), cuarta (4) o quinta (5)
  indiceRaiz?: 2 | 3 | 4 | 5;
  // numeros con signo
  terminos?: number[];
  potenciaEntera?: EnteroPotencia;
  raizEntera?: EnteroRaiz;
  // ecuaciones
  ecuacion?: Ecuacion;
  // texto para mostrar la respuesta correcta cuando no es un numero (ej. "no existe en los enteros")
  respuestaTexto?: string;
  // texto opcional que se muestra despues de responder (solo en ejercicios curados por el admin)
  explicacion?: string;
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
      base = entreAleatorio(2, 12);
      exponente = 2;
      break;
    case 2:
      base = entreAleatorio(1, 9);
      exponente = 3;
      break;
    case 3:
      base = entreAleatorio(10, 50);
      exponente = 2;
      break;
    case 4:
      base = entreAleatorio(51, 99);
      exponente = 2;
      break;
    default:
      base = entreAleatorio(2, 9);
      exponente = Math.random() < 0.5 ? 4 : 5;
  }
  return {
    enunciado: `${base}${superindice(exponente)} =`,
    respuesta: base ** exponente,
    operacion: "potencia",
    operandos: [base, exponente],
  };
}

// raices cuadradas de los digitos 1 a 3; el 4 es la raiz cubica y el 5 la cuarta y la quinta
const RANGO_RAIZ: Record<number, [number, number]> = {
  1: [2, 12],
  2: [13, 30],
  3: [31, 99],
};

export { SIMBOLO_RAIZ };

function generarRaiz(digito: number): EjercicioGenerado {
  let indice: 2 | 3 | 4 | 5 = 2;
  let raiz: number;
  if (digito <= 3) {
    const [min, max] = RANGO_RAIZ[digito];
    raiz = entreAleatorio(min, max);
  } else if (digito === 4) {
    indice = 3;
    raiz = entreAleatorio(2, 25);
  } else if (Math.random() < 0.55) {
    indice = 4;
    raiz = entreAleatorio(2, 12);
  } else {
    indice = 5;
    raiz = entreAleatorio(2, 9);
  }
  const radicando = raiz ** indice;
  return {
    enunciado: `${SIMBOLO_RAIZ[indice]}${radicando} =`,
    respuesta: raiz,
    operacion: "raiz",
    operandos: [radicando, raiz],
    indiceRaiz: indice,
  };
}

function generarOperacionesCombinadas(digito: number, nivel: number): EjercicioGenerado {
  const tamano = (nivel === 2 || nivel === 3 ? nivel : 1) as TamanoNumeros;
  const { tokens, respuesta } = generarCombinada(digito, tamano);
  return { enunciado: `${aTexto(tokens)} =`, respuesta, operacion: "combinadas", expresion: tokens };
}

function generarSumaEnteros(digito: number, nivel: number): EjercicioGenerado {
  const g = generarSumaRestaEnteros(digito, "+", nivel);
  return { enunciado: g.enunciado, respuesta: g.respuesta, operacion: "suma_enteros", terminos: g.terminos };
}

function generarRestaEnteros(digito: number, nivel: number): EjercicioGenerado {
  const g = generarSumaRestaEnteros(digito, "−", nivel);
  return { enunciado: g.enunciado, respuesta: g.respuesta, operacion: "resta_enteros", terminos: g.terminos };
}

function generarMultiplicacionConSigno(digito: number): EjercicioGenerado {
  const g = generarMultiplicacionEnteros(digito);
  return { enunciado: g.enunciado, respuesta: g.respuesta, operacion: "multiplicacion_enteros", operandos: g.operandos };
}

function generarDivisionConSigno(digito: number): EjercicioGenerado {
  const g = generarDivisionEnteros(digito);
  return { enunciado: g.enunciado, respuesta: g.respuesta, operacion: "division_enteros", operandos: g.operandos };
}

function generarPotenciaConSigno(digito: number): EjercicioGenerado {
  const g = generarPotenciaEntera(digito);
  return { enunciado: g.enunciado, respuesta: g.respuesta, operacion: "potencia_enteros", potenciaEntera: g };
}

function generarRaizConSigno(digito: number): EjercicioGenerado {
  const g = generarRaizEntera(digito);
  return {
    enunciado: g.enunciado,
    respuesta: g.respuesta,
    operacion: "raiz_enteros",
    raizEntera: g,
    respuestaTexto: g.respuestaTexto,
  };
}

function generarCombinadasEnteros(digito: number, nivel: number): EjercicioGenerado {
  const tamano = (nivel === 2 || nivel === 3 ? nivel : 1) as TamanoNumeros;
  const { tokens, respuesta } = generarCombinada(digito, tamano, true);
  return { enunciado: `${aTexto(tokens)} =`, respuesta, operacion: "combinadas_enteros", expresion: tokens };
}

function generarEcuaciones(digito: number, nivel: number): EjercicioGenerado {
  const e = generarEcuacion(digito, (nivel === 2 || nivel === 3 ? nivel : 1) as NivelEcuacion);
  return { enunciado: `Resuelve: ${e.texto}`, respuesta: e.solucion, operacion: "ecuacion", ecuacion: e };
}

function generarAtajoEjercicio(digito: number): EjercicioGenerado {
  const a = generarAtajo(digito);
  return { enunciado: a.enunciado, respuesta: a.respuesta };
}

function generarRazonamientoEjercicio(digito: number): EjercicioGenerado {
  const p = generarRazonamiento(digito);
  return { enunciado: p.enunciado, respuesta: p.respuesta };
}

// nivel = numero de ejercicio (1 a 3) dentro del digito. Cambia el tamano de los numeros en las
// operaciones combinadas (1 cifra / 2 a 3 / 3 a 4), las ecuaciones (pequenos / 2 cifras / 3 cifras) y la
// suma y resta con signos de los digitos 4 y 5 (2 / 3 / 4 cifras).
export function generarEjercicio(habilidad: HabilidadPracticable, digito: number, nivel = 1): EjercicioGenerado {
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
      return generarOperacionesCombinadas(digito, nivel);
    case "suma_enteros":
      return generarSumaEnteros(digito, nivel);
    case "resta_enteros":
      return generarRestaEnteros(digito, nivel);
    case "multiplicacion_enteros":
      return generarMultiplicacionConSigno(digito);
    case "division_enteros":
      return generarDivisionConSigno(digito);
    case "potencia_enteros":
      return generarPotenciaConSigno(digito);
    case "raiz_enteros":
      return generarRaizConSigno(digito);
    case "ecuaciones":
      return generarEcuaciones(digito, nivel);
    case "combinadas_enteros":
      return generarCombinadasEnteros(digito, nivel);
    case "atajos":
      return generarAtajoEjercicio(digito);
    case "razonamiento":
      return generarRazonamientoEjercicio(digito);
  }
}

const TEXTO_TAMANO = ["", "números de 1 cifra", "números de 2 a 3 cifras", "números de 3 a 4 cifras"];

// numero = ejercicio (1 a 3) dentro del digito; en operaciones combinadas indica el tamano de los numeros
export function descripcionDigito(habilidad: HabilidadPracticable, digito: number, numero?: number): string {
  const base = descripcionBase(habilidad, digito);
  if (!numero) return base;
  if (habilidad === "operaciones_combinadas" || habilidad === "combinadas_enteros") {
    return `${base} · ${TEXTO_TAMANO[numero]}`;
  }
  if (habilidad === "ecuaciones") return `${base} · ${["", "números pequeños", "números de 2 cifras", "números de 3 cifras"][numero]}`;
  if ((habilidad === "suma_enteros" || habilidad === "resta_enteros") && digito >= 4) {
    const cifras = numero + 1;
    return base.replace("de 2 cifras", `de ${cifras} cifras`);
  }
  return base;
}

function descripcionBase(habilidad: HabilidadPracticable, digito: number): string {
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
        "Cuadrados: de 2² a 12²",
        "Cubos: de 1³ a 9³",
        "Cuadrados de 10² a 50²",
        "Cuadrados de 51² a 99²",
        "Exponente 4 y 5 con bases de 2 a 9 (3⁴, 7⁵...)",
      ][digito];
    case "raiz":
      return [
        "",
        "Raíces cuadradas de 4 a 144 (√81 = 9)",
        "Raíces cuadradas de 169 a 900",
        "Raíces cuadradas de 961 a 9 801",
        "Raíz cúbica (∛27 = 3, ∛15 625 = 25)",
        "Raíz cuarta y raíz quinta (∜81 = 3, ⁵√32 = 2)",
      ][digito];
    case "operaciones_combinadas":
      return [
        "",
        "Multiplicar antes de sumar o restar",
        "Varias operaciones (y de izquierda a derecha)",
        "Con paréntesis",
        "Paréntesis y varias operaciones",
        "Todo junto: paréntesis, potencias y raíces",
      ][digito];
    case "suma_enteros":
    case "resta_enteros":
    case "multiplicacion_enteros":
    case "division_enteros":
    case "potencia_enteros":
    case "raiz_enteros":
      return DESCRIPCIONES_ENTEROS[habilidad][digito];
    case "ecuaciones":
      return DESCRIPCIONES_ECUACIONES[digito];
    case "combinadas_enteros":
      return [
        "",
        "Multiplicar antes de sumar o restar, con números negativos",
        "Varias operaciones con signos (y de izquierda a derecha)",
        "Con paréntesis y números negativos",
        "Paréntesis y varias operaciones con signos",
        "Todo junto con signos: paréntesis, potencias y raíces",
      ][digito];
    case "atajos":
      return DESCRIPCIONES_ATAJOS[digito];
    case "razonamiento":
      return DESCRIPCIONES_RAZONAMIENTO[digito];
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

// Genera un ejercicio que no repita ninguno de los ya usados (si el espacio es muy chico, tras varios
// intentos acepta uno repetido).
export function generarEjercicioNuevo(
  habilidad: HabilidadPracticable,
  digito: number,
  vistos: Set<string>,
  nivel = 1
): EjercicioGenerado {
  let ejercicio = generarEjercicio(habilidad, digito, nivel);
  for (let intento = 0; intento < 40 && vistos.has(ejercicio.enunciado); intento++) {
    ejercicio = generarEjercicio(habilidad, digito, nivel);
  }
  vistos.add(ejercicio.enunciado);
  return ejercicio;
}

function preguntasPorDigito(
  habilidad: HabilidadPracticable,
  cantidadPorDigito: number
): EjercicioConDigito[] {
  const preguntas: EjercicioConDigito[] = [];
  for (let digito = 1; digito <= 5; digito++) {
    const vistos = new Set<string>();
    // en los examenes se mezclan los tres tamanos de numeros (el ejercicio 1, 2 y 3 de cada digito)
    const desfase = Math.floor(Math.random() * 3);
    for (let i = 0; i < cantidadPorDigito; i++) {
      const nivel = ((i + desfase) % 3) + 1;
      preguntas.push({ ...generarEjercicioNuevo(habilidad, digito, vistos, nivel), digito, habilidad });
    }
  }
  return preguntas;
}

// Examen final de una habilidad: 4 preguntas de cada digito (20), mezcladas.
export function generarExamenHabilidad(habilidad: HabilidadPracticable): EjercicioConDigito[] {
  return mezclar(preguntasPorDigito(habilidad, 4));
}

// Evaluacion de nivel, mezclada y de unas 30 preguntas como maximo: con pocas habilidades son 10 por
// habilidad (2 de cada digito); con muchas (ej. Experto) se toma 1 pregunta de los digitos mas altos.
export function generarExamenNivel(habilidades: HabilidadPracticable[]): EjercicioConDigito[] {
  const porHabilidad = Math.min(10, Math.floor(30 / habilidades.length));
  if (porHabilidad >= 10) {
    return mezclar(habilidades.flatMap((habilidad) => preguntasPorDigito(habilidad, 2)));
  }
  const digitos = [5, 4, 3, 2, 1].slice(0, Math.max(1, porHabilidad));
  return mezclar(
    habilidades.flatMap((habilidad) =>
      digitos.map((digito) => ({
        ...generarEjercicio(habilidad, digito, 1 + Math.floor(Math.random() * 3)),
        digito,
        habilidad,
      }))
    )
  );
}

// Habilidades que entran en el examen de ubicacion (operaciones basicas hasta raiz y algunas
// combinadas; secundaria ademas suma ecuaciones y numeros con signo). Digitos 1 a 3: es diagnostico,
// no tiene sentido empezar con los numeros mas dificiles de una habilidad que recien se va a evaluar.
const HABILIDADES_UBICACION_PRIMARIA: HabilidadPracticable[] = [
  "suma",
  "resta",
  "tabla_multiplicacion",
  "multiplicacion",
  "division",
  "potencia",
  "raiz",
  "operaciones_combinadas",
];
const HABILIDADES_UBICACION_SECUNDARIA: HabilidadPracticable[] = [
  ...HABILIDADES_UBICACION_PRIMARIA,
  "ecuaciones",
  "suma_enteros",
  "resta_enteros",
  "multiplicacion_enteros",
  "division_enteros",
  "potencia_enteros",
  "raiz_enteros",
  "combinadas_enteros",
];

// Examen de ubicacion: 20 preguntas mezclando las habilidades de la modalidad, dando una vuelta
// completa a la lista antes de subir de digito.
export function generarExamenUbicacion(modalidad: "primaria" | "secundaria"): EjercicioConDigito[] {
  const habilidades = modalidad === "secundaria" ? HABILIDADES_UBICACION_SECUNDARIA : HABILIDADES_UBICACION_PRIMARIA;
  const TOTAL = 20;
  const vistosPorHabilidad = new Map<HabilidadPracticable, Set<string>>();
  const preguntas: EjercicioConDigito[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const habilidad = habilidades[i % habilidades.length];
    const digito = Math.min(3, 1 + Math.floor(i / habilidades.length));
    if (!vistosPorHabilidad.has(habilidad)) vistosPorHabilidad.set(habilidad, new Set());
    const vistos = vistosPorHabilidad.get(habilidad)!;
    preguntas.push({ ...generarEjercicioNuevo(habilidad, digito, vistos), digito, habilidad });
  }
  return mezclar(preguntas);
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
  suma_enteros: "Suma con signos",
  resta_enteros: "Resta con signos",
  multiplicacion_enteros: "Multiplicación con signos",
  division_enteros: "División con signos",
  potencia_enteros: "Potencia con signos",
  raiz_enteros: "Raíz con signos",
  ecuaciones: "Ecuaciones",
  combinadas_enteros: "Operaciones combinadas con signos",
  atajos: "Atajos",
  razonamiento: "Razonamiento",
};

// Texto de la respuesta correcta para guardar y mostrar (los negativos con signo menos tipografico).
export function textoRespuesta(ejercicio: { respuesta: number; respuestaTexto?: string }): string {
  return ejercicio.respuestaTexto ?? String(ejercicio.respuesta).replace("-", "−");
}
