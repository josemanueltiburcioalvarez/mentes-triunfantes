export type HabilidadBasica = "suma" | "resta" | "tabla_multiplicacion";

export interface EjercicioGenerado {
  enunciado: string;
  respuesta: number;
}

export interface EjercicioConDigito extends EjercicioGenerado {
  digito: number;
}

function entreAleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

function generarSuma(digito: number): EjercicioGenerado {
  const { min, max } = RANGOS_SUMA_RESTA[digito];
  const a = entreAleatorio(min, max);
  const b = entreAleatorio(min, max);
  return { enunciado: `${a} + ${b} =`, respuesta: a + b };
}

function generarResta(digito: number): EjercicioGenerado {
  const { min, max } = RANGOS_SUMA_RESTA[digito];
  const a = entreAleatorio(min, max);
  const b = entreAleatorio(min, a); // aseguramos resultado no negativo
  return { enunciado: `${a} - ${b} =`, respuesta: a - b };
}

function generarTablaMultiplicacion(digito: number): EjercicioGenerado {
  const { min, max } = RANGOS_TABLA[digito];
  const a = entreAleatorio(min, max);
  const b = entreAleatorio(2, 12);
  return { enunciado: `${a} × ${b} =`, respuesta: a * b };
}

export function generarEjercicio(
  habilidad: HabilidadBasica,
  digito: number
): EjercicioGenerado {
  switch (habilidad) {
    case "suma":
      return generarSuma(digito);
    case "resta":
      return generarResta(digito);
    case "tabla_multiplicacion":
      return generarTablaMultiplicacion(digito);
  }
}

export function descripcionDigito(habilidad: HabilidadBasica, digito: number): string {
  const rangos = habilidad === "tabla_multiplicacion" ? RANGOS_TABLA : RANGOS_SUMA_RESTA;
  return rangos[digito].descripcion;
}

const PREGUNTAS_POR_DIGITO_EN_EXAMEN = 4;

export function generarExamenHabilidad(habilidad: HabilidadBasica): EjercicioConDigito[] {
  const preguntas: EjercicioConDigito[] = [];
  for (let digito = 1; digito <= 5; digito++) {
    for (let i = 0; i < PREGUNTAS_POR_DIGITO_EN_EXAMEN; i++) {
      preguntas.push({ ...generarEjercicio(habilidad, digito), digito });
    }
  }
  for (let i = preguntas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [preguntas[i], preguntas[j]] = [preguntas[j], preguntas[i]];
  }
  return preguntas;
}

export const NOMBRES_HABILIDAD_BASICA: Record<HabilidadBasica, string> = {
  suma: "Suma",
  resta: "Resta",
  tabla_multiplicacion: "Tabla de multiplicar",
};
