"use client";

import { useState } from "react";
import type { EjercicioGenerado } from "@/lib/ejercicios/generador";
import { BOTON_RESPONDER, type PropsComunes, type RespuestaPregunta } from "./tipos-pregunta";
import VerticalAditiva from "./vertical-aditiva";
import VerticalMultiplicacion from "./vertical-multiplicacion";
import VerticalDivision from "./vertical-division";
import VerticalPotencia from "./vertical-potencia";
import VerticalRaiz from "./vertical-raiz";
import CombinadasPaso from "./combinadas-paso";
import EnteroSumaResta from "./entero-suma-resta";
import EnteroMultDiv from "./entero-mult-div";
import EnteroPotencia from "./entero-potencia";
import EnteroRaiz from "./entero-raiz";
import EcuacionPasos from "./ecuacion-pasos";

export type { RespuestaPregunta };

interface Props extends PropsComunes {
  ejercicio: EjercicioGenerado;
}

export default function Pregunta(props: Props) {
  const { ejercicio, ...comunes } = props;
  const operandos = ejercicio.operandos;

  if (ejercicio.operacion === "combinadas" && ejercicio.expresion) {
    return <CombinadasPaso {...comunes} expresion={ejercicio.expresion} />;
  }

  switch (ejercicio.operacion) {
    case "suma_enteros":
    case "resta_enteros":
      if (ejercicio.terminos)
        return (
          <EnteroSumaResta
            {...comunes}
            operacion={ejercicio.operacion === "suma_enteros" ? "suma" : "resta"}
            terminos={ejercicio.terminos}
          />
        );
      break;
    case "multiplicacion_enteros":
    case "division_enteros":
      if (operandos)
        return (
          <EnteroMultDiv
            {...comunes}
            operacion={ejercicio.operacion === "multiplicacion_enteros" ? "multiplicacion" : "division"}
            a={operandos[0]}
            b={operandos[1]}
          />
        );
      break;
    case "potencia_enteros":
      if (ejercicio.potenciaEntera) return <EnteroPotencia {...comunes} potencia={ejercicio.potenciaEntera} />;
      break;
    case "raiz_enteros":
      if (ejercicio.raizEntera) return <EnteroRaiz {...comunes} raiz={ejercicio.raizEntera} />;
      break;
    case "ecuacion":
      if (ejercicio.ecuacion) return <EcuacionPasos {...comunes} ecuacion={ejercicio.ecuacion} />;
      break;
  }

  if (ejercicio.operacion && operandos) {
    switch (ejercicio.operacion) {
      case "suma":
      case "resta":
        return <VerticalAditiva {...comunes} operacion={ejercicio.operacion} a={operandos[0]} b={operandos[1]} />;
      case "multiplicacion":
        return <VerticalMultiplicacion {...comunes} a={operandos[0]} b={operandos[1]} />;
      case "division":
        return <VerticalDivision {...comunes} dividendo={operandos[0]} divisor={operandos[1]} />;
      case "potencia":
        return <VerticalPotencia {...comunes} base={operandos[0]} exponente={operandos[1]} />;
      case "raiz":
        return <VerticalRaiz {...comunes} radicando={operandos[0]} raiz={operandos[1]} />;
    }
  }
  return <Simple {...props} />;
}

function Simple({ ejercicio, bloqueado, enviando, onResponder }: Props) {
  const [respuesta, setRespuesta] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado || respuesta === "") return;
    onResponder({
      respuestaDada: respuesta,
      valor: Number(respuesta.replace(",", ".")),
      pasos: null,
    });
  }

  return (
    <div>
      <p className="mb-6 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {ejercicio.enunciado}
      </p>
      {!bloqueado && (
        <form onSubmit={enviar} className="flex flex-col items-center gap-4">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-center text-xl outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button type="submit" disabled={enviando || respuesta === ""} className={BOTON_RESPONDER}>
            Responder
          </button>
        </form>
      )}
    </div>
  );
}
