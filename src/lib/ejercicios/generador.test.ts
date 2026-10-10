import { describe, expect, it } from "vitest";
import {
  generarEjercicio,
  generarExamenHabilidad,
  generarExamenNivel,
  generarExamenUbicacion,
  HABILIDADES_PRACTICABLES,
  repartoDigitos,
} from "./generador";

// Los ejercicios son aleatorios: cada prueba se repite varias veces para no depender de una sola muestra.
const REPETICIONES = 30;

describe("repartoDigitos", () => {
  it("con 20 preguntas da 1 / 5 / 6 / 5 / 3 (poco del digito 1, mas de los medios)", () => {
    expect(repartoDigitos(20)).toEqual([1, 5, 6, 5, 3]);
  });

  it("siempre suma el total y nunca es negativo", () => {
    for (let total = 1; total <= 40; total++) {
      const reparto = repartoDigitos(total);
      expect(reparto).toHaveLength(5);
      expect(reparto.reduce((a, b) => a + b, 0)).toBe(total);
      expect(reparto.every((n) => n >= 0)).toBe(true);
    }
  });

  it("con 8 preguntas o menos deja fuera el digito 1", () => {
    for (let total = 1; total <= 8; total++) expect(repartoDigitos(total)[0]).toBe(0);
  });
});

describe("generarEjercicio", () => {
  it("todas las habilidades, digitos y tamanos dan un enunciado y una respuesta numerica", () => {
    for (const habilidad of HABILIDADES_PRACTICABLES) {
      for (let digito = 1; digito <= 5; digito++) {
        for (let nivel = 1; nivel <= 3; nivel++) {
          for (let i = 0; i < 5; i++) {
            const e = generarEjercicio(habilidad, digito, nivel);
            expect(e.enunciado.length, `${habilidad} ${digito}.${nivel}`).toBeGreaterThan(0);
            expect(Number.isFinite(e.respuesta), `${habilidad} ${digito}.${nivel}: ${e.enunciado}`).toBe(true);
          }
        }
      }
    }
  });
});

describe("generarExamenHabilidad", () => {
  it("tiene 20 preguntas repartidas 1/5/6/5/3 entre los digitos", () => {
    for (const habilidad of HABILIDADES_PRACTICABLES) {
      const examen = generarExamenHabilidad(habilidad);
      expect(examen).toHaveLength(20);
      const porDigito = [1, 2, 3, 4, 5].map((d) => examen.filter((p) => p.digito === d).length);
      expect(porDigito, habilidad).toEqual([1, 5, 6, 5, 3]);
      expect(examen.every((p) => p.habilidad === habilidad)).toBe(true);
    }
  });
});

describe("generarExamenNivel", () => {
  it("toma hasta 10 por habilidad y nunca pasa de 30 preguntas", () => {
    expect(generarExamenNivel(["suma", "resta", "tabla_multiplicacion"])).toHaveLength(30);
    expect(generarExamenNivel(["suma", "resta"])).toHaveLength(20);
    expect(generarExamenNivel([...HABILIDADES_PRACTICABLES.slice(0, 10)])).toHaveLength(30);
    expect(generarExamenNivel([...HABILIDADES_PRACTICABLES])).toHaveLength(HABILIDADES_PRACTICABLES.length);
  });

  it("incluye preguntas de todas las habilidades pedidas", () => {
    const habilidades = ["suma", "division", "potencia"] as const;
    const examen = generarExamenNivel([...habilidades]);
    for (const h of habilidades) expect(examen.some((p) => p.habilidad === h)).toBe(true);
  });
});

describe("generarExamenUbicacion", () => {
  it("son 20 preguntas: 10 faciles (digitos 1-2), 5 intermedias (2-3) y 5 avanzadas (4-5), en ese orden", () => {
    for (const modalidad of ["primaria", "secundaria"] as const) {
      for (let i = 0; i < REPETICIONES; i++) {
        const e = generarExamenUbicacion(modalidad);
        expect(e).toHaveLength(20);
        expect(e.slice(0, 10).every((p) => p.digito >= 1 && p.digito <= 2)).toBe(true);
        expect(e.slice(10, 15).every((p) => p.digito >= 2 && p.digito <= 3)).toBe(true);
        expect(e.slice(15).every((p) => p.digito >= 4 && p.digito <= 5)).toBe(true);
        expect(e.every((p) => Number.isFinite(p.respuesta))).toBe(true);
      }
    }
  });

  it("primaria incluye siempre las 8 habilidades; secundaria suma los numeros con signo", () => {
    const basicas = ["suma", "resta", "multiplicacion", "division", "potencia", "raiz", "operaciones_combinadas", "ecuaciones"];
    for (let i = 0; i < REPETICIONES; i++) {
      const primaria = new Set(generarExamenUbicacion("primaria").map((p) => p.habilidad));
      for (const h of basicas) expect(primaria.has(h as never), h).toBe(true);
      expect([...primaria].every((h) => !h.endsWith("_enteros"))).toBe(true);
    }
    const secundaria = new Set<string>();
    for (let i = 0; i < REPETICIONES; i++) generarExamenUbicacion("secundaria").forEach((p) => secundaria.add(p.habilidad));
    expect(secundaria.has("suma_enteros")).toBe(true);
    expect(secundaria.has("combinadas_enteros")).toBe(true);
  });
});
