// Problemas de razonamiento: enunciados de la vida real armados con plantillas al azar.
function entre(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function elegir<T>(lista: T[]): T {
  return lista[entre(0, lista.length - 1)];
}

const NOMBRES = [
  "Ana", "Luis", "Marta", "Carlos", "Sofía", "Diego", "Valeria",
  "Miguel", "Camila", "Andrés", "Lucía", "Pedro", "Rosa", "Jorge",
];
// cada objeto lleva su "Cuántos"/"Cuántas" para no romper la concordancia de género
const OBJETOS: { plural: string; cuantos: string }[] = [
  { plural: "lápices", cuantos: "Cuántos" },
  { plural: "cuadernos", cuantos: "Cuántos" },
  { plural: "canicas", cuantos: "Cuántas" },
  { plural: "stickers", cuantos: "Cuántos" },
  { plural: "monedas", cuantos: "Cuántas" },
  { plural: "tarjetas", cuantos: "Cuántas" },
  { plural: "globos", cuantos: "Cuántos" },
  { plural: "caramelos", cuantos: "Cuántos" },
  { plural: "libros", cuantos: "Cuántos" },
  { plural: "lapiceros", cuantos: "Cuántos" },
];

export const DESCRIPCIONES_RAZONAMIENTO: string[] = [
  "",
  "Problemas de un paso: suma y resta",
  "Problemas de un paso: multiplicación y división",
  "Problemas de dos pasos",
  "Problemas con números con signo",
  "Problemas con ecuaciones",
];

export interface Problema {
  enunciado: string;
  respuesta: number;
}

function problemaDigito1(): Problema {
  const nombre = elegir(NOMBRES);
  const { plural, cuantos } = elegir(OBJETOS);
  if (Math.random() < 0.5) {
    const a = entre(15, 90);
    const b = entre(10, 80);
    return {
      enunciado: `${nombre} tiene ${a} ${plural} y compra ${b} más. ¿${cuantos} ${plural} tiene ahora?`,
      respuesta: a + b,
    };
  }
  const a = entre(30, 99);
  const b = entre(10, a - 5);
  return {
    enunciado: `${nombre} tenía ${a} ${plural} y regaló ${b}. ¿${cuantos} ${plural} le quedan?`,
    respuesta: a - b,
  };
}

function problemaDigito2(): Problema {
  const nombre = elegir(NOMBRES);
  const { plural, cuantos } = elegir(OBJETOS);
  if (Math.random() < 0.5) {
    const filas = entre(4, 12);
    const columnas = entre(2, 9);
    return {
      enunciado: `Un autobús tiene ${filas} filas de ${columnas} asientos cada una. ¿Cuántos asientos tiene en total?`,
      respuesta: filas * columnas,
    };
  }
  const grupos = entre(2, 9);
  const cociente = entre(3, 20);
  const total = grupos * cociente;
  return {
    enunciado: `${nombre} repartió ${total} ${plural} en partes iguales entre ${grupos} amigos. ¿${cuantos} ${plural} recibió cada uno?`,
    respuesta: cociente,
  };
}

function problemaDigito3(): Problema {
  const nombre = elegir(NOMBRES);
  const { plural, cuantos } = elegir(OBJETOS);
  if (Math.random() < 0.5) {
    const n = entre(2, 6);
    const precio = entre(3, 15);
    const costo = n * precio;
    const billete = costo <= 20 ? 20 : costo <= 50 ? 50 : 100;
    return {
      enunciado: `Compraste ${n} ${plural} a ${precio} soles cada uno y pagaste con un billete de ${billete} soles. ¿Cuánto te devolvieron?`,
      respuesta: billete - costo,
    };
  }
  const a = entre(10, 40);
  const n = entre(2, 5);
  const porPaquete = entre(3, 10);
  const interim = a + n * porPaquete;
  const b = entre(5, Math.min(20, interim));
  return {
    enunciado: `${nombre} tenía ${a} ${plural}. Compró ${n} paquetes de ${porPaquete} ${plural} cada uno y luego regaló ${b}. ¿${cuantos} ${plural} tiene ahora?`,
    respuesta: interim - b,
  };
}

function problemaDigito4(): Problema {
  if (Math.random() < 0.5) {
    const t1 = entre(-5, 15);
    const delta = entre(3, 20);
    return {
      enunciado: `La temperatura era de ${t1} °C en la mañana y bajó ${delta} °C durante la noche. ¿Cuál fue la temperatura final?`,
      respuesta: t1 - delta,
    };
  }
  const ganancia = entre(50, 400);
  const perdida = entre(50, 400);
  return {
    enunciado: `Una tienda tuvo una ganancia de ${ganancia} soles el lunes y una pérdida de ${perdida} soles el martes. ¿Cuál fue el resultado de los dos días? (usa el signo si es pérdida)`,
    respuesta: ganancia - perdida,
  };
}

function problemaDigito5(): Problema {
  const variante = entre(0, 2);
  if (variante === 0) {
    const b = entre(5, 40);
    const a = entre(2, 3 * b - 1);
    return {
      enunciado: `Un número aumentado en ${a} es igual al triple de ${b}. ¿Cuál es el número?`,
      respuesta: 3 * b - a,
    };
  }
  if (variante === 1) {
    const x = entre(10, 90);
    const suma = 2 * x + 1;
    return {
      enunciado: `La suma de dos números consecutivos es ${suma}. ¿Cuál es el menor de los dos?`,
      respuesta: x,
    };
  }
  const x = entre(5, 60);
  const a = entre(2, Math.min(30, 2 * x - 1));
  return {
    enunciado: `El doble de un número, menos ${a}, es igual a ${2 * x - a}. ¿Cuál es el número?`,
    respuesta: x,
  };
}

export function generarRazonamiento(digito: number): Problema {
  switch (digito) {
    case 1:
      return problemaDigito1();
    case 2:
      return problemaDigito2();
    case 3:
      return problemaDigito3();
    case 4:
      return problemaDigito4();
    default:
      return problemaDigito5();
  }
}
