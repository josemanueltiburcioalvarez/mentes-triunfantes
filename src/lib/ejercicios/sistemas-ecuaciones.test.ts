import { describe, expect, it } from "vitest";
import { generarSistema } from "./sistemas-ecuaciones";

const aNumero = (t: string) => Number(t.replace("−", "-"));

// "ax + by = c"  (b siempre positivo en la ecuacion 1)  /  "ax − by = c"  (en la 2)
function leer(texto: string, signoY: "+" | "−") {
  const m = texto.match(new RegExp(`^(\\d+)x \\${signoY} (\\d+)y = (−?\\d+)$`));
  if (!m) throw new Error(`Formato inesperado: ${texto}`);
  return { a: Number(m[1]), b: Number(m[2]), c: aNumero(m[3]) };
}

describe("generarSistema", () => {
  it("la solucion cumple las dos ecuaciones y la comprobacion cuadra (todos los digitos)", () => {
    for (let digito = 1; digito <= 5; digito++) {
      for (let i = 0; i < 300; i++) {
        const s = generarSistema(digito);
        const e1 = leer(s.texto1, "+");
        const e2 = leer(s.texto2, "−");
        expect(e1.a * s.solucionX + e1.b * s.solucionY).toBe(e1.c);
        expect(e2.a * s.solucionX - e2.b * s.solucionY).toBe(e2.c);
        expect(s.comprobacion.valorEsperado).toBe(e2.c);
      }
    }
  });

  it("los pasos terminan en x e y, y solo hay que igualar desde el digito 2", () => {
    for (let digito = 1; digito <= 5; digito++) {
      for (let i = 0; i < 100; i++) {
        const s = generarSistema(digito);
        const tipos = s.pasos.map((p) => p.tipo);
        expect(tipos.includes("igualar")).toBe(digito >= 2);
        expect(tipos.at(-1)).toBe("dividir");
        expect(s.pasos.find((p) => p.tipo === "resolver")?.respuesta).toBe(s.solucionX);
        expect(s.pasos.at(-1)?.respuesta).toBe(s.solucionY);
        expect(s.pasos.every((p) => Number.isFinite(p.respuesta))).toBe(true);
        // el unico paso con opciones es el de igualar, y su opcion correcta existe
        for (const p of s.pasos) {
          if (p.opciones) expect(p.opciones.map((o) => o.id)).toContain(p.correcta);
        }
      }
    }
  });

  it("no usa el coeficiente 1 (no se ve '1y') y solo da soluciones negativas desde el digito 4", () => {
    for (let digito = 1; digito <= 5; digito++) {
      let hayNegativas = false;
      for (let i = 0; i < 300; i++) {
        const s = generarSistema(digito);
        expect(s.texto1).not.toMatch(/(^|[^\d])1y/);
        if (s.solucionX < 0 || s.solucionY < 0) hayNegativas = true;
      }
      expect(hayNegativas, `digito ${digito}`).toBe(digito >= 4);
    }
  });
});
