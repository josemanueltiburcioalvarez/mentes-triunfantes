import { pasosDivision } from "../ejercicios/vertical";
import type { EscenaDivision, PasoGuia } from "./tipos";

export function guiaDivision(dividendo: number, divisor: number): PasoGuia[] {
  const { pasos } = pasosDivision(dividendo, divisor);
  const cifras = String(dividendo);
  const cifrasDivisor = String(divisor).length;

  const escena = (paso: number, fase: number, focoDesde = -1, focoHasta = -1): EscenaDivision => ({
    tipo: "division",
    dividendo,
    divisor,
    paso,
    fase,
    focoDesde,
    focoHasta,
  });

  const primero = pasos[0];
  const tomadas = primero.columna + 1;
  const primeraTomada = Number(cifras.slice(0, tomadas));
  const grupoInicial = Number(cifras.slice(0, cifrasDivisor));
  const cociente = Number(pasos.map((p) => p.cocienteDigito).join(""));
  const nombreGrupo = cifrasDivisor === 1 ? "la primera cifra" : `las primeras ${cifrasDivisor} cifras`;

  const guia: PasoGuia[] = [
    {
      titulo: "Dividir es repartir",
      texto:
        `${dividendo} ÷ ${divisor} significa: si reparto ${dividendo} en ${divisor} partes iguales, ¿cuánto le toca a cada una? ` +
        `Se escribe en la "casita": el **dividendo** (${dividendo}) dentro, el **divisor** (${divisor}) afuera a la derecha, ` +
        "y el **cociente** (el resultado) debajo del divisor. Para resolverla repetimos siempre 4 pasos: " +
        "**Dividir, Multiplicar, Restar, Bajar**.",
      escena: escena(-1, 0),
    },
    {
      titulo: "¿Con cuántas cifras empiezo?",
      texto:
        tomadas === cifrasDivisor
          ? `Tomo ${nombreGrupo} del dividendo: **${grupoInicial}**. Como ${grupoInicial} es mayor o igual que ${divisor}, ` +
            "ya alcanza para repartir."
          : `Miro ${nombreGrupo} del dividendo: ${grupoInicial}. Como ${grupoInicial} es menor que ${divisor}, **no alcanza** ` +
            `para repartir. Entonces tomo una cifra más: **${primeraTomada}**.`,
      escena: escena(-1, 0, 0, primero.columna),
    },
  ];

  pasos.forEach((paso, s) => {
    const parcial = s === 0 ? primeraTomada : (pasos[s - 1].restoConBajada as number);
    const q = paso.cocienteDigito;
    const foco = s === 0 ? [0, paso.columna] : [paso.columna, paso.columna];
    const vuelta = `Vuelta ${s + 1}`;

    guia.push({
      titulo: `${vuelta}: Dividir`,
      texto:
        `¿Cuántas veces cabe **${divisor}** en **${parcial}**? ` +
        (q === 0
          ? "No cabe ninguna vez, así que escribo **0** en el cociente."
          : `Pruebo: ${divisor} × ${q} = ${paso.producto}, que no se pasa de ${parcial}. Si probara con ${q + 1}: ` +
            `${divisor} × ${q + 1} = ${divisor * (q + 1)}, que ya se pasa. Entonces caben **${q} veces**: escribo **${q}** ` +
            "en el cociente."),
      escena: escena(s, 1, foco[0], foco[1]),
    });

    guia.push({
      titulo: `${vuelta}: Multiplicar`,
      texto:
        `Multiplico la cifra del cociente por el divisor: ${q} × ${divisor} = **${paso.producto}**. ` +
        `Lo escribo **debajo de ${parcial}**, alineado a la derecha.`,
      escena: escena(s, 2),
    });

    const ultimo = paso.restoConBajada === null;
    guia.push({
      titulo: `${vuelta}: Restar`,
      texto:
        `Resto: ${parcial} − ${paso.producto} = **${paso.resto}**. Lo escribo debajo de la raya. ` +
        `Recuerda: el resto siempre debe ser menor que el divisor (${paso.resto} < ${divisor}).` +
        (ultimo ? ` Como ya no quedan cifras por bajar, la división termina con resto **${paso.resto}**.` : ""),
      escena: escena(s, 3),
    });

    if (!ultimo) {
      const siguiente = cifras[paso.columna + 1];
      guia.push({
        titulo: `${vuelta}: Bajar`,
        texto:
          `Bajo la siguiente cifra del dividendo, el **${siguiente}**, y la pongo al lado del ${paso.resto}: ` +
          `queda **${paso.restoConBajada}**. Ahora repito los 4 pasos con este número.`,
        escena: escena(s, 4, paso.columna + 1, paso.columna + 1),
      });
    }
  });

  guia.push({
    titulo: "Compruebo el resultado",
    texto:
      `El cociente es **${cociente}**. Compruebo con la operación contraria, una multiplicación: ` +
      `${cociente} × ${divisor} = ${dividendo}. Si da el dividendo (y el resto es 0), la división está bien.`,
    escena: escena(pasos.length - 1, 4),
  });

  return guia;
}
