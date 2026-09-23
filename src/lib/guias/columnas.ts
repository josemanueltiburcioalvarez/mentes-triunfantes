import type { Celda, EscenaColumnas, FilaEscena, PasoGuia } from "./tipos";

const PLURAL = ["unidades", "decenas", "centenas", "unidades de millar", "decenas de millar", "centenas de millar"];
const SINGULAR = ["unidad", "decena", "centena", "unidad de millar", "decena de millar", "centena de millar"];

const largo = (n: number) => String(n).length;

// columna 0 = la de la derecha (unidades)
function cifra(n: number, columna: number): string {
  const s = String(n);
  const i = s.length - 1 - columna;
  return i >= 0 ? s[i] : "";
}

function redondear(n: number): number {
  const paso = largo(n) <= 2 ? 10 : 10 ** (largo(n) - 2);
  return Math.round(n / paso) * paso;
}

const vacia = (): Celda => ({ t: "" });

// fila de N celdas de izquierda a derecha; la funcion recibe la columna contada desde la derecha
function fila(n: number, porColumna: (c: number) => Celda, extras: Partial<FilaEscena> = {}): FilaEscena {
  return { celdas: Array.from({ length: n }, (_, i) => porColumna(n - 1 - i)), ...extras };
}

// ---------------------------------------------------------------- suma
export function guiaSuma(a: number, b: number): PasoGuia[] {
  const maxLargo = Math.max(largo(a), largo(b));
  const n = maxLargo + 1;
  const marcas: string[] = Array(n).fill("");
  const res: string[] = Array(n).fill("");

  const escena = (foco: number | null, marcaNueva: number | null = null): EscenaColumnas => ({
    tipo: "columnas",
    columnas: n,
    filas: [
      fila(n, (c) => (marcas[c] ? { t: marcas[c], e: c === marcaNueva || c === foco ? "foco" : "marca" } : vacia()), {
        chica: true,
      }),
      fila(n, (c) => ({ t: cifra(a, c), e: c === foco ? "foco" : "normal" })),
      fila(n, (c) => ({ t: cifra(b, c), e: c === foco ? "foco" : "normal" }), { op: "+", linea: true }),
      fila(n, (c) => (res[c] ? { t: res[c], e: c === foco ? "foco" : "resultado" } : vacia())),
    ],
  });

  const pasos: PasoGuia[] = [
    {
      titulo: "Colócalos en columnas",
      texto:
        "Escribe un número debajo del otro: **unidades con unidades, decenas con decenas**, y así con todas. " +
        "Cada columna tiene su color. Siempre empezamos a sumar por la **derecha**, por las unidades.",
      escena: escena(null),
    },
  ];

  let llevada = 0;
  for (let j = 0; j < maxLargo; j++) {
    const da = Number(cifra(a, j) || 0);
    const db = Number(cifra(b, j) || 0);
    const total = da + db + llevada;
    const sube = total >= 10 ? 1 : 0;
    res[j] = String(total % 10);
    if (sube) marcas[j + 1] = "1";

    let texto = `${da} + ${db}${llevada ? ` + ${llevada} (la llevada)` : ""} = **${total}**. `;
    texto += sube
      ? `${total} es 1 ${SINGULAR[j + 1]} y ${total % 10} ${PLURAL[j]}: escribo **${total % 10}** abajo y **llevo 1** ` +
        `arriba de las ${PLURAL[j + 1]}. Ese 1 no es una unidad suelta: vale 1 ${SINGULAR[j + 1]} (10 ${PLURAL[j]}).`
      : `Escribo **${total}** abajo.`;
    if (llevada) texto += " ¡No olvides sumar la llevada!";

    pasos.push({ titulo: `Sumo las ${PLURAL[j]}`, texto, escena: escena(j, sube ? j + 1 : null) });
    llevada = sube;
  }

  if (llevada) {
    res[maxLargo] = "1";
    pasos.push({
      titulo: "Bajo la última llevada",
      texto: "Ya no quedan más columnas para sumar, así que la llevada baja tal cual: escribo **1** delante.",
      escena: escena(maxLargo),
    });
  }

  pasos.push({
    titulo: "Compruebo el resultado",
    texto:
      `El resultado es **${a + b}**. Para comprobar hago la operación contraria: ${a + b} − ${b} = ${a}. ` +
      `Si da el primer número, la suma está bien. También puedes estimar: ${redondear(a)} + ${redondear(b)} = ` +
      `${redondear(a) + redondear(b)}, un número cercano a ${a + b}.`,
    escena: escena(null),
  });
  return pasos;
}

// ---------------------------------------------------------------- resta (prestando)
export function guiaResta(a: number, b: number): PasoGuia[] {
  const n = largo(a);
  const arriba = Array.from({ length: n }, (_, c) => Number(cifra(a, c)));
  const original = [...arriba];
  const nuevo: string[] = Array(n).fill("");
  const res: string[] = Array(n).fill("");

  const escena = (foco: number | null): EscenaColumnas => ({
    tipo: "columnas",
    columnas: n,
    filas: [
      fila(n, (c) => (nuevo[c] ? { t: nuevo[c], e: c === foco ? "foco" : "marca" } : vacia()), { chica: true }),
      fila(n, (c) => ({ t: cifra(a, c), e: nuevo[c] ? "tachado" : c === foco ? "foco" : "normal" })),
      fila(n, (c) => ({ t: cifra(b, c), e: c === foco ? "foco" : "normal" }), { op: "−", linea: true }),
      fila(n, (c) => (res[c] ? { t: res[c], e: c === foco ? "foco" : "resultado" } : vacia())),
    ],
  });

  const pasos: PasoGuia[] = [
    {
      titulo: "Colócalos en columnas",
      texto:
        "Escribe el número **mayor arriba** y el menor debajo, con unidades bajo unidades y decenas bajo decenas. " +
        "Restar es quitar, y también empezamos por la derecha. Si la cifra de arriba es más pequeña que la de abajo, " +
        "no se puede quitar: tendremos que **pedir prestado**.",
      escena: escena(null),
    },
  ];

  for (let j = 0; j < n; j++) {
    const bj = Number(cifra(b, j) || 0);
    const top = arriba[j];

    if (top < bj) {
      let k = j + 1;
      while (k < n && arriba[k] === 0) k++;
      const previo = arriba[k];
      arriba[k] -= 1;
      nuevo[k] = String(arriba[k]);
      for (let m = j + 1; m < k; m++) {
        arriba[m] = 9;
        nuevo[m] = "9";
      }
      arriba[j] = top + 10;
      nuevo[j] = String(arriba[j]);

      const texto =
        k === j + 1
          ? `Arriba hay ${top} ${PLURAL[j]} y abajo hay que quitar ${bj}: no se puede. **Pido prestada 1 ${SINGULAR[j + 1]}** ` +
            `a las ${PLURAL[j + 1]}: el ${previo} baja a **${previo - 1}**. Esa ${SINGULAR[j + 1]} se cambia por ` +
            `**10 ${PLURAL[j]}**, y ${top} + 10 = **${top + 10}**.`
          : `Arriba hay ${top} ${PLURAL[j]} y hay que quitar ${bj}: no se puede. Las ${PLURAL[j + 1]} son 0 y no tienen ` +
            `nada que prestar, así que pedimos a las ${PLURAL[k]}: el ${previo} baja a **${previo - 1}**. ` +
            (k === j + 2
              ? `Esa ${SINGULAR[k]} se cambia por 10 ${PLURAL[k - 1]}: las ${PLURAL[k - 1]} se quedan con **9** y prestan 1 ` +
                `a las ${PLURAL[j]}, que llegan a **${top + 10}**.`
              : `Esa ${SINGULAR[k]} se cambia por 10 ${PLURAL[k - 1]}. Cada columna del medio se queda con **9** y presta 1 ` +
                `a la de su derecha, hasta que las ${PLURAL[j]} llegan a **${top + 10}**.`);
      pasos.push({ titulo: `${top} − ${bj}: no se puede, pido prestado`, texto, escena: escena(j) });
    }

    const dif = arriba[j] - bj;
    res[j] = String(dif);
    const cambio =
      original[j] !== arriba[j] && top >= bj
        ? ` (el ${original[j]} ahora vale ${arriba[j]} porque prestó)`
        : original[j] !== arriba[j]
          ? " (ya con el préstamo)"
          : "";
    pasos.push({
      titulo: `Resto las ${PLURAL[j]}`,
      texto: `${arriba[j]}${cambio} − ${bj} = **${dif}**. Escribo **${dif}** abajo.`,
      escena: escena(j),
    });
  }

  pasos.push({
    titulo: "Compruebo el resultado",
    texto:
      `El resultado es **${a - b}**. Para comprobar hago la operación contraria, una suma: ${a - b} + ${b} = ${a}. ` +
      "Si da el número de arriba, la resta está bien.",
    escena: escena(null),
  });
  return pasos;
}

// ---------------------------------------------------------------- multiplicacion por una cifra
export function guiaMultiplicacion1(a: number, d: number): PasoGuia[] {
  const len = largo(a);
  const n = len + 1;
  const marcas: string[] = Array(n).fill("");
  const res: string[] = Array(n).fill("");

  const escena = (foco: number | null, marcaNueva: number | null = null): EscenaColumnas => ({
    tipo: "columnas",
    columnas: n,
    filas: [
      fila(n, (c) => (marcas[c] ? { t: marcas[c], e: c === marcaNueva || c === foco ? "foco" : "marca" } : vacia()), {
        chica: true,
      }),
      fila(n, (c) => ({ t: cifra(a, c), e: c === foco ? "foco" : "normal" })),
      fila(n, (c) => (c === 0 ? { t: String(d), e: "foco" } : vacia()), { op: "×", linea: true }),
      fila(n, (c) => (res[c] ? { t: res[c], e: c === foco ? "foco" : "resultado" } : vacia())),
    ],
  });

  const pasos: PasoGuia[] = [
    {
      titulo: "Colócalos en columnas",
      texto:
        `Escribe ${a} arriba y el ${d} debajo, alineado con las unidades. Vamos a multiplicar el ${d} por **cada cifra** ` +
        `de ${a}, empezando por la derecha. Si te sabes la tabla del ${d}, será muy fácil.`,
      escena: escena(null),
    },
  ];

  let llevada = 0;
  for (let j = 0; j < len; j++) {
    const da = Number(cifra(a, j));
    const prod = da * d + llevada;
    const sube = Math.floor(prod / 10);
    const ultima = j === len - 1;

    let texto = `${da} × ${d}${llevada ? ` + ${llevada} (la llevada)` : ""} = **${prod}**. `;
    if (ultima) {
      texto += `Como es la última columna, escribo el número completo: **${prod}**.`;
      res[j] = String(prod % 10);
      if (sube) res[j + 1] = String(sube);
    } else if (sube) {
      texto += `Escribo **${prod % 10}** abajo y **llevo ${sube}** arriba de las ${PLURAL[j + 1]}.`;
      res[j] = String(prod % 10);
      marcas[j + 1] = String(sube);
    } else {
      texto += `Escribo **${prod}** abajo.`;
      res[j] = String(prod);
    }
    if (llevada) texto += " ¡No olvides sumar la llevada!";

    pasos.push({
      titulo: `Multiplico las ${PLURAL[j]}`,
      texto,
      escena: escena(j, !ultima && sube ? j + 1 : null),
    });
    llevada = sube;
  }

  pasos.push({
    titulo: "Compruebo el resultado",
    texto:
      `El resultado es **${a * d}**. Para comprobar puedes estimar: ${redondear(a)} × ${d} = ${redondear(a) * d}, ` +
      `que es un número cercano. O hacer la operación contraria: ${a * d} ÷ ${d} = ${a}.`,
    escena: escena(null),
  });
  return pasos;
}

// ---------------------------------------------------------------- multiplicacion por dos cifras
function describirProducto(a: number, d: number): string {
  const len = largo(a);
  const partes: string[] = [];
  let llevada = 0;
  for (let j = 0; j < len; j++) {
    const da = Number(cifra(a, j));
    const prod = da * d + llevada;
    const sube = Math.floor(prod / 10);
    const base = `${da} × ${d}${llevada ? ` + ${llevada}` : ""} = ${prod}`;
    partes.push(j === len - 1 ? `${base} (escribo ${prod})` : sube ? `${base} (escribo ${prod % 10}, llevo ${sube})` : `${base} (escribo ${prod})`);
    llevada = sube;
  }
  return partes.join("; ");
}

export function guiaMultiplicacion2(a: number, b: number): PasoGuia[] {
  const b0 = b % 10;
  const b1 = Math.floor(b / 10);
  const p1 = a * b0;
  const p2 = a * b1;
  const total = a * b;
  const n = largo(a) + 2;

  const p1Texto: string[] = Array(n).fill("");
  const p2Texto: string[] = Array(n).fill("");
  const resTexto: string[] = Array(n).fill("");
  const fijar = (arr: string[], valor: number, corrimiento: number) => {
    String(valor)
      .split("")
      .reverse()
      .forEach((d, i) => {
        arr[i + corrimiento] = d;
      });
  };

  const escena = (focoB: number | null, parciales: boolean[] = [false, false, false]): EscenaColumnas => ({
    tipo: "columnas",
    columnas: n,
    filas: [
      fila(n, (c) => ({ t: cifra(a, c), e: "normal" })),
      fila(n, (c) => (c < 2 ? { t: cifra(b, c), e: c === focoB ? "foco" : "normal" } : vacia()), { op: "×", linea: true }),
      fila(n, (c) => (parciales[0] && p1Texto[c] ? { t: p1Texto[c], e: "resultado" } : vacia())),
      fila(
        n,
        (c) =>
          parciales[1]
            ? c === 0
              ? { t: "0", e: "apagado" }
              : p2Texto[c]
                ? { t: p2Texto[c], e: "resultado" }
                : vacia()
            : vacia(),
        { op: "+", linea: true }
      ),
      fila(n, (c) => (parciales[2] && resTexto[c] ? { t: resTexto[c], e: "resultado" } : vacia())),
    ],
  });

  fijar(p1Texto, p1, 0);
  fijar(p2Texto, p2, 1);
  fijar(resTexto, total, 0);

  return [
    {
      titulo: "Cada cifra vale distinto",
      texto:
        `Escribe ${a} arriba y ${b} debajo, unidades bajo unidades. En ${b}, el ${b0} son **${b0} unidades** y el ${b1} ` +
        `son **${b1} decenas (${b1 * 10})**. Multiplicaremos ${a} por cada parte por separado y al final sumaremos.`,
      escena: escena(null),
    },
    {
      titulo: `Primero por las unidades (${b0})`,
      texto: `${describirProducto(a, b0)}. El primer producto es **${p1}**. Lo escribo en la primera fila, alineado a la derecha.`,
      escena: escena(0, [true, false, false]),
    },
    {
      titulo: `Ahora por las decenas (${b1})`,
      texto:
        `Ojo: ese ${b1} no vale ${b1}, vale **${b1} decenas = ${b1 * 10}**. Por eso el resultado se corre **una casilla a la ` +
        `izquierda**: dejo libre el lugar de las unidades (o escribo un 0). ${describirProducto(a, b1)}. ` +
        `Queda **${p2}** corrido, o sea ${p2 * 10}.`,
      escena: escena(1, [true, true, false]),
    },
    {
      titulo: "Sumo los dos productos",
      texto: `Sumo las dos filas como una suma en columnas: ${p1} + ${p2 * 10} = **${total}**.`,
      escena: escena(null, [true, true, true]),
    },
    {
      titulo: "Compruebo el resultado",
      texto:
        `El resultado es **${total}**. Estimación: ${redondear(a)} × ${redondear(b)} = ${redondear(a) * redondear(b)}, ` +
        `un número cercano a ${total}. Si tu resultado se aleja mucho de la estimación, revisa los pasos.`,
      escena: escena(null, [true, true, true]),
    },
  ];
}
