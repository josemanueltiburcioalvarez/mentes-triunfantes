// Atajos de calculo mental: un truco especifico por digito.
import { superindice } from "./combinadas";

function entre(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const DESCRIPCIONES_ATAJOS: string[] = [
  "",
  "Multiplicar por 10, 100 y 1000",
  "Multiplicar por 5, 25 y 50",
  "Multiplicar por 11",
  "El cuadrado de un número terminado en 5",
  "Números cercanos a 100 y diferencia de cuadrados",
];

export interface Atajo {
  enunciado: string;
  respuesta: number;
}

function atajoPotenciasDeDiez(): Atajo {
  const mult = [10, 100, 1000][entre(0, 2)];
  const a = entre(12, 987);
  return { enunciado: `${a} × ${mult} =`, respuesta: a * mult };
}

function atajoPorCincoVeinticincoCincuenta(): Atajo {
  const mult = [5, 25, 50][entre(0, 2)];
  const a = entre(12, 480);
  return { enunciado: `${a} × ${mult} =`, respuesta: a * mult };
}

function atajoPorOnce(): Atajo {
  const a = Math.random() < 0.6 ? entre(10, 99) : entre(100, 999);
  return { enunciado: `${a} × 11 =`, respuesta: a * 11 };
}

function atajoCuadradoTerminadoEn5(): Atajo {
  const n = entre(1, 99) * 10 + 5;
  return { enunciado: `${n}${superindice(2)} =`, respuesta: n * n };
}

function atajoCercaDeCien(): Atajo {
  if (Math.random() < 0.5) {
    const a = entre(88, 99);
    const b = entre(88, 99);
    return { enunciado: `${a} × ${b} =`, respuesta: a * b };
  }
  const b = entre(2, 30);
  const a = entre(b + 5, b + 60);
  return { enunciado: `(${a} + ${b}) × (${a} − ${b}) =`, respuesta: a * a - b * b };
}

export function generarAtajo(digito: number): Atajo {
  switch (digito) {
    case 1:
      return atajoPotenciasDeDiez();
    case 2:
      return atajoPorCincoVeinticincoCincuenta();
    case 3:
      return atajoPorOnce();
    case 4:
      return atajoCuadradoTerminadoEn5();
    default:
      return atajoCercaDeCien();
  }
}
