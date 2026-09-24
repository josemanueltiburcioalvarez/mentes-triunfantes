// Motor de operaciones combinadas: expresiones como lista de fichas, reglas de jerarquia
// (parentesis, potencias y raices, x / ÷, + −) y generadores por nivel de dificultad.

export type SignoOperacion = "+" | "−" | "×" | "÷";

export type Token =
  | { t: "num"; v: number }
  | { t: "op"; v: SignoOperacion }
  | { t: "lp" }
  | { t: "rp" }
  | { t: "pow"; e: number }
  | { t: "sqrt" };

const num = (v: number): Token => ({ t: "num", v });
const op = (v: SignoOperacion): Token => ({ t: "op", v });
const LP: Token = { t: "lp" };
const RP: Token = { t: "rp" };
const pow = (e: number): Token => ({ t: "pow", e });
const SQRT: Token = { t: "sqrt" };

const SUPERINDICES = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
export const superindice = (n: number) =>
  String(n)
    .split("")
    .map((d) => SUPERINDICES[Number(d)])
    .join("");

export function aTexto(tokens: Token[]): string {
  return tokens
    .map((k) => {
      switch (k.t) {
        case "num":
          return String(k.v);
        case "op":
          return ` ${k.v} `;
        case "lp":
          return "(";
        case "rp":
          return ")";
        case "pow":
          return superindice(k.e);
        case "sqrt":
          return "√";
      }
    })
    .join("");
}

export interface Reduccion {
  desde: number;
  hasta: number;
  indiceClic: number;
  valor: number;
  operacion: string; // ej. "4 × 5"
  permitida: boolean;
  motivo?: string;
  categoria: "parentesis" | "potencia" | "raiz" | "multiplicativa" | "aditiva";
}

const prec = (v: SignoOperacion) => (v === "+" || v === "−" ? 1 : 2);

function calcular(a: number, s: SignoOperacion, b: number): number {
  switch (s) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

// Todas las operaciones que se podrian intentar ahora (sus operandos ya son numeros sueltos),
// indicando si la jerarquia permite hacerlas ya.
export function candidatas(tokens: Token[]): Reduccion[] {
  const hayParentesis = tokens.some((k) => k.t === "lp");
  const profundidad: number[] = [];
  let nivel = 0;
  tokens.forEach((k, i) => {
    if (k.t === "rp") nivel--;
    profundidad[i] = nivel;
    if (k.t === "lp") nivel++;
  });

  const resultado: Reduccion[] = [];
  const motivoParentesis = "Primero se resuelve lo que está entre paréntesis.";

  tokens.forEach((k, i) => {
    if (k.t === "op") {
      const izq = tokens[i - 1];
      const der = tokens[i + 1];
      if (izq?.t !== "num" || der?.t !== "num") return;
      if (tokens[i - 2]?.t === "sqrt" || tokens[i + 2]?.t === "pow") return;

      const previo = tokens[i - 2]?.t === "op" ? (tokens[i - 2] as { t: "op"; v: SignoOperacion }).v : null;
      const siguiente = tokens[i + 2]?.t === "op" ? (tokens[i + 2] as { t: "op"; v: SignoOperacion }).v : null;

      let motivo: string | undefined;
      if (hayParentesis && profundidad[i] === 0) motivo = motivoParentesis;
      else if (previo && prec(previo) > prec(k.v))
        motivo = "Antes hay que hacer la multiplicación o división que está a su lado: van antes que la suma y la resta.";
      else if (previo && prec(previo) === prec(k.v))
        motivo = "Con operaciones del mismo nivel se resuelve de izquierda a derecha: falta hacer la de su izquierda.";
      else if (siguiente && prec(siguiente) > prec(k.v))
        motivo = "La multiplicación o división que está a su lado va antes que la suma y la resta.";

      resultado.push({
        desde: i - 1,
        hasta: i + 1,
        indiceClic: i,
        valor: calcular(izq.v, k.v, der.v),
        operacion: `${izq.v} ${k.v} ${der.v}`,
        permitida: !motivo,
        motivo,
        categoria: prec(k.v) === 1 ? "aditiva" : "multiplicativa",
      });
    } else if (k.t === "pow") {
      const base = tokens[i - 1];
      if (base?.t !== "num" || tokens[i - 2]?.t === "sqrt") return;
      const motivo = hayParentesis && profundidad[i] === 0 ? motivoParentesis : undefined;
      resultado.push({
        desde: i - 1,
        hasta: i,
        indiceClic: i,
        valor: base.v ** k.e,
        operacion: `${base.v}${superindice(k.e)}`,
        permitida: !motivo,
        motivo,
        categoria: "potencia",
      });
    } else if (k.t === "sqrt") {
      const radicando = tokens[i + 1];
      if (radicando?.t !== "num" || tokens[i + 2]?.t === "pow") return;
      const motivo = hayParentesis && profundidad[i] === 0 ? motivoParentesis : undefined;
      resultado.push({
        desde: i,
        hasta: i + 1,
        indiceClic: i,
        valor: Math.sqrt(radicando.v),
        operacion: `√${radicando.v}`,
        permitida: !motivo,
        motivo,
        categoria: "raiz",
      });
    }
  });
  return resultado;
}

// ( n ) -> n
function limpiar(tokens: Token[]): Token[] {
  const lista = [...tokens];
  for (let i = 0; i < lista.length - 2; ) {
    if (lista[i].t === "lp" && lista[i + 1].t === "num" && lista[i + 2].t === "rp") {
      lista.splice(i, 3, lista[i + 1]);
      i = 0;
    } else i++;
  }
  return lista;
}

export function aplicar(tokens: Token[], r: Reduccion): Token[] {
  const lista = [...tokens];
  lista.splice(r.desde, r.hasta - r.desde + 1, num(r.valor));
  return limpiar(lista);
}

export interface PasoResolucion {
  antes: Token[];
  reduccion: Reduccion;
  despues: Token[];
  dentroDeParentesis: boolean;
}

// Resolucion canonica (primera operacion permitida de izquierda a derecha). null si algun paso
// no da un entero >= 0 o si queda atascada.
export function pasosResolucion(inicial: Token[]): PasoResolucion[] | null {
  let tokens = limpiar(inicial);
  const pasos: PasoResolucion[] = [];
  for (let guarda = 0; guarda < 30; guarda++) {
    if (tokens.length === 1 && tokens[0].t === "num") return pasos;
    const posibles = candidatas(tokens).filter((c) => c.permitida);
    if (posibles.length === 0) return null;
    const elegida = posibles[0];
    if (!Number.isInteger(elegida.valor) || elegida.valor < 0) return null;
    const despues = aplicar(tokens, elegida);
    const abiertos = tokens.slice(0, elegida.desde).filter((k) => k.t === "lp").length;
    const cerrados = tokens.slice(0, elegida.desde).filter((k) => k.t === "rp").length;
    pasos.push({ antes: tokens, reduccion: elegida, despues, dentroDeParentesis: abiertos > cerrados });
    tokens = despues;
  }
  return null;
}

export function resultadoFinal(tokens: Token[]): number | null {
  const pasos = pasosResolucion(tokens);
  if (!pasos) return null;
  const ultimo = pasos.length ? pasos[pasos.length - 1].despues : limpiar(tokens);
  return ultimo.length === 1 && ultimo[0].t === "num" ? ultimo[0].v : null;
}

// ---------------------------------------------------------------- generadores
const entre = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const N = num;

function constructor(digito: number): Token[] {
  const a = entre(2, 9);
  const b = entre(2, 9);
  const c = entre(2, 9);
  const d = entre(2, 9);
  switch (digito) {
    case 1: {
      const v = entre(0, 3);
      if (v === 0) return [N(entre(1, 9)), op("+"), N(b), op("×"), N(c)];
      if (v === 1) return [N(a), op("×"), N(b), op("+"), N(entre(1, 9))];
      if (v === 2) return [N(a), op("×"), N(b), op("−"), N(entre(1, a * b - 1 > 9 ? 9 : Math.max(1, a * b - 1)))];
      return [N(entre(20, 45)), op("−"), N(entre(2, 5)), op("×"), N(entre(2, 5))];
    }
    case 2: {
      const v = entre(0, 4);
      if (v === 0) return [N(a), op("+"), N(b), op("×"), N(c), op("−"), N(entre(1, 9))];
      if (v === 1) {
        const divisor = entre(2, 6);
        return [N(a), op("×"), N(b), op("+"), N(divisor * entre(2, 9)), op("÷"), N(divisor)];
      }
      if (v === 2) {
        const divisor = entre(2, 5);
        return [N(entre(12, 30)), op("−"), N(divisor * entre(2, 9)), op("÷"), N(divisor), op("+"), N(entre(1, 9))];
      }
      if (v === 3) {
        const divisor = entre(2, 6);
        return [N(divisor * entre(2, 9)), op("÷"), N(divisor), op("×"), N(entre(2, 9))]; // izquierda a derecha
      }
      return [N(entre(15, 40)), op("−"), N(entre(2, 9)), op("+"), N(entre(2, 9))]; // izquierda a derecha
    }
    case 3: {
      const v = entre(0, 4);
      if (v === 0) return [LP, N(a), op("+"), N(b), RP, op("×"), N(c)];
      if (v === 1) return [N(a), op("×"), LP, N(entre(5, 12)), op("−"), N(entre(1, 4)), RP];
      if (v === 2) {
        const divisor = entre(2, 6);
        const suma = divisor * entre(2, 6);
        const x = entre(1, suma - 1);
        return [LP, N(x), op("+"), N(suma - x), RP, op("÷"), N(divisor)];
      }
      if (v === 3) return [N(a), op("+"), LP, N(entre(6, 15)), op("−"), N(entre(1, 5)), RP, op("×"), N(d)];
      return [N(entre(30, 60)), op("−"), LP, N(a), op("+"), N(b), RP];
    }
    case 4: {
      const v = entre(0, 3);
      if (v === 0) return [LP, N(a), op("+"), N(b), RP, op("×"), LP, N(entre(6, 12)), op("−"), N(entre(1, 5)), RP];
      if (v === 1) {
        const divisor = entre(2, 5);
        return [N(a), op("×"), LP, N(b), op("+"), N(c), RP, op("−"), N(divisor * entre(2, 8)), op("÷"), N(divisor)];
      }
      if (v === 2) return [LP, N(entre(8, 15)), op("−"), N(entre(1, 6)), RP, op("×"), N(c), op("+"), N(d), op("×"), N(entre(2, 6))];
      {
        const divisor = entre(2, 5);
        const suma = divisor * entre(2, 6);
        const x = entre(1, suma - 1);
        return [LP, N(x), op("+"), N(suma - x), RP, op("÷"), N(divisor), op("+"), N(c), op("×"), N(d)];
      }
    }
    default: {
      const v = entre(0, 4);
      if (v === 0) return [N(entre(2, 12)), op("+"), N(entre(2, 5)), pow(2), op("×"), N(entre(2, 5))];
      if (v === 1) {
        const suma = entre(3, 8);
        const x = entre(1, suma - 1);
        const cuadrado = suma * suma;
        const divisores = [2, 3, 4, 5, 6, 8, 9].filter((k) => cuadrado % k === 0);
        return [LP, N(x), op("+"), N(suma - x), RP, pow(2), op("÷"), N(divisores[entre(0, divisores.length - 1)])];
      }
      if (v === 2) {
        const raiz = [16, 25, 36, 49, 64, 81][entre(0, 5)];
        return [SQRT, N(raiz), op("+"), N(a), op("×"), N(b)];
      }
      if (v === 3) return [N(entre(4, 9)), pow(2), op("−"), SQRT, N([16, 25, 36, 49][entre(0, 3)])];
      return [LP, N(entre(6, 12)), op("−"), N(entre(1, 5)), RP, pow(2), op("×"), N(entre(2, 4)), op("+"), N(entre(1, 9))];
    }
  }
}

export function generarCombinada(digito: number): { tokens: Token[]; respuesta: number } {
  for (let intento = 0; intento < 500; intento++) {
    const tokens = constructor(digito);
    const pasos = pasosResolucion(tokens);
    if (!pasos || pasos.length < 2) continue;
    if (pasos.some((p) => p.reduccion.valor > 999)) continue;
    const final = resultadoFinal(tokens);
    if (final === null || final < 1) continue;
    return { tokens, respuesta: final };
  }
  return { tokens: [N(3), op("+"), N(4), op("×"), N(5)], respuesta: 23 };
}
