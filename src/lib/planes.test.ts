import { describe, expect, it } from "vitest";
import { esGradoEscolarValido, GRADOS_ESCOLARES, nombreGrado } from "./grados";
import { ahorroDelPlan, enlaceWhatsApp, PLANES, PRECIO_MENSUAL, textoMeses } from "./planes";

describe("planes", () => {
  it("el plan de 1 mes cuesta el precio mensual y los demas descuentan mas cuanto mas largos son", () => {
    expect(PLANES[0]).toEqual({ meses: 1, precio: PRECIO_MENSUAL });
    let anterior = PRECIO_MENSUAL;
    for (const plan of PLANES.slice(1)) {
      const porMes = plan.precio / plan.meses;
      expect(porMes).toBeLessThan(anterior);
      expect(ahorroDelPlan(plan)).toBe(PRECIO_MENSUAL * plan.meses - plan.precio);
      expect(ahorroDelPlan(plan)).toBeGreaterThan(0);
      anterior = porMes;
    }
  });

  it("textoMeses usa singular y plural", () => {
    expect(textoMeses(1)).toBe("1 mes");
    expect(textoMeses(3)).toBe("3 meses");
  });

  it("el enlace de WhatsApp lleva el numero de Peru y el mensaje codificado", () => {
    const url = enlaceWhatsApp(PLANES[1], "Ana Pérez", "ana@correo.com");
    expect(url.startsWith("https://wa.me/51")).toBe(true);
    const texto = decodeURIComponent(url.split("?text=")[1]);
    expect(texto).toContain("Ana Pérez");
    expect(texto).toContain("ana@correo.com");
    expect(texto).toContain("3 meses");
    expect(texto).toContain(`S/ ${PLANES[1].precio}`);
  });

  it("sin plan elegido el mensaje pide activar el plan", () => {
    const texto = decodeURIComponent(enlaceWhatsApp(null, "Luis", "luis@correo.com").split("?text=")[1]);
    expect(texto).toContain("activar mi plan");
  });
});

describe("grados escolares", () => {
  it("hay 6 de primaria y 5 de secundaria, todos validos", () => {
    expect(GRADOS_ESCOLARES.filter((g) => g.value.startsWith("primaria"))).toHaveLength(6);
    expect(GRADOS_ESCOLARES.filter((g) => g.value.startsWith("secundaria"))).toHaveLength(5);
    for (const g of GRADOS_ESCOLARES) expect(esGradoEscolarValido(g.value)).toBe(true);
  });

  it("rechaza valores inventados y nombra el grado", () => {
    expect(esGradoEscolarValido("universidad_1")).toBe(false);
    expect(esGradoEscolarValido("")).toBe(false);
    expect(nombreGrado("secundaria_3")).toBe("3.° de secundaria");
    expect(nombreGrado(null)).toBe("-");
  });
});
