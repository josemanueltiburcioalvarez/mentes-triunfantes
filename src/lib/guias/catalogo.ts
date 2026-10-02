import type { HabilidadPracticable } from "../ejercicios/generador";
import { guiaMultiplicacion1, guiaMultiplicacion2, guiaResta, guiaSuma } from "./columnas";
import { guiaDivision } from "./division";
import { guiaCombinada, guiaCuadradoDosCifras, guiaPotencia, guiaRaizGrande, guiaRaizIntro, guiaRaizSuperior } from "./lineas";
import {
  guiaDividirGrandesSignos,
  guiaEcuacionAmbosLados,
  guiaEcuacionDosPasos,
  guiaEcuacionIntro,
  guiaMultiplicarGrandesSignos,
  guiaPotenciaParentesis,
  guiaPotenciaParImpar,
  guiaRaizExiste,
  guiaRaizMenosAfuera,
  guiaReglaSignosDividir,
  guiaReglaSignosMultiplicar,
  guiaRestasSeguidas,
  guiaRestaSignosOpuesto,
  guiaSistemaDirecto,
  guiaSistemaIgualar,
  guiaSumaSignosDiferentes,
  guiaSumaSignosIguales,
} from "./enteros";
import type { Token } from "../ejercicios/combinadas";
import type { Guia } from "./tipos";

const n = (v: number): Token => ({ t: "num", v });
const o = (v: "+" | "−" | "×" | "÷"): Token => ({ t: "op", v });
const LP: Token = { t: "lp" };
const RP: Token = { t: "rp" };
const pow = (e: number): Token => ({ t: "pow", e });

const GUIA_TABLA: Guia = {
  tipo: "consejos",
  numero: 1,
  titulo: "Trucos para aprender las tablas",
  resumen: "No hace falta memorizar todo de golpe: con estos trucos te sabes casi todas las tablas.",
  secciones: [
    {
      titulo: "Multiplicar es sumar varias veces",
      texto: "4 × 3 quiere decir: el 3 repetido 4 veces. Si te olvidas un resultado, puedes sumar para encontrarlo.",
      ejemplo: "4 × 3 = 3 + 3 + 3 + 3 = 12",
    },
    {
      titulo: "El orden no importa",
      texto: "Cambiar el orden no cambia el resultado. Aprendes una y ya te sabes la otra: la tabla se reduce casi a la mitad.",
      ejemplo: "3 × 7 = 7 × 3 = 21",
    },
    {
      titulo: "La tabla del 2: el doble",
      texto: "Multiplicar por 2 es sumar el número consigo mismo.",
      ejemplo: "2 × 7 = 7 + 7 = 14",
    },
    {
      titulo: "La tabla del 10: agrega un cero",
      texto: "Al multiplicar por 10, el número se queda igual y le pones un 0 al final.",
      ejemplo: "10 × 6 = 60",
    },
    {
      titulo: "La tabla del 5: la mitad de la del 10",
      texto: "Calcula la del 10 y saca la mitad. Los resultados de la tabla del 5 siempre terminan en 0 o en 5.",
      ejemplo: "5 × 6 = mitad de 60 = 30",
    },
    {
      titulo: "La tabla del 4: el doble del doble",
      texto: "Duplica el número dos veces.",
      ejemplo: "4 × 7 → el doble de 7 es 14 → el doble de 14 es 28",
    },
    {
      titulo: "La tabla del 9 con los dedos",
      texto:
        "Abre tus 10 dedos y baja el dedo que quieres multiplicar por 9. Los dedos de la izquierda son las decenas y los de " +
        "la derecha son las unidades. Además, las cifras del resultado siempre suman 9.",
      ejemplo: "9 × 4: bajo el 4.º dedo → quedan 3 a la izquierda y 6 a la derecha → 36 (3 + 6 = 9)",
    },
    {
      titulo: "Tablas del 6, 7 y 8: apóyate en la del 5",
      texto: "Si ya sabes la tabla del 5, súmale una vez más el número para pasar a la del 6.",
      ejemplo: "6 × 7 = (5 × 7) + 7 = 35 + 7 = 42",
    },
    {
      titulo: "Tablas del 11 y del 12",
      texto:
        "Del 11 (hasta el 9) solo repites la cifra. Del 12, multiplica por 10 y suma dos veces el número.",
      ejemplo: "11 × 4 = 44   ·   12 × 6 = 60 + 12 = 72",
    },
  ],
};

const GUIA_ATAJOS: Guia = {
  tipo: "consejos",
  numero: 1,
  titulo: "Trucos para multiplicar más rápido",
  resumen: "Un atajo distinto por cada dígito: multiplicar por 10/100/1000, por 5/25/50, por 11, cuadrados terminados en 5 y números cercanos a 100.",
  secciones: [
    {
      titulo: "Multiplicar por 10, 100 y 1000",
      texto: "Al número le agregas tantos ceros como tenga el 10, el 100 o el 1000.",
      ejemplo: "47 × 100 = 4700",
    },
    {
      titulo: "Multiplicar por 5, 25 y 50",
      texto: "5 es la mitad de 10; 25 es la cuarta parte de 100; 50 es la mitad de 100. Multiplica por el número redondo y saca la parte.",
      ejemplo: "48 × 5 = (48 × 10) ÷ 2 = 480 ÷ 2 = 240",
    },
    {
      titulo: "Multiplicar por 11",
      texto: "En un número de dos cifras, suma las dos cifras y ponla en el medio (si la suma pasa de 9, esa llevada sube a la cifra de la izquierda).",
      ejemplo: "43 × 11: 4 + 3 = 7 → 473",
    },
    {
      titulo: "Cuadrado de un número terminado en 5",
      texto: "Multiplica la decena por la decena siguiente y agrégale 25 al final.",
      ejemplo: "35² : 3 × 4 = 12 → 1225",
    },
    {
      titulo: "Números cercanos a 100",
      texto: "Para multiplicar dos números cercanos a 100, o para (a + b) × (a − b), calcula a² − b² en vez de multiplicar todo.",
      ejemplo: "98 × 97 ≈ usa que están cerca de 100; (23 + 3) × (23 − 3) = 23² − 3² = 529 − 9 = 520",
    },
  ],
};

const GUIA_RAZONAMIENTO: Guia = {
  tipo: "consejos",
  numero: 1,
  titulo: "Cómo resolver un problema paso a paso",
  resumen: "El truco no está en la cuenta, sino en entender qué pide el problema antes de calcular.",
  secciones: [
    {
      titulo: "1. Lee con calma",
      texto: "Lee el problema completo antes de calcular nada. Vuelve a leerlo si algo no queda claro.",
    },
    {
      titulo: "2. Identifica los datos y la pregunta",
      texto: "Anota (aunque sea mentalmente) los números que te dan y qué es exactamente lo que te preguntan al final.",
    },
    {
      titulo: "3. Elige la operación",
      texto: "¿Estás juntando cantidades (suma), quitando (resta), repitiendo grupos (multiplicación) o repartiendo en partes iguales (división)? Algunos problemas necesitan más de un paso.",
      ejemplo: "Compraste 3 cuadernos a 12 soles y pagaste con 50: primero multiplicas (3 × 12 = 36) y luego restas (50 − 36 = 14)",
    },
    {
      titulo: "4. Comprueba tu respuesta",
      texto: "Vuelve a leer la pregunta y revisa que tu número tenga sentido con la situación (por ejemplo, que no sea más grande de lo que empezó si regalaron algo).",
    },
  ],
};

export function guiasDe(habilidad: HabilidadPracticable): Guia[] {
  switch (habilidad) {
    case "suma":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "Sumar en columnas",
          resumen: "Cómo sumar dos números y qué hacer cuando una columna pasa de 9 (la llevada).",
          pasos: guiaSuma(47, 38),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Sumas largas con varias llevadas",
          resumen: "El mismo método con números más grandes, con llevadas seguidas en varias columnas.",
          pasos: guiaSuma(3458, 2976),
        },
      ];
    case "resta":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "Restar pidiendo prestado",
          resumen: "Qué hacer cuando la cifra de arriba es menor que la de abajo: cambiar 1 decena por 10 unidades.",
          pasos: guiaResta(52, 27),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Restar cuando hay ceros",
          resumen: "Cuando la columna de la que quieres pedir prestado es 0, el préstamo viaja más lejos.",
          pasos: guiaResta(403, 168),
        },
      ];
    case "tabla_multiplicacion":
      return [GUIA_TABLA];
    case "multiplicacion":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "Multiplicar por una cifra",
          resumen: "Multiplicar cada cifra de derecha a izquierda y manejar las llevadas.",
          pasos: guiaMultiplicacion1(47, 6),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Multiplicar por dos cifras",
          resumen: "Dos productos parciales (unidades y decenas), el corrimiento y la suma final.",
          pasos: guiaMultiplicacion2(47, 23),
        },
      ];
    case "division":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "Dividir por una cifra",
          resumen: "Los 4 pasos de la división: dividir, multiplicar, restar y bajar.",
          pasos: guiaDivision(156, 3),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Dividir por dos cifras",
          resumen: "Cómo saber cuántas veces cabe un divisor de dos cifras sin adivinar.",
          pasos: guiaDivision(756, 21),
        },
      ];
    case "potencia":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "Qué es una potencia",
          resumen: "Una potencia es una multiplicación abreviada: base, exponente y cómo resolverla de dos en dos.",
          pasos: guiaPotencia(7, 3),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Cuadrados de dos cifras",
          resumen: "Elevar al cuadrado un número de dos cifras con la multiplicación por dos cifras.",
          pasos: guiaCuadradoDosCifras(23),
        },
      ];
    case "raiz":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "La raíz cuadrada",
          resumen: "La raíz es la operación contraria a la potencia: se busca por tanteo y se comprueba.",
          pasos: guiaRaizIntro(8),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Raíces grandes: acércate y comprueba",
          resumen: "Cómo encontrar la raíz de un número grande usando las decenas y la última cifra.",
          pasos: guiaRaizGrande(36),
        },
        {
          tipo: "pasos",
          numero: 3,
          titulo: "Raíz cúbica, cuarta y quinta",
          resumen: "El índice dice cuántas veces se multiplica el resultado por sí mismo.",
          pasos: guiaRaizSuperior(),
        },
      ];
    case "combinadas_enteros":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "El orden y los signos",
          resumen: "Multiplicar antes de sumar, cuidando el signo de cada resultado.",
          pasos: guiaCombinada([n(5), o("+"), n(-3), o("×"), n(4)], true),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Con paréntesis y potencias de negativos",
          resumen: "Paréntesis primero, luego potencias; una base negativa con exponente par da positivo.",
          pasos: guiaCombinada([LP, n(-4), o("+"), n(1), RP, pow(2), o("−"), n(6), o("×"), n(-2)], true),
        },
      ];
    case "atajos":
      return [GUIA_ATAJOS];
    case "razonamiento":
      return [GUIA_RAZONAMIENTO];
    case "operaciones_combinadas":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "El orden de las operaciones",
          resumen: "Por qué la multiplicación va antes que la suma y cómo se resuelve una cuenta paso a paso.",
          pasos: guiaCombinada([n(3), o("+"), n(4), o("×"), n(5)]),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Con paréntesis y potencias",
          resumen: "Paréntesis primero, luego potencias, luego multiplicar y dividir, y al final sumar.",
          pasos: guiaCombinada([LP, n(8), o("−"), n(3), RP, o("×"), n(2), pow(2), o("+"), n(6), o("÷"), n(3)]),
        },
      ];
    case "suma_enteros":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "Signos iguales",
          resumen: "Sumar dos números con el mismo signo: se suman y se deja el signo.",
          pasos: guiaSumaSignosIguales(),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Signos diferentes",
          resumen: "Sumar un positivo y un negativo: se restan y gana el signo del mayor.",
          pasos: guiaSumaSignosDiferentes(),
        },
      ];
    case "resta_enteros":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "Restar es sumar el opuesto",
          resumen: "Cambiar el − por + y cambiar el signo del segundo número.",
          pasos: guiaRestaSignosOpuesto(),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Varias restas seguidas",
          resumen: "Resolver de izquierda a derecha, de dos en dos.",
          pasos: guiaRestasSeguidas(),
        },
      ];
    case "multiplicacion_enteros":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "La regla de los signos",
          resumen: "Iguales dan positivo; diferentes dan negativo.",
          pasos: guiaReglaSignosMultiplicar(),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Números grandes con signo",
          resumen: "Primero el signo, luego la multiplicación en vertical.",
          pasos: guiaMultiplicarGrandesSignos(),
        },
      ];
    case "division_enteros":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "La regla de los signos al dividir",
          resumen: "La misma regla que en la multiplicación.",
          pasos: guiaReglaSignosDividir(),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Divisiones largas con signo",
          resumen: "Primero el signo, luego la división en vertical.",
          pasos: guiaDividirGrandesSignos(),
        },
      ];
    case "potencia_enteros":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "Base negativa: exponente par o impar",
          resumen: "Cuándo el resultado es positivo y cuándo negativo.",
          pasos: guiaPotenciaParImpar(),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "El paréntesis: (−3)² y −3²",
          resumen: "El signo dentro y fuera del paréntesis cambia el resultado.",
          pasos: guiaPotenciaParentesis(),
        },
      ];
    case "raiz_enteros":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "¿Existe la raíz?",
          resumen: "La raíz cuadrada de un negativo no existe; la cúbica sí.",
          pasos: guiaRaizExiste(),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "El menos de afuera",
          resumen: "Primero la raíz y después el signo de afuera.",
          pasos: guiaRaizMenosAfuera(),
        },
      ];
    case "ecuaciones":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "Qué es una ecuación",
          resumen: "Dejar la x sola con la operación contraria.",
          pasos: guiaEcuacionIntro(),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Ecuaciones de dos pasos",
          resumen: "Primero lo que suma o resta, luego lo que multiplica o divide.",
          pasos: guiaEcuacionDosPasos(),
        },
        {
          tipo: "pasos",
          numero: 3,
          titulo: "La x en los dos lados",
          resumen: "Juntar las x y resolver, incluso con soluciones negativas.",
          pasos: guiaEcuacionAmbosLados(),
        },
      ];
    case "sistemas_ecuaciones":
      return [
        {
          tipo: "pasos",
          numero: 1,
          titulo: "Eliminar sumando las ecuaciones",
          resumen: "Cuando una letra ya tiene coeficientes opuestos, sumar las dos ecuaciones la cancela.",
          pasos: guiaSistemaDirecto(),
        },
        {
          tipo: "pasos",
          numero: 2,
          titulo: "Cuando hay que igualar primero",
          resumen: "Multiplicar una ecuación completa para que los coeficientes queden opuestos antes de sumar.",
          pasos: guiaSistemaIgualar(),
        },
      ];
  }
}
