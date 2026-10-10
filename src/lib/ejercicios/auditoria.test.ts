import { describe, expect, it } from "vitest";
import {
  generarEjercicio,
  generarExamenHabilidad,
  generarExamenNivel,
  generarExamenUbicacion,
  HABILIDADES_PRACTICABLES,
  type EjercicioGenerado,
  type HabilidadPracticable,
} from "./generador";
import { NO_EXISTE } from "./enteros";

// Auditoria: vuelve a calcular cada ejercicio por su cuenta (con un evaluador independiente del generador)
// y comprueba que la respuesta guardada es la correcta, que las divisiones son exactas, que en primaria
// nada da negativo, que las ecuaciones y los sistemas tienen la solucion que dice el generador, etc.

const SUPER: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
const RAICES: Record<string, number> = { "√": 2, "∛": 3, "∜": 4 };

interface OpcionesEval {
  vars?: Record<string, number>;
  // aritmetica entera: toda division debe ser exacta
  exacta?: boolean;
  // primaria: ningun resultado intermedio puede ser negativo
  sinNegativos?: boolean;
}

// Evaluador recursivo: + - * / (con precedencia), potencias en superindice, raices, parentesis, signo unario,
// multiplicacion implicita (3x, 2(x+1)). Lanza si algo no cuadra.
function evaluar(texto: string, op: OpcionesEval = {}): number {
  const s = texto.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  let i = 0;

  const comprobar = (v: number) => {
    if (op.sinNegativos && v < 0) throw new Error(`resultado negativo en "${texto}"`);
    return v;
  };

  function expr(): number {
    let v = term();
    while (s[i] === "+" || s[i] === "-") {
      const o = s[i++];
      const r = term();
      v = comprobar(o === "+" ? v + r : v - r);
    }
    return v;
  }

  function term(): number {
    let v = unario();
    for (;;) {
      const c = s[i];
      if (c === "*" || c === "/") {
        i++;
        const r = unario();
        if (c === "*") v = v * r;
        else {
          if (r === 0) throw new Error(`division entre cero en "${texto}"`);
          if (op.exacta && !Number.isInteger(v / r)) throw new Error(`division no exacta ${v} ÷ ${r} en "${texto}"`);
          v = v / r;
        }
        comprobar(v);
      } else if (c !== undefined && (/[a-z]/.test(c) || c === "(")) {
        v = v * potencia(); // multiplicacion implicita
      } else return v;
    }
  }

  function unario(): number {
    if (s[i] === "-") {
      i++;
      return -unario();
    }
    if (s[i] === "+") {
      i++;
      return unario();
    }
    return potencia();
  }

  function potencia(): number {
    const base = atomo();
    let exp = "";
    while (s[i] !== undefined && SUPER[s[i]] !== undefined) exp += SUPER[s[i++]];
    return exp ? base ** Number(exp) : base;
  }

  function atomo(): number {
    const c = s[i];
    if (c === "(") {
      i++;
      const v = expr();
      if (s[i++] !== ")") throw new Error(`falta ")" en "${texto}"`);
      return v;
    }
    if (c === "⁵" && s[i + 1] === "√") {
      i += 2;
      return raiz(5, atomo());
    }
    if (c !== undefined && RAICES[c]) {
      i++;
      return raiz(RAICES[c], atomo());
    }
    if (c !== undefined && /[a-z]/.test(c)) {
      i++;
      if (op.vars?.[c] === undefined) throw new Error(`variable ${c} sin valor en "${texto}"`);
      return op.vars[c];
    }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i));
    if (!m) throw new Error(`no entiendo "${s.slice(i)}" en "${texto}"`);
    i += m[0].length;
    return Number(m[0]);
  }

  function raiz(indice: number, radicando: number): number {
    if (radicando < 0 && indice % 2 === 0) return NaN;
    const r = Math.round(Math.sign(radicando) * Math.abs(radicando) ** (1 / indice));
    if (r ** indice !== radicando) throw new Error(`raiz no exacta de ${radicando} en "${texto}"`);
    return r;
  }

  const v = expr();
  if (i !== s.length) throw new Error(`sobra "${s.slice(i)}" en "${texto}"`);
  return v;
}

const PRIMARIA: HabilidadPracticable[] = [
  "suma",
  "resta",
  "tabla_multiplicacion",
  "multiplicacion",
  "division",
  "potencia",
  "raiz",
  "operaciones_combinadas",
];

const numero = (t: string) => Number(t.replace("−", "-"));

// Devuelve un texto con el problema si el ejercicio esta mal; null si esta bien.
function revisar(habilidad: HabilidadPracticable, e: EjercicioGenerado): string | null {
  const cual = `${habilidad}: "${e.enunciado}" => ${e.respuesta}`;
  if (/NaN|undefined|Infinity|null/.test(e.enunciado)) return `${cual} (texto roto)`;
  if (e.respuesta !== NO_EXISTE && (!Number.isInteger(e.respuesta) || Math.abs(e.respuesta) >= 1e9)) return `${cual} (respuesta no entera o enorme)`;

  try {
    if (habilidad === "sistemas_ecuaciones") {
      const s = e.sistema!;
      const x = s.solucionX;
      const y = s.solucionY;
      if (!Number.isInteger(x) || !Number.isInteger(y)) return `${cual} (solucion no entera)`;
      for (const t of [s.texto1, s.texto2]) {
        const [izq, der] = t.split("=");
        const f = (xx: number, yy: number) => evaluar(izq, { vars: { x: xx, y: yy } }) - evaluar(der, { vars: { x: xx, y: yy } });
        if (Math.abs(f(x, y)) > 1e-9) return `${cual}: "${t}" no se cumple con x=${x}, y=${y}`;
      }
      const lin = (t: string, xx: number, yy: number) => {
        const [izq, der] = t.split("=");
        return evaluar(izq, { vars: { x: xx, y: yy } }) - evaluar(der, { vars: { x: xx, y: yy } });
      };
      const c = (t: string) => [lin(t, 1, 0) - lin(t, 0, 0), lin(t, 0, 1) - lin(t, 0, 0)];
      const [a1, b1] = c(s.texto1);
      const [a2, b2] = c(s.texto2);
      if (a1 * b2 - a2 * b1 === 0) return `${cual}: el sistema no tiene solucion unica`;
      if (e.respuesta !== x) return `${cual}: respuesta distinta de x`;
      return null;
    }

    if (habilidad === "ecuaciones") {
      const [izq, der] = e.ecuacion!.texto.split("=");
      const f = (x: number) => evaluar(izq, { vars: { x } }) - evaluar(der, { vars: { x } });
      if (Math.abs(f(e.respuesta)) > 1e-9) return `${cual}: la ecuacion "${e.ecuacion!.texto}" no se cumple`;
      if (Math.abs(f(e.respuesta + 1) - f(e.respuesta)) < 1e-9) return `${cual}: la ecuacion no tiene solucion unica`;
      return null;
    }

    if (habilidad === "atajos" || PRIMARIA.includes(habilidad) || habilidad.endsWith("_enteros")) {
      const expresion = e.enunciado.replace(/^Resuelve:\s*/, "").replace(/\s*=\s*$/, "");
      const esPrimaria = PRIMARIA.includes(habilidad);
      const v = evaluar(expresion, { exacta: true, sinNegativos: esPrimaria || habilidad === "atajos" });
      if (Number.isNaN(v)) {
        if (e.respuesta !== NO_EXISTE) return `${cual}: la raiz no existe pero la respuesta es un numero`;
        if (habilidad !== "raiz_enteros") return `${cual}: raiz sin resultado fuera de raiz_enteros`;
        return null;
      }
      if (v !== e.respuesta) return `${cual}: al recalcular da ${v}`;
      if (esPrimaria && e.respuesta < 0) return `${cual}: negativo en primaria`;
      return null;
    }

    if (habilidad === "combinadas_enteros") {
      const v = evaluar(e.enunciado.replace(/\s*=\s*$/, ""), { exacta: true });
      return v === e.respuesta ? null : `${cual}: al recalcular da ${v}`;
    }

    if (habilidad === "razonamiento") return revisarRazonamiento(e, cual);
  } catch (err) {
    return `${cual} -> ${(err as Error).message}`;
  }
  return null;
}

function revisarRazonamiento(e: EjercicioGenerado, cual: string): string | null {
  const t = e.enunciado;
  let esperado: number | null = null;
  let m: RegExpExecArray | null;
  if ((m = /tiene (\d+) .+ y compra (\d+) más/.exec(t))) esperado = +m[1] + +m[2];
  else if ((m = /tenía (\d+) [^.]+ y regaló (\d+)\./.exec(t))) esperado = +m[1] - +m[2];
  else if ((m = /(\d+) filas de (\d+) asientos/.exec(t))) esperado = +m[1] * +m[2];
  else if ((m = /repartió (\d+) .+ entre (\d+) amigos/.exec(t))) esperado = +m[1] / +m[2];
  else if ((m = /Compraste (\d+) .+ a (\d+) soles .+ billete de (\d+) soles/.exec(t))) esperado = +m[3] - +m[1] * +m[2];
  else if ((m = /tenía (\d+) .+\. Compró (\d+) paquetes de (\d+) .+ regaló (\d+)\./.exec(t))) esperado = +m[1] + +m[2] * +m[3] - +m[4];
  else if ((m = /era de ([−-]?\d+) °C .+ bajó (\d+) °C/.exec(t))) esperado = numero(m[1]) - +m[2];
  else if ((m = /ganancia de (\d+) soles .+ pérdida de (\d+) soles/.exec(t))) esperado = +m[1] - +m[2];
  else if ((m = /aumentado en (\d+) es igual al triple de (\d+)/.exec(t))) esperado = 3 * +m[2] - +m[1];
  else if ((m = /consecutivos es (\d+)\./.exec(t))) esperado = (+m[1] - 1) / 2;
  else if ((m = /menos (\d+), es igual a (\d+)/.exec(t))) esperado = (+m[2] + +m[1]) / 2;
  if (esperado === null) return `${cual}: plantilla de razonamiento desconocida`;
  return esperado === e.respuesta ? null : `${cual}: esperado ${esperado}`;
}

describe("auditoria de ejercicios (recalculados con un evaluador independiente)", () => {
  const REPS = 60;

  for (const habilidad of HABILIDADES_PRACTICABLES) {
    it(`${habilidad}: todas las respuestas son correctas en los 5 digitos y 3 numeros`, () => {
      const fallos = new Set<string>();
      let total = 0;
      for (let digito = 1; digito <= 5; digito++) {
        for (let nivel = 1; nivel <= 3; nivel++) {
          for (let i = 0; i < REPS; i++) {
            const e = generarEjercicio(habilidad, digito, nivel);
            total++;
            const problema = revisar(habilidad, e);
            if (problema) fallos.add(`[d${digito}.${nivel}] ${problema}`);
          }
        }
      }
      expect([...fallos].slice(0, 8), `${fallos.size} problemas en ${total} ejercicios`).toEqual([]);
    });
  }

  it("los examenes (habilidad, nivel y ubicacion) tambien salen correctos", () => {
    const fallos = new Set<string>();
    for (let r = 0; r < 25; r++) {
      for (const h of HABILIDADES_PRACTICABLES) for (const p of generarExamenHabilidad(h)) {
        const m = revisar(p.habilidad, p);
        if (m) fallos.add(m);
      }
      for (const p of generarExamenNivel([...HABILIDADES_PRACTICABLES])) {
        const m = revisar(p.habilidad, p);
        if (m) fallos.add(m);
      }
      for (const mod of ["primaria", "secundaria"] as const) for (const p of generarExamenUbicacion(mod)) {
        const m = revisar(p.habilidad, p);
        if (m) fallos.add(m);
      }
    }
    expect([...fallos].slice(0, 8)).toEqual([]);
  });

  it("no se repite la misma pregunta dentro de un examen de ubicacion", () => {
    let repetidas = 0;
    for (let r = 0; r < 100; r++) {
      for (const mod of ["primaria", "secundaria"] as const) {
        const textos = generarExamenUbicacion(mod).map((p) => p.enunciado);
        repetidas += textos.length - new Set(textos).size;
      }
    }
    // con numeros al azar de 1 cifra una coincidencia puntual es posible, pero debe ser rarisima
    expect(repetidas).toBeLessThan(10);
  });

  it("el auditor de verdad detecta respuestas malas (prueba del auditor)", () => {
    const malo = (h: HabilidadPracticable, enunciado: string, respuesta: number, extra: Partial<EjercicioGenerado> = {}) =>
      revisar(h, { enunciado, respuesta, ...extra });
    expect(malo("suma", "2 + 3 =", 5)).toBeNull();
    expect(malo("suma", "2 + 3 =", 6)).not.toBeNull();
    expect(malo("operaciones_combinadas", "2 + 3 × 4 =", 20)).not.toBeNull();
    expect(malo("operaciones_combinadas", "2 + 3 × 4 =", 14)).toBeNull();
    expect(malo("operaciones_combinadas", "3 − 8 + 9 =", 4)).not.toBeNull(); // paso negativo en primaria
    expect(malo("division", "7 ÷ 2 =", 3)).not.toBeNull(); // division no exacta
    expect(malo("potencia_enteros", "−2⁴ =", 16)).not.toBeNull();
    expect(malo("potencia_enteros", "−2⁴ =", -16)).toBeNull();
    expect(malo("raiz_enteros", "√(−100) =", 10)).not.toBeNull();
    expect(malo("raiz_enteros", "√(−100) =", NO_EXISTE)).toBeNull();
    expect(malo("razonamiento", "Ana tiene 30 lápices y compra 12 más. ¿Cuántos lápices tiene ahora?", 41)).not.toBeNull();
    const eq = (texto: string, solucion: number) =>
      malo("ecuaciones", `Resuelve: ${texto}`, solucion, { ecuacion: { texto, solucion } as never });
    expect(eq("2x − 7 = 13", 10)).toBeNull();
    expect(eq("2x − 7 = 13", 9)).not.toBeNull();
    expect(eq("2(x + 6) = 14", 1)).toBeNull();
  });

  it("el signo menos de los problemas coincide con el de la respuesta", () => {
    expect(numero("−5")).toBe(-5);
    for (let i = 0; i < 200; i++) expect(generarEjercicio("razonamiento", 4, 1).enunciado).not.toMatch(/--/);
  });
});
