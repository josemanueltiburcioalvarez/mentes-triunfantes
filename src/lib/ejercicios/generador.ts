export type HabilidadBasica = "suma" | "resta" | "tabla_multiplicacion";

export interface EjercicioGenerado {
  enunciado: string;
  respuesta: number;
}

function entreAleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rangoPorDificultad(dificultad: number): { min: number; max: number } {
  // dificultad 1-10 -> rango de numeros de 1 digito a 3 digitos
  if (dificultad <= 2) return { min: 1, max: 9 };
  if (dificultad <= 4) return { min: 10, max: 50 };
  if (dificultad <= 6) return { min: 10, max: 99 };
  if (dificultad <= 8) return { min: 100, max: 500 };
  return { min: 100, max: 999 };
}

function generarSuma(dificultad: number): EjercicioGenerado {
  const { min, max } = rangoPorDificultad(dificultad);
  const a = entreAleatorio(min, max);
  const b = entreAleatorio(min, max);
  const operandos = dificultad >= 9 ? [a, b, entreAleatorio(min, max)] : [a, b];
  const respuesta = operandos.reduce((suma, n) => suma + n, 0);
  return { enunciado: operandos.join(" + ") + " =", respuesta };
}

function generarResta(dificultad: number): EjercicioGenerado {
  const { min, max } = rangoPorDificultad(dificultad);
  const a = entreAleatorio(min, max);
  const b = entreAleatorio(min, a); // aseguramos resultado no negativo
  return { enunciado: `${a} - ${b} =`, respuesta: a - b };
}

function tablaMaxima(dificultad: number): number {
  if (dificultad <= 3) return 5;
  if (dificultad <= 6) return 8;
  if (dificultad <= 8) return 10;
  return 12;
}

function generarTablaMultiplicacion(dificultad: number): EjercicioGenerado {
  const max = tablaMaxima(dificultad);
  const a = entreAleatorio(2, max);
  const b = entreAleatorio(2, max);
  return { enunciado: `${a} × ${b} =`, respuesta: a * b };
}

export function generarEjercicio(
  habilidad: HabilidadBasica,
  dificultad: number
): EjercicioGenerado {
  switch (habilidad) {
    case "suma":
      return generarSuma(dificultad);
    case "resta":
      return generarResta(dificultad);
    case "tabla_multiplicacion":
      return generarTablaMultiplicacion(dificultad);
  }
}

export const NOMBRES_HABILIDAD_BASICA: Record<HabilidadBasica, string> = {
  suma: "Suma",
  resta: "Resta",
  tabla_multiplicacion: "Tabla de multiplicar",
};
