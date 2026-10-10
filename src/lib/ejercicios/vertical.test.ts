import { describe, expect, it } from "vitest";
import {
  digitosTopeResta,
  marcasEsperadas,
  marcasMultiplicacion,
  marcasMultiplicacionDecenas,
  parcialesMultiplicacion,
  pasosDivision,
} from "./vertical";

describe("llevadas y prestadas", () => {
  it("suma: 47 + 38 lleva 1 de las unidades y nada de las decenas", () => {
    expect(marcasEsperadas("suma", 47, 38)).toEqual([1, 0]);
  });

  it("suma: llevadas seguidas (999 + 1)", () => {
    expect(marcasEsperadas("suma", 999, 1)).toEqual([1, 1, 1]);
  });

  it("resta: 52 − 37 presta en las unidades y deja 12 y 4 arriba", () => {
    expect(marcasEsperadas("resta", 52, 37)).toEqual([1]);
    expect(digitosTopeResta(52, 37)).toEqual([12, 4]);
  });

  it("resta: 300 − 1 presta dos veces y la columna del medio queda en 9", () => {
    expect(digitosTopeResta(300, 1)).toEqual([10, 9, 2]);
  });
});

describe("multiplicacion con multiplicador de dos cifras", () => {
  it("las llevadas de las unidades y de las decenas son distintas (47 × 36)", () => {
    expect(marcasMultiplicacion(47, 36)).toEqual([4]); // 7 × 6 = 42
    expect(marcasMultiplicacionDecenas(47, 36)).toEqual([2]); // 7 × 3 = 21
  });

  it("los productos parciales salen primero por las unidades", () => {
    expect(parcialesMultiplicacion(47, 36)).toEqual([282, 141]);
  });

  it("con muchas cifras la llevada se arrastra (999 × 9: 81, luego 81 + 8 = 89)", () => {
    expect(marcasMultiplicacion(999, 9)).toEqual([8, 8]);
  });
});

describe("division larga", () => {
  it("144 ÷ 12 da dos pasos: 1 y 2", () => {
    const { pasos } = pasosDivision(144, 12);
    expect(pasos.map((p) => p.cocienteDigito)).toEqual([1, 2]);
    expect(pasos[0]).toMatchObject({ producto: 12, resto: 2, restoConBajada: 24 });
    expect(pasos[1]).toMatchObject({ producto: 24, resto: 0, restoConBajada: null });
  });

  it("el cociente armado con los pasos es el correcto en divisiones exactas", () => {
    for (const [dividendo, divisor] of [
      [1000, 8],
      [4896, 24],
      [9801, 99],
      [5040, 7],
    ]) {
      const cociente = Number(pasosDivision(dividendo, divisor).pasos.map((p) => p.cocienteDigito).join(""));
      expect(cociente * divisor).toBe(dividendo);
    }
  });
});
