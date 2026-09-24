// Ecuaciones lineales de una incognita, resueltas por transposicion (operaciones inversas).
// Cada ecuacion se genera junto con su camino de resolucion para validar cada paso del estudiante.

export interface OpcionEcuacion {
  id: string;
  etiqueta: string;
}

export interface PasoEcuacion {
  opciones: OpcionEcuacion[];
  correcta: string;
  pista: string; // por que la opcion elegida no era la que tocaba
  pregunta: string; // cuenta que el estudiante debe hacer, ej. "20 − 5 ="
  respuesta: number;
  resultado: string; // ecuacion despues del paso
}

export interface Ecuacion {
  texto: string;
  solucion: number;
  pasos: PasoEcuacion[];
  comprobacion: {
    izquierda: string;
    valorIzquierda: number;
    derecha: string | null; // solo si el lado derecho tambien tiene x
    valorDerecha: number;
  };
}

const entre = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
// numero para usar dentro de una cuenta: los negativos van entre parentesis
const n = (v: number) => (v < 0 ? `(−${-v})` : String(v));
// numero suelto en una ecuacion
const num = (v: number) => (v < 0 ? `−${-v}` : String(v));
const masMenos = (v: number) => (v >= 0 ? `+ ${v}` : `− ${-v}`);

type Accion = "restar" | "sumar" | "dividir" | "multiplicar";
const ETIQUETA: Record<Accion, (c: string) => string> = {
  restar: (c) => `Restar ${c} a los dos lados`,
  sumar: (c) => `Sumar ${c} a los dos lados`,
  dividir: (c) => `Dividir los dos lados entre ${c}`,
  multiplicar: (c) => `Multiplicar los dos lados por ${c}`,
};
const CONTRARIA: Record<Accion, Accion> = { restar: "sumar", sumar: "restar", dividir: "multiplicar", multiplicar: "dividir" };

interface EspecificacionPaso {
  accion: Accion;
  cantidad: string; // lo que se resta/suma/divide/multiplica (texto: "5", "2x"...)
  tercera: { accion: Accion; cantidad: string }; // distractor de otro tipo
  pista: string;
  pregunta: string;
  respuesta: number;
  resultado: string;
}

function paso(e: EspecificacionPaso): PasoEcuacion {
  const id = (a: Accion, c: string) => `${a}:${c}`;
  return {
    opciones: [
      { id: id(e.accion, e.cantidad), etiqueta: ETIQUETA[e.accion](e.cantidad) },
      { id: id(CONTRARIA[e.accion], e.cantidad), etiqueta: ETIQUETA[CONTRARIA[e.accion]](e.cantidad) },
      { id: id(e.tercera.accion, e.tercera.cantidad), etiqueta: ETIQUETA[e.tercera.accion](e.tercera.cantidad) },
    ],
    correcta: id(e.accion, e.cantidad),
    pista: e.pista,
    pregunta: e.pregunta,
    respuesta: e.respuesta,
    resultado: e.resultado,
  };
}

const PISTA_SUMA_RESTA = (c: number | string) =>
  `El ${c} está sumando o restando: para dejar la x sola se hace la operación contraria.`;
const PISTA_ORDEN =
  "Para despejar la x se deshace primero lo que suma o resta y después lo que multiplica o divide (al revés del orden de las operaciones).";

// x + b = d
function f1a(): Ecuacion {
  const x = entre(1, 12);
  const b = entre(1, 20);
  const d = x + b;
  return {
    texto: `x + ${b} = ${d}`,
    solucion: x,
    pasos: [
      paso({
        accion: "restar",
        cantidad: String(b),
        tercera: { accion: "dividir", cantidad: String(b) },
        pista: PISTA_SUMA_RESTA(b),
        pregunta: `${d} − ${b} =`,
        respuesta: x,
        resultado: `x = ${x}`,
      }),
    ],
    comprobacion: { izquierda: `${x} + ${b} =`, valorIzquierda: d, derecha: null, valorDerecha: d },
  };
}

// x − b = d
function f1b(): Ecuacion {
  const x = entre(2, 20);
  const b = entre(1, x - 1);
  const d = x - b;
  return {
    texto: `x − ${b} = ${d}`,
    solucion: x,
    pasos: [
      paso({
        accion: "sumar",
        cantidad: String(b),
        tercera: { accion: "multiplicar", cantidad: String(b) },
        pista: PISTA_SUMA_RESTA(b),
        pregunta: `${d} + ${b} =`,
        respuesta: x,
        resultado: `x = ${x}`,
      }),
    ],
    comprobacion: { izquierda: `${x} − ${b} =`, valorIzquierda: d, derecha: null, valorDerecha: d },
  };
}

// a x = d
function f2a(): Ecuacion {
  const a = entre(2, 9);
  const x = entre(1, 12);
  const d = a * x;
  return {
    texto: `${a}x = ${d}`,
    solucion: x,
    pasos: [
      paso({
        accion: "dividir",
        cantidad: String(a),
        tercera: { accion: "restar", cantidad: String(a) },
        pista: `El ${a} está multiplicando a la x: la operación contraria es dividir.`,
        pregunta: `${d} ÷ ${a} =`,
        respuesta: x,
        resultado: `x = ${x}`,
      }),
    ],
    comprobacion: { izquierda: `${a} × ${x} =`, valorIzquierda: d, derecha: null, valorDerecha: d },
  };
}

// x/a = d
function f2b(): Ecuacion {
  const a = entre(2, 9);
  const d = entre(1, 12);
  const x = a * d;
  return {
    texto: `x/${a} = ${d}`,
    solucion: x,
    pasos: [
      paso({
        accion: "multiplicar",
        cantidad: String(a),
        tercera: { accion: "sumar", cantidad: String(a) },
        pista: `La x está dividida entre ${a}: la operación contraria es multiplicar.`,
        pregunta: `${d} × ${a} =`,
        respuesta: x,
        resultado: `x = ${x}`,
      }),
    ],
    comprobacion: { izquierda: `${x} ÷ ${a} =`, valorIzquierda: d, derecha: null, valorDerecha: d },
  };
}

// a x + b = d   /   a x − b = d
function f3(resta: boolean): Ecuacion {
  const a = entre(2, 9);
  const x = entre(1, 12);
  const b = resta ? entre(1, Math.min(20, a * x - 1)) : entre(1, 20);
  const d = resta ? a * x - b : a * x + b;
  const medio = resta ? d + b : d - b; // = a x
  return {
    texto: `${a}x ${resta ? "−" : "+"} ${b} = ${d}`,
    solucion: x,
    pasos: [
      paso({
        accion: resta ? "sumar" : "restar",
        cantidad: String(b),
        tercera: { accion: "dividir", cantidad: String(a) },
        pista: PISTA_ORDEN,
        pregunta: `${d} ${resta ? "+" : "−"} ${b} =`,
        respuesta: medio,
        resultado: `${a}x = ${medio}`,
      }),
      paso({
        accion: "dividir",
        cantidad: String(a),
        tercera: { accion: "restar", cantidad: String(a) },
        pista: `El ${a} está multiplicando a la x: la operación contraria es dividir.`,
        pregunta: `${medio} ÷ ${a} =`,
        respuesta: x,
        resultado: `x = ${x}`,
      }),
    ],
    comprobacion: {
      izquierda: `${a} × ${x} ${resta ? "−" : "+"} ${b} =`,
      valorIzquierda: d,
      derecha: null,
      valorDerecha: d,
    },
  };
}

// a (x + b) = d
function f4a(): Ecuacion {
  const a = entre(2, 6);
  const x = entre(1, 10);
  const b = entre(1, 9);
  const k = x + b;
  const d = a * k;
  return {
    texto: `${a}(x + ${b}) = ${d}`,
    solucion: x,
    pasos: [
      paso({
        accion: "dividir",
        cantidad: String(a),
        tercera: { accion: "restar", cantidad: String(b) },
        pista: `El ${a} multiplica a todo el paréntesis: se divide primero entre ${a} y así el paréntesis queda solo.`,
        pregunta: `${d} ÷ ${a} =`,
        respuesta: k,
        resultado: `x + ${b} = ${k}`,
      }),
      paso({
        accion: "restar",
        cantidad: String(b),
        tercera: { accion: "dividir", cantidad: String(b) },
        pista: PISTA_SUMA_RESTA(b),
        pregunta: `${k} − ${b} =`,
        respuesta: x,
        resultado: `x = ${x}`,
      }),
    ],
    comprobacion: { izquierda: `${a} × (${x} + ${b}) =`, valorIzquierda: d, derecha: null, valorDerecha: d },
  };
}

// x/a + b = d
function f4b(): Ecuacion {
  const a = entre(2, 6);
  const k = entre(1, 10);
  const b = entre(1, 12);
  const x = a * k;
  const d = k + b;
  return {
    texto: `x/${a} + ${b} = ${d}`,
    solucion: x,
    pasos: [
      paso({
        accion: "restar",
        cantidad: String(b),
        tercera: { accion: "multiplicar", cantidad: String(a) },
        pista: PISTA_ORDEN,
        pregunta: `${d} − ${b} =`,
        respuesta: k,
        resultado: `x/${a} = ${k}`,
      }),
      paso({
        accion: "multiplicar",
        cantidad: String(a),
        tercera: { accion: "sumar", cantidad: String(a) },
        pista: `La x está dividida entre ${a}: la operación contraria es multiplicar.`,
        pregunta: `${k} × ${a} =`,
        respuesta: x,
        resultado: `x = ${x}`,
      }),
    ],
    comprobacion: { izquierda: `${x} ÷ ${a} + ${b} =`, valorIzquierda: d, derecha: null, valorDerecha: d },
  };
}

// a x + b = c x + d   (x puede salir negativa)
function f5(): Ecuacion {
  for (;;) {
    const a = entre(3, 9);
    const c = entre(1, a - 2); // coef = a - c >= 2 (evita "1x")
    const x = (Math.random() < 0.25 ? -1 : 1) * entre(1, 9);
    const b = (Math.random() < 0.5 ? -1 : 1) * entre(1, 12);
    const coef = a - c;
    const d = coef * x + b;
    if (d === 0 || Math.abs(d) > 60) continue;

    const dMenosB = d - b; // = coef x
    return {
      texto: `${a}x ${masMenos(b)} = ${c}x ${masMenos(d)}`,
      solucion: x,
      pasos: [
        paso({
          accion: "restar",
          cantidad: `${c}x`,
          tercera: { accion: "dividir", cantidad: String(a) },
          pista: "Primero se juntan las x en un solo lado: se resta la x más pequeña (la de menor coeficiente) a los dos lados.",
          pregunta: `${a} − ${c} =`,
          respuesta: coef,
          resultado: `${coef}x ${masMenos(b)} = ${num(d)}`,
        }),
        paso({
          accion: b > 0 ? "restar" : "sumar",
          cantidad: String(Math.abs(b)),
          tercera: { accion: "dividir", cantidad: String(coef) },
          pista: PISTA_ORDEN,
          pregunta: `${n(d)} ${b > 0 ? "−" : "+"} ${Math.abs(b)} =`,
          respuesta: dMenosB,
          resultado: `${coef}x = ${num(dMenosB)}`,
        }),
        paso({
          accion: "dividir",
          cantidad: String(coef),
          tercera: { accion: "restar", cantidad: String(coef) },
          pista: `El ${coef} está multiplicando a la x: la operación contraria es dividir.`,
          pregunta: `${n(dMenosB)} ÷ ${coef} =`,
          respuesta: x,
          resultado: `x = ${num(x)}`,
        }),
      ],
      comprobacion: {
        izquierda: `${a} × ${n(x)} ${b >= 0 ? "+" : "−"} ${Math.abs(b)} =`,
        valorIzquierda: a * x + b,
        derecha: `${c} × ${n(x)} ${d >= 0 ? "+" : "−"} ${Math.abs(d)} =`,
        valorDerecha: c * x + d,
      },
    };
  }
}

export function generarEcuacion(digito: number): Ecuacion {
  const cara = Math.random() < 0.5;
  switch (digito) {
    case 1:
      return cara ? f1a() : f1b();
    case 2:
      return cara ? f2a() : f2b();
    case 3:
      return f3(!cara);
    case 4:
      return cara ? f4a() : f4b();
    default:
      return f5();
  }
}

export const DESCRIPCIONES_ECUACIONES = [
  "",
  "Una suma o una resta: x + 7 = 15",
  "Una multiplicación o división: 4x = 20",
  "Dos pasos: 3x + 5 = 20",
  "Con paréntesis o fracción: 2(x + 3) = 16",
  "x en los dos lados: 5x + 4 = 2x + 19",
];
