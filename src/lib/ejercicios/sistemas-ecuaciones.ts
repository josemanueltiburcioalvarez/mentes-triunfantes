// Sistemas de ecuaciones lineales (2 incognitas), resueltos por eliminacion. Simplificacion
// deliberada para que los pasos sean predecibles: siempre se elimina la "y" sumando las dos
// ecuaciones (la ecuacion 2 siempre tiene el termino de y negativo, y si hace falta se multiplica
// la ecuacion 1 por un factor para igualar ese coeficiente) — igual que division siempre exacta o
// resta sin resultado negativo en los niveles basicos.

export interface OpcionSistema {
  id: string;
  etiqueta: string;
}

export type TipoPasoSistema = "igualar" | "eliminar" | "resolver" | "sustituir" | "dividir";

export interface PasoSistema {
  tipo: TipoPasoSistema;
  opciones?: OpcionSistema[];
  correcta?: string;
  pista: string;
  pregunta: string; // cuenta que el estudiante debe hacer
  respuesta: number;
  resultado: string; // como queda el sistema despues de este paso
}

export interface SistemaEcuaciones {
  texto1: string;
  texto2: string;
  solucionX: number;
  solucionY: number;
  pasos: PasoSistema[];
  comprobacion: {
    expresion: string; // ecuacion 2 original con x e y ya sustituidos, lista para calcular
    valorEsperado: number;
  };
}

const entre = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
// numero suelto (con signo tipografico)
const num = (v: number) => (v < 0 ? `−${-v}` : String(v));
// numero dentro de una cuenta: los negativos van entre parentesis
const n = (v: number) => (v < 0 ? `(−${-v})` : String(v));

interface RangoSistema {
  a: [number, number];
  b: [number, number];
  k: [number, number];
  xy: [number, number];
  signos: boolean;
}

// b nunca es 1: evita mostrar "1y" (igual que los coeficientes de x en ecuaciones.ts).
const RANGOS: Record<number, RangoSistema> = {
  1: { a: [2, 9], b: [2, 4], k: [1, 1], xy: [1, 9], signos: false },
  2: { a: [2, 9], b: [2, 4], k: [2, 3], xy: [1, 12], signos: false },
  3: { a: [2, 9], b: [2, 5], k: [2, 4], xy: [1, 15], signos: false },
  4: { a: [2, 9], b: [2, 4], k: [2, 3], xy: [2, 12], signos: true },
  5: { a: [2, 9], b: [2, 6], k: [2, 4], xy: [2, 15], signos: true },
};

export function generarSistema(digito: number): SistemaEcuaciones {
  const r = RANGOS[digito] ?? RANGOS[5];

  let x = entre(r.xy[0], r.xy[1]);
  let y = entre(r.xy[0], r.xy[1]);
  if (r.signos) {
    if (Math.random() < 0.5) x = -x;
    if (Math.random() < 0.5) y = -y;
  }
  const a1 = entre(r.a[0], r.a[1]);
  const a2 = entre(r.a[0], r.a[1]);
  const b1 = entre(r.b[0], r.b[1]);
  const k = entre(r.k[0], r.k[1]);
  const b2 = -(b1 * k); // asi, al multiplicar la ecuacion 1 por k, los coeficientes de y quedan opuestos
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  const A = a1 * k + a2;

  const texto1 = `${a1}x + ${b1}y = ${num(c1)}`;
  const texto2 = `${a2}x − ${Math.abs(b2)}y = ${num(c2)}`;

  const pasos: PasoSistema[] = [];
  let c1Final = c1;

  if (k > 1) {
    const otroFactor = k === 2 ? 3 : 2;
    pasos.push({
      tipo: "igualar",
      opciones: [
        { id: `1:${k}`, etiqueta: `Multiplicar la ecuación 1 por ${k}` },
        { id: `2:${k}`, etiqueta: `Multiplicar la ecuación 2 por ${k}` },
        { id: `1:${otroFactor}`, etiqueta: `Multiplicar la ecuación 1 por ${otroFactor}` },
      ],
      correcta: `1:${k}`,
      pista: `Para que la y se cancele al sumar, su coeficiente debe quedar igual en valor absoluto en las dos ecuaciones: ${b1} × ${k} = ${Math.abs(b2)}.`,
      pregunta: `${n(c1)} × ${k} =`,
      respuesta: c1 * k,
      resultado: `${a1 * k}x + ${b1 * k}y = ${num(c1 * k)}`,
    });
    c1Final = c1 * k;
  }

  const C = c1Final + c2;
  pasos.push({
    tipo: "eliminar",
    pista: "Los coeficientes de la y ya son opuestos: al sumar las dos ecuaciones, la y se cancela.",
    pregunta: `${n(c1Final)} ${c2 >= 0 ? "+" : "−"} ${Math.abs(c2)} =`,
    respuesta: C,
    resultado: `${A}x = ${num(C)}`,
  });

  pasos.push({
    tipo: "resolver",
    pista: `El ${A} está multiplicando a la x: la operación contraria es dividir.`,
    pregunta: `${n(C)} ÷ ${A} =`,
    respuesta: x,
    resultado: `x = ${num(x)}`,
  });

  const restoY = c1 - a1 * x;
  pasos.push({
    tipo: "sustituir",
    pista: `Sustituye x = ${num(x)} en la ecuación 1 (la original, sin multiplicar) y despeja lo que falta.`,
    pregunta: `${n(c1)} − ${a1} × ${n(x)} =`,
    respuesta: restoY,
    resultado: `${b1}y = ${num(restoY)}`,
  });

  pasos.push({
    tipo: "dividir",
    pista: `El ${b1} está multiplicando a la y: la operación contraria es dividir.`,
    pregunta: `${n(restoY)} ÷ ${b1} =`,
    respuesta: y,
    resultado: `y = ${num(y)}`,
  });

  return {
    texto1,
    texto2,
    solucionX: x,
    solucionY: y,
    pasos,
    comprobacion: {
      expresion: `${a2} × ${n(x)} − ${Math.abs(b2)} × ${n(y)} =`,
      valorEsperado: c2,
    },
  };
}

export const DESCRIPCIONES_SISTEMAS = [
  "",
  "Coeficientes de y ya opuestos: solo sumar",
  "Multiplicar una ecuación por 2 o 3",
  "Multiplicar por un factor más grande",
  "Con soluciones negativas",
  "Números más grandes y con signos",
];
