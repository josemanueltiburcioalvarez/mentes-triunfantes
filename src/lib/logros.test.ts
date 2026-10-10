import { describe, expect, it } from "vitest";
import { esLogroConocido, evaluarLogros, infoLogro, type DatosLogros } from "./logros";

const VACIO: DatosLogros = {
  ejerciciosAprobados: 0,
  ejerciciosPerfectos: 0,
  habilidadesAl100: 0,
  respuestasTotales: 0,
  examenesHabilidad: 0,
  nivelesSuperados: 0,
  mejorRacha: 0,
  puntajeUbicacion: null,
};

const logrados = (datos: Partial<DatosLogros>) =>
  evaluarLogros({ ...VACIO, ...datos })
    .filter((l) => l.logrado)
    .map((l) => l.id);

describe("evaluarLogros", () => {
  it("un estudiante nuevo no tiene ningun logro", () => {
    expect(logrados({})).toEqual([]);
  });

  it("los ids son unicos", () => {
    const ids = evaluarLogros(VACIO).map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("10 ejercicios aprobados dan 'primeros pasos' y 'calentando', pero no 'imparable'", () => {
    const ids = logrados({ ejerciciosAprobados: 10 });
    expect(ids).toContain("primeros-pasos");
    expect(ids).toContain("calentando");
    expect(ids).not.toContain("imparable");
  });

  it("el progreso nunca pasa de la meta", () => {
    const calentando = evaluarLogros({ ...VACIO, ejerciciosAprobados: 500 }).find((l) => l.id === "calentando");
    expect(calentando).toMatchObject({ actual: 10, meta: 10, logrado: true });
  });

  it("guarda el avance de los que faltan (7 de 10)", () => {
    const calentando = evaluarLogros({ ...VACIO, ejerciciosAprobados: 7 }).find((l) => l.id === "calentando");
    expect(calentando).toMatchObject({ actual: 7, meta: 10, logrado: false });
  });

  it("las rachas usan la mejor racha, no la actual", () => {
    expect(logrados({ mejorRacha: 7 })).toEqual(expect.arrayContaining(["racha-3", "racha-7"]));
    expect(logrados({ mejorRacha: 7 })).not.toContain("racha-30");
  });

  it("'gran inicio' pide 16 o mas en la ubicacion (y sin ubicacion cuenta 0)", () => {
    expect(logrados({ puntajeUbicacion: 15 })).not.toContain("gran-inicio");
    expect(logrados({ puntajeUbicacion: 16 })).toContain("gran-inicio");
    expect(logrados({ puntajeUbicacion: null })).not.toContain("gran-inicio");
  });

  it("niveles, examenes y dominio", () => {
    expect(logrados({ nivelesSuperados: 4 })).toEqual(expect.arrayContaining(["nivel-superado", "mente-elite"]));
    expect(logrados({ examenesHabilidad: 5 })).toEqual(expect.arrayContaining(["examen-aprobado", "cinco-examenes"]));
    expect(logrados({ habilidadesAl100: 3 })).toEqual(expect.arrayContaining(["primer-100", "triple-dominio"]));
    expect(logrados({ habilidadesAl100: 3 })).not.toContain("gran-maestro");
  });
});

describe("infoLogro / esLogroConocido", () => {
  it("reconoce los ids del catalogo y rechaza los demas (incluida la marca interna)", () => {
    expect(esLogroConocido("primeros-pasos")).toBe(true);
    expect(esLogroConocido("inventado")).toBe(false);
    expect(esLogroConocido("__inicio")).toBe(false);
  });

  it("devuelve el logro ya logrado, o null si no existe", () => {
    expect(infoLogro("pleno")).toMatchObject({ nombre: "Pleno", logrado: true });
    expect(infoLogro("nada")).toBeNull();
  });
});
