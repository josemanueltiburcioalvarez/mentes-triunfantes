import { aTexto, pasosResolucion, superindice, type Token } from "../ejercicios/combinadas";
import { guiaMultiplicacion2 } from "./columnas";
import type { EscenaLineas, LineaEscena, PasoGuia } from "./tipos";

const lineas = (...ls: LineaEscena[]): EscenaLineas => ({ tipo: "lineas", lineas: ls });
const L = (t: string, e?: LineaEscena["e"]): LineaEscena => ({ t, e });

// ---------------------------------------------------------------- potencia
export function guiaPotencia(base: number, exp: number): PasoGuia[] {
  const sup = superindice(exp);
  const expansion = Array(exp).fill(base).join(" × ");
  const pasos: PasoGuia[] = [
    {
      titulo: "Qué es una potencia",
      texto:
        `Una potencia es una multiplicación abreviada. **${base}${sup}** significa multiplicar el ${base} **${exp} veces** ` +
        `por sí mismo. Ojo: ${base}${sup} **no** es ${base} × ${exp} (eso daría ${base * exp}).`,
      escena: lineas(
        L(`${base}${sup}`, "foco"),
        L(""),
        L(`base = ${base}   (el número que se repite)`),
        L(`exponente = ${exp}   (cuántas veces)`)
      ),
    },
    {
      titulo: "Escríbela como multiplicación",
      texto: `El exponente me dice cuántos ${base} escribir. Aquí son ${exp}: **${expansion}**.`,
      escena: lineas(L(`${base}${sup} = ${expansion}`, "foco")),
    },
  ];

  const historia: LineaEscena[] = [L(`${base}${sup} = ${expansion}`, "apagado")];
  for (let k = 1; k < exp; k++) {
    const previo = base ** k;
    const producto = base ** (k + 1);
    const resto = Array(exp - k - 1).fill(base);
    const linea = `= ${[producto, ...resto].join(" × ")}`;
    historia.push(L(linea, "foco"));
    pasos.push({
      titulo: `Multiplico de dos en dos (${k} de ${exp - 1})`,
      texto:
        `Resuelvo las multiplicaciones de izquierda a derecha, de dos en dos: ${previo} × ${base} = **${producto}**. ` +
        "Si los números son grandes, esa multiplicación se hace en vertical.",
      escena: lineas(...historia.map((l, i) => (i === historia.length - 1 ? l : { ...l, e: "apagado" as const }))),
    });
  }

  const final = base ** exp;
  const vuelta: string[] = [];
  for (let k = exp; k > 1; k--) vuelta.push(`${base ** k} ÷ ${base} = ${base ** (k - 1)}`);
  pasos.push({
    titulo: "Compruebo el resultado",
    texto:
      `El resultado es **${final}**. Para comprobar, divido entre la base tantas veces como indica el exponente: ` +
      `${vuelta.join("; ")}. Si al final llego a la base (${base}), la potencia está bien.`,
    escena: lineas(L(`${base}${sup} = ${final}`, "resultado"), L(""), ...vuelta.map((v) => L(v))),
  });
  return pasos;
}

export function guiaCuadradoDosCifras(base: number): PasoGuia[] {
  const intro: PasoGuia = {
    titulo: "Elevar al cuadrado un número de dos cifras",
    texto:
      `Elevar al cuadrado es multiplicar el número por sí mismo: **${base}² = ${base} × ${base}**. ` +
      "Con dos cifras se resuelve con la multiplicación por dos cifras que ya conoces: dos productos parciales y una suma.",
    escena: lineas(L(`${base}² = ${base} × ${base}`, "foco")),
  };
  const [primero, ...resto] = guiaMultiplicacion2(base, base);
  return [intro, primero, ...resto];
}

// ---------------------------------------------------------------- raiz
export function guiaRaizIntro(raiz: number): PasoGuia[] {
  const rad = raiz * raiz;
  const tanteo: LineaEscena[] = [];
  for (let n = Math.max(2, raiz - 3); n <= raiz; n++) {
    const sq = n * n;
    tanteo.push(L(`${n} × ${n} = ${sq}   ${n === raiz ? "✓" : `(${sq < rad ? "es menor" : "se pasa"})`}`, n === raiz ? "foco" : "normal"));
  }
  return [
    {
      titulo: "La raíz es la operación contraria a la potencia",
      texto:
        `La potencia parte de un número y lo multiplica por sí mismo; la **raíz cuadrada** hace el camino de vuelta: ` +
        `√${rad} pregunta **¿qué número multiplicado por sí mismo da ${rad}?**`,
      escena: lineas(L(`${raiz}² = ${rad}`), L(`√${rad} = ${raiz}`, "foco")),
    },
    {
      titulo: "Busca por tanteo",
      texto:
        `Pruebo números y miro si me acerco a ${rad}: si el resultado es menor, pruebo un número mayor; si me paso, uno menor. ` +
        `Con ${raiz} acierto: ${raiz} × ${raiz} = ${rad}.`,
      escena: lineas(...tanteo),
    },
    {
      titulo: "Aprende los cuadrados perfectos",
      texto:
        "Los números como 4, 9, 16, 25... se llaman **cuadrados perfectos**. Cuanto mejor te los sepas, más rápido resuelves las raíces.",
      escena: lineas(
        L("1² = 1  ·  2² = 4  ·  3² = 9  ·  4² = 16"),
        L("5² = 25  ·  6² = 36  ·  7² = 49  ·  8² = 64"),
        L("9² = 81  ·  10² = 100  ·  11² = 121  ·  12² = 144")
      ),
    },
    {
      titulo: "Compruebo el resultado",
      texto:
        `Siempre puedo comprobar una raíz multiplicándola por sí misma: si ${raiz} × ${raiz} da ${rad}, entonces √${rad} = ${raiz}. ` +
        "En la práctica, esa comprobación la escribes en vertical.",
      escena: lineas(L(`√${rad} = ${raiz}`, "resultado"), L(`porque ${raiz} × ${raiz} = ${rad}`)),
    },
  ];
}

export function guiaRaizSuperior(): PasoGuia[] {
  return [
    {
      titulo: "Raíces cúbica, cuarta y quinta",
      texto:
        "El pequeño número de la raíz (el **índice**) dice cuántas veces se multiplica el resultado por sí mismo. " +
        "Sin número es la cuadrada (2 veces); **∛** es la cúbica (3 veces), **∜** la cuarta (4 veces) y **⁵√** la quinta (5 veces).",
      escena: lineas(
        L("√49 = 7      porque 7 × 7 = 49"),
        L("∛27 = 3      porque 3 × 3 × 3 = 27", "foco"),
        L("∜81 = 3      porque 3 × 3 × 3 × 3 = 81", "foco"),
        L("⁵√32 = 2     porque 2 × 2 × 2 × 2 × 2 = 32", "foco")
      ),
    },
    {
      titulo: "Busca por tanteo",
      texto:
        "Igual que con la cuadrada: pruebas un número y ves si te pasas o te quedas corto. Para **∛125** pruebo 4: 4 × 4 × 4 = 64 (corto); " +
        "pruebo 5: 5 × 5 × 5 = 125 ✓. Por eso ∛125 = **5**.",
      escena: lineas(L("4 × 4 × 4 = 64    (es menor)"), L("5 × 5 × 5 = 125   ✓", "resultado"), L("∛125 = 5", "resultado")),
    },
    {
      titulo: "Aprende las potencias que más se usan",
      texto: "Conocer estas potencias te permite reconocer la raíz al instante.",
      escena: lineas(
        L("Cubos:  1, 8, 27, 64, 125, 216, 343, 512, 729, 1000"),
        L("Cuartas:  2⁴ = 16 · 3⁴ = 81 · 4⁴ = 256 · 5⁴ = 625"),
        L("Quintas:  2⁵ = 32 · 3⁵ = 243 · 4⁵ = 1024 · 5⁵ = 3125")
      ),
    },
    {
      titulo: "Compruebo el resultado",
      texto:
        "Siempre compruebas elevando tu respuesta al índice: si ∜625 = 5, entonces 5⁴ = 5 × 5 × 5 × 5 = 625. " +
        "En la práctica esa comprobación la haces con multiplicaciones en vertical, de dos en dos.",
      escena: lineas(L("∜625 = 5", "resultado"), L("5 × 5 = 25   →   25 × 5 = 125   →   125 × 5 = 625 ✓")),
    },
  ];
}

const ULTIMA_CIFRA: Record<number, number[]> = { 0: [0], 1: [1, 9], 4: [2, 8], 5: [5], 6: [4, 6], 9: [3, 7] };

export function guiaRaizGrande(raiz: number): PasoGuia[] {
  const rad = raiz * raiz;
  const d = Math.floor(raiz / 10) * 10;
  const opciones = ULTIMA_CIFRA[rad % 10];
  const candidatos = opciones.map((x) => d + x).sort((a, b) => a - b);

  const pruebas: LineaEscena[] = [];
  for (const c of candidatos) {
    const sq = c * c;
    pruebas.push(L(`${c} × ${c} = ${sq}   ${sq === rad ? "✓" : sq < rad ? "(es menor)" : "(se pasa)"}`, sq === rad ? "foco" : "normal"));
    if (sq === rad) break;
  }

  return [
    {
      titulo: "Acércate con las decenas",
      texto:
        `Para √${rad}, primero ubico la raíz entre dos decenas: ${d} × ${d} = ${d * d} y ${d + 10} × ${d + 10} = ${(d + 10) ** 2}. ` +
        `Como ${d * d} < ${rad} < ${(d + 10) ** 2}, la raíz está **entre ${d} y ${d + 10}**.`,
      escena: lineas(L(`${d} × ${d} = ${d * d}`), L(`${rad} está en medio`, "foco"), L(`${d + 10} × ${d + 10} = ${(d + 10) ** 2}`)),
    },
    {
      titulo: "Mira la última cifra",
      texto:
        `${rad} termina en ${rad % 10}. Solo hay ${opciones.length === 1 ? "una posibilidad" : "dos posibilidades"} para la última cifra de la raíz: ` +
        `**${opciones.join(" o ")}**, porque solo esos números al multiplicarse por sí mismos terminan en ${rad % 10}.`,
      escena: lineas(
        ...[0, 1, 4, 5, 6, 9].map((u) =>
          L(`termina en ${u}  →  la raíz termina en ${ULTIMA_CIFRA[u].join(" o ")}`, u === rad % 10 ? "foco" : "apagado")
        )
      ),
    },
    {
      titulo: "Prueba los candidatos",
      texto:
        `Los candidatos entre ${d} y ${d + 10} son ${candidatos.join(" y ")}. Los multiplico por sí mismos hasta encontrar ${rad}.`,
      escena: lineas(...pruebas),
    },
    {
      titulo: "Compruebo el resultado",
      texto:
        `√${rad} = **${raiz}**. Esa comprobación (${raiz} × ${raiz}) es justo la multiplicación en vertical que harás en la práctica.`,
      escena: lineas(L(`√${rad} = ${raiz}`, "resultado"), L(`porque ${raiz} × ${raiz} = ${rad}`)),
    },
  ];
}

// ---------------------------------------------------------------- operaciones combinadas
export function guiaCombinada(tokens: Token[]): PasoGuia[] {
  const resolucion = pasosResolucion(tokens);
  if (!resolucion) return [];
  const inicial = aTexto(tokens);

  const pasos: PasoGuia[] = [
    {
      titulo: "Hay un orden para resolver",
      texto:
        "Cuando una cuenta mezcla varias operaciones no se resuelve de corrido, de izquierda a derecha: hay un **orden**. " +
        "Primero lo que está entre paréntesis; luego potencias y raíces; después multiplicaciones y divisiones; y al final sumas y restas. " +
        "Las operaciones del mismo nivel se resuelven de izquierda a derecha.",
      escena: lineas(
        L(inicial, "foco"),
        L(""),
        L("1.º  Paréntesis"),
        L("2.º  Potencias y raíces"),
        L("3.º  Multiplicaciones y divisiones"),
        L("4.º  Sumas y restas"),
        L("(mismo nivel: de izquierda a derecha)", "apagado")
      ),
    },
  ];

  const historia: string[] = [inicial];
  resolucion.forEach((p) => {
    const r = p.reduccion;
    const cuenta = `${r.operacion} = **${r.valor}**`;
    let titulo: string;
    let texto: string;
    if (p.dentroDeParentesis) {
      titulo = "Primero, lo que está entre paréntesis";
      texto = `Empiezo por el paréntesis: ${cuenta}.`;
    } else if (r.categoria === "potencia") {
      titulo = "Ahora, las potencias";
      texto = `Las potencias van antes que las multiplicaciones y las sumas: ${cuenta}.`;
    } else if (r.categoria === "raiz") {
      titulo = "Ahora, las raíces";
      texto = `Las raíces se resuelven junto con las potencias, antes de multiplicar y sumar: ${cuenta}.`;
    } else if (r.categoria === "multiplicativa") {
      titulo = "Multiplicaciones y divisiones";
      const sumaAntes = p.antes.slice(0, r.desde).some((k) => k.t === "op" && (k.v === "+" || k.v === "−"));
      texto =
        "Las multiplicaciones y divisiones van antes que las sumas y restas" +
        (sumaAntes ? ", aunque la suma o resta esté primero en la cuenta" : "") +
        `. ${cuenta}.`;
    } else {
      titulo = "Por último, sumas y restas";
      texto = `Ya solo quedan sumas y restas, que se resuelven de izquierda a derecha: ${cuenta}.`;
    }
    historia.push(`= ${aTexto(p.despues)}`);
    pasos.push({
      titulo,
      texto,
      escena: lineas(...historia.map((l, i) => L(l, i === historia.length - 1 ? "foco" : "apagado"))),
    });
  });

  const ultimo = resolucion[resolucion.length - 1].despues;
  const valor = ultimo[0].t === "num" ? ultimo[0].v : 0;
  pasos.push({
    titulo: "Resultado",
    texto: `El resultado es **${valor}**. Si hubieras resuelto de corrido, de izquierda a derecha, te habría salido otro número.`,
    escena: lineas(...historia.map((l, i) => L(l, i === historia.length - 1 ? "resultado" : "apagado"))),
  });
  return pasos;
}
