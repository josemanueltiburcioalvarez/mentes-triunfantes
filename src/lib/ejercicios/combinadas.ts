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

// numero para mostrar dentro de una cuenta: los negativos van entre parentesis, (−5)
export const numeroTexto = (v: number) => (v < 0 ? `(−${-v})` : String(v));

export function aTexto(tokens: Token[]): string {
  return tokens
    .map((k) => {
      switch (k.t) {
        case "num":
          return numeroTexto(k.v);
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
        operacion: `${numeroTexto(izq.v)} ${k.v} ${numeroTexto(der.v)}`,
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
        operacion: `${numeroTexto(base.v)}${superindice(k.e)}`,
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
// no da un entero (>= 0, salvo que se permitan negativos) o si queda atascada.
export function pasosResolucion(inicial: Token[], permitirNegativos = false): PasoResolucion[] | null {
  let tokens = limpiar(inicial);
  const pasos: PasoResolucion[] = [];
  for (let guarda = 0; guarda < 30; guarda++) {
    if (tokens.length === 1 && tokens[0].t === "num") return pasos;
    const posibles = candidatas(tokens).filter((c) => c.permitida);
    if (posibles.length === 0) return null;
    const elegida = posibles[0];
    if (!Number.isInteger(elegida.valor) || (!permitirNegativos && elegida.valor < 0)) return null;
    const despues = aplicar(tokens, elegida);
    const abiertos = tokens.slice(0, elegida.desde).filter((k) => k.t === "lp").length;
    const cerrados = tokens.slice(0, elegida.desde).filter((k) => k.t === "rp").length;
    pasos.push({ antes: tokens, reduccion: elegida, despues, dentroDeParentesis: abiertos > cerrados });
    tokens = despues;
  }
  return null;
}

export function resultadoFinal(tokens: Token[], permitirNegativos = false): number | null {
  const pasos = pasosResolucion(tokens, permitirNegativos);
  if (!pasos) return null;
  const ultimo = pasos.length ? pasos[pasos.length - 1].despues : limpiar(tokens);
  return ultimo.length === 1 && ultimo[0].t === "num" ? ultimo[0].v : null;
}

// ---------------------------------------------------------------- generadores
const entre = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const N = num;

// Un divisor (2 a 12) que divida exacto a n; null si no hay ninguno.
function divisorDe(n: number): number | null {
  const ds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((k) => n % k === 0);
  return ds.length ? ds[entre(0, ds.length - 1)] : null;
}

// Tamano de los numeros segun el ejercicio (1, 2 o 3) del digito:
// 1 = una cifra, 2 = de 2 a 3 cifras, 3 = de 3 a 4 cifras.
export type TamanoNumeros = 1 | 2 | 3;

// Versiones con numeros grandes de las plantillas de cada digito. Las divisiones son exactas y las
// restas positivas por construccion; generarCombinada descarta lo que aun asi no sirva.
function constructorEscalado(digito: number, m: 2 | 3): Token[] {
  const T = () => (m === 2 ? entre(10, 999) : entre(100, 9999)); // termino para sumar o restar
  const TMAX = m === 2 ? 999 : 9999;
  const M = () => (m === 2 ? entre(12, 99) : entre(100, 999)); // multiplicando
  const Q = () => (m === 2 ? entre(12, 99) : entre(100, 999)); // cociente
  const S = () => entre(2, 9); // multiplicador o divisor de una cifra
  const D = () => entre(2, 6);
  const cuadrados =
    m === 2
      ? [100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400, 441, 484, 529, 576, 625, 676, 729, 784, 841, 900]
      : [1024, 1225, 1600, 2025, 2500, 3025, 3600, 4225, 4900, 5625, 6400, 7225, 8100, 9025, 9801];
  const cuadrado = () => cuadrados[entre(0, cuadrados.length - 1)];
  const sub = (max: number) => entre(1, Math.max(1, Math.min(max, TMAX)));

  switch (digito) {
    case 1: {
      const v = entre(0, 3);
      if (v === 0) return [N(T()), op("+"), N(M()), op("×"), N(S())];
      if (v === 1) return [N(M()), op("×"), N(S()), op("+"), N(T())];
      const mm = M();
      const s = S();
      if (v === 2) return [N(mm), op("×"), N(s), op("−"), N(sub(mm * s - 1))];
      return [N(mm * s + sub(TMAX)), op("−"), N(mm), op("×"), N(s)];
    }
    case 2: {
      const v = entre(0, 4);
      if (v === 0) {
        const t = T();
        const mm = M();
        const s = S();
        return [N(t), op("+"), N(mm), op("×"), N(s), op("−"), N(sub(t + mm * s - 1))];
      }
      if (v === 1) {
        const d = D();
        return [N(M()), op("×"), N(S()), op("+"), N(d * Q()), op("÷"), N(d)];
      }
      if (v === 2) {
        const d = D();
        const q = Q();
        return [N(q + sub(TMAX)), op("−"), N(d * q), op("÷"), N(d), op("+"), N(T())];
      }
      if (v === 3) {
        const d = D();
        return [N(d * Q()), op("÷"), N(d), op("×"), N(S())];
      }
      const b = T();
      return [N(b + sub(TMAX)), op("−"), N(b), op("+"), N(T())];
    }
    case 3: {
      const v = entre(0, 4);
      if (v === 0) return [LP, N(T()), op("+"), N(T()), RP, op("×"), N(S())];
      if (v === 1) {
        const x = T();
        return [N(S()), op("×"), LP, N(x), op("−"), N(sub(x - 1)), RP];
      }
      if (v === 2) {
        const d = D();
        const suma = d * Q();
        const x = entre(1, suma - 1);
        return [LP, N(x), op("+"), N(suma - x), RP, op("÷"), N(d)];
      }
      if (v === 3) {
        const x = T();
        return [N(T()), op("+"), LP, N(x), op("−"), N(sub(x - 1)), RP, op("×"), N(S())];
      }
      const t1 = T();
      const t2 = T();
      return [N(t1 + t2 + sub(TMAX)), op("−"), LP, N(t1), op("+"), N(t2), RP];
    }
    case 4: {
      const v = entre(0, 5);
      if (v === 4) {
        const d = D();
        const suma = d * Q();
        const x = entre(1, suma - 1);
        return [LP, N(x), op("+"), N(suma - x), RP, op("÷"), N(d), op("×"), N(S()), op("−"), N(sub(TMAX))];
      }
      if (v === 5) {
        const d = D();
        return [N(S()), op("×"), LP, N(T()), op("−"), N(sub(TMAX)), RP, op("+"), N(d * Q()), op("÷"), N(d), op("−"), N(sub(TMAX))];
      }
      if (v === 0) return [LP, N(T()), op("+"), N(T()), RP, op("×"), LP, N(entre(6, 15)), op("−"), N(entre(1, 5)), RP];
      if (v === 1) {
        const d = D();
        return [N(S()), op("×"), LP, N(T()), op("+"), N(T()), RP, op("−"), N(d * entre(2, 9)), op("÷"), N(d)];
      }
      if (v === 2) {
        return [LP, N(entre(10, 30)), op("−"), N(entre(1, 9)), RP, op("×"), N(M()), op("+"), N(T()), op("×"), N(S())];
      }
      const d = D();
      const suma = d * Q();
      const x = entre(1, suma - 1);
      return [LP, N(x), op("+"), N(suma - x), RP, op("÷"), N(d), op("+"), N(M()), op("×"), N(S())];
    }
    default: {
      // "todo junto": suma o resta, multiplicacion, division, parentesis, potencia y raiz en una sola expresion
      const P2 = m === 2 ? entre(6, 20) : entre(20, 60); // base que se eleva al cuadrado
      const P3 = m === 2 ? entre(3, 9) : entre(5, 15); // base que se eleva al cubo
      const v = entre(0, 4);
      if (v === 0) {
        const k = D();
        return [LP, SQRT, N(cuadrado()), op("+"), N(P2), pow(2), RP, op("×"), N(S()), op("−"), N(k * Q()), op("÷"), N(k)];
      }
      if (v === 1) {
        const k = D();
        return [N(M()), op("×"), LP, N(P2), pow(2), op("−"), SQRT, N(cuadrado()), RP, op("+"), N(k * Q()), op("÷"), N(k)];
      }
      if (v === 2) {
        const k = divisorDe(P3 ** 3) ?? 1;
        return [SQRT, N(cuadrado()), op("×"), LP, N(T()), op("+"), N(T()), RP, op("−"), N(P3), pow(3), op("÷"), N(k)];
      }
      if (v === 3) {
        const b = entre(2, 40);
        const k = divisorDe(P2 * P2) ?? 1;
        return [LP, N(P2 + b), op("−"), N(b), RP, pow(2), op("÷"), N(k), op("+"), SQRT, N(cuadrado()), op("×"), N(S())];
      }
      const r = cuadrado();
      const total = Math.sqrt(r) + P3 ** 3;
      const k = divisorDe(total) ?? 1;
      return [N(total / k + sub(TMAX)), op("−"), LP, SQRT, N(r), op("+"), N(P3), pow(3), RP, op("÷"), N(k), op("+"), N(S()), op("×"), N(S())];
    }
  }
}

function constructor(digito: number, tamano: TamanoNumeros = 1): Token[] {
  if (tamano > 1) return constructorEscalado(digito, tamano as 2 | 3);
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
      const v = entre(0, 5);
      if (v === 4) {
        const d = entre(2, 5);
        const suma = d * entre(2, 6);
        const x = entre(1, suma - 1);
        return [LP, N(x), op("+"), N(suma - x), RP, op("÷"), N(d), op("×"), N(c), op("−"), N(entre(1, 9))];
      }
      if (v === 5) {
        const d = entre(2, 5);
        return [N(a), op("×"), LP, N(entre(6, 12)), op("−"), N(entre(1, 5)), RP, op("+"), N(d * entre(2, 8)), op("÷"), N(d), op("−"), N(entre(1, 9))];
      }
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
      // "todo junto": suma o resta, multiplicacion, division, parentesis, potencia y raiz en una sola expresion
      const R = () => [16, 25, 36, 49, 64, 81][entre(0, 5)];
      const v = entre(0, 4);
      if (v === 0) {
        const k = entre(2, 5);
        return [LP, SQRT, N(R()), op("+"), N(entre(2, 5)), pow(2), RP, op("×"), N(entre(2, 5)), op("−"), N(k * entre(2, 9)), op("÷"), N(k)];
      }
      if (v === 1) {
        const k = entre(2, 5);
        return [N(a), op("×"), LP, N(entre(3, 8)), pow(2), op("−"), SQRT, N(R()), RP, op("+"), N(k * entre(2, 9)), op("÷"), N(k)];
      }
      if (v === 2) {
        const p = entre(2, 5);
        const k = divisorDe(p ** 3) ?? 1;
        return [SQRT, N(R()), op("×"), LP, N(entre(1, 6)), op("+"), N(entre(1, 6)), RP, op("−"), N(p), pow(3), op("÷"), N(k)];
      }
      if (v === 3) {
        const sdif = entre(2, 9);
        const b2 = entre(1, 8);
        const k = divisorDe(sdif * sdif) ?? 1;
        return [LP, N(sdif + b2), op("−"), N(b2), RP, pow(2), op("÷"), N(k), op("+"), SQRT, N(R()), op("×"), N(entre(2, 5))];
      }
      const r = R();
      const p = entre(2, 4);
      const total = Math.sqrt(r) + p ** 3;
      const k = divisorDe(total) ?? 1;
      return [N(total / k + entre(1, 30)), op("−"), LP, SQRT, N(r), op("+"), N(p), pow(3), RP, op("÷"), N(k), op("+"), N(entre(2, 5)), op("×"), N(entre(2, 5))];
    }
  }
}

// valor maximo de cualquier paso segun el tamano de los numeros
const TOPE_VALOR: Record<TamanoNumeros, number> = { 1: 999, 2: 20000, 3: 100000 };
// numero mas grande que puede aparecer escrito en el enunciado
const TOPE_NUMERO: Record<TamanoNumeros, number> = { 1: 99, 2: 999, 3: 9999 };

// Vuelve negativos al azar algunos numeros de una expresion (nunca el radicando de una raiz). Las
// divisiones siguen siendo exactas y las raices, de numeros positivos.
function ponerSignos(tokens: Token[]): Token[] {
  const copia: Token[] = tokens.map((k) => ({ ...k }));
  const candidatos = copia.flatMap((k, i) => (k.t === "num" && copia[i - 1]?.t !== "sqrt" ? [i] : []));
  let alguno = false;
  candidatos.forEach((i) => {
    if (Math.random() < 0.4) {
      const k = copia[i] as { t: "num"; v: number };
      k.v = -k.v;
      alguno = true;
    }
  });
  if (!alguno && candidatos.length > 0) {
    const k = copia[candidatos[entre(0, candidatos.length - 1)]] as { t: "num"; v: number };
    k.v = -k.v;
  }
  return copia;
}

export function generarCombinada(
  digito: number,
  tamano: TamanoNumeros = 1,
  conSignos = false
): { tokens: Token[]; respuesta: number } {
  for (let intento = 0; intento < 500; intento++) {
    const base = constructor(digito, tamano);
    const tokens = conSignos ? ponerSignos(base) : base;
    const pasos = pasosResolucion(tokens, conSignos);
    if (!pasos || pasos.length < 2) continue;
    // nada de dividir entre 1
    if (tokens.some((k, i) => k.t === "op" && k.v === "÷" && tokens[i + 1]?.t === "num" && Math.abs((tokens[i + 1] as { v: number }).v) === 1)) continue;
    if (pasos.some((p) => Math.abs(p.reduccion.valor) > TOPE_VALOR[tamano])) continue;
    // los numeros del enunciado respetan el tamano pedido (2 a 3 cifras o 3 a 4 cifras)
    if (tamano > 1 && tokens.some((k) => k.t === "num" && Math.abs(k.v) > TOPE_NUMERO[tamano])) continue;
    const final = resultadoFinal(tokens, conSignos);
    if (final === null || (conSignos ? final === 0 : final < 1)) continue;
    return { tokens, respuesta: final };
  }
  if (conSignos) return { tokens: [N(3), op("+"), N(-4), op("×"), N(5)], respuesta: -17 };
  return { tokens: [N(3), op("+"), N(4), op("×"), N(5)], respuesta: 23 };
}
