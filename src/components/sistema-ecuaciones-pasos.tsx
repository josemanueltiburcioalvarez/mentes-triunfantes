"use client";

import { useState } from "react";
import type { SistemaEcuaciones } from "@/lib/ejercicios/sistemas-ecuaciones";
import { BOTON_RESPONDER, type PropsComunes } from "./tipos-pregunta";
import { BOTON_OPCION, BotonResponder, CampoEntero, Mensaje, aNumero, conSigno } from "./entero-comun";

type Fase = "operacion" | "cuenta" | "comprobar" | "fin";

// Sistemas de ecuaciones por eliminacion: se muestran las dos ecuaciones; si hace falta igualar un
// coeficiente se multiplica una de ellas (unico paso con opciones), despues se suman ("colapsan" a
// una sola linea) y se resuelve como una ecuacion normal para x, se sustituye para hallar y, y se
// comprueba en la ecuacion 2 original.
export default function SistemaEcuacionesPasos({
  sistema,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { sistema: SistemaEcuaciones }) {
  const [paso, setPaso] = useState(0);
  const [fase, setFase] = useState<Fase>(sistema.pasos[0].opciones ? "operacion" : "cuenta");
  const [entrada, setEntrada] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [erroresOperacion, setErroresOperacion] = useState(0);
  const [erroresCuenta, setErroresCuenta] = useState(0);
  const [erroresComprobacion, setErroresComprobacion] = useState(0);
  const [ecuacion1, setEcuacion1] = useState(sistema.texto1);
  const [colapsado, setColapsado] = useState(false);
  const [lineas, setLineas] = useState<string[]>([]);

  const actual = sistema.pasos[paso];
  const errores = erroresOperacion + erroresCuenta + erroresComprobacion;
  const inactivo = bloqueado || fase === "fin";
  const textoActual = lineas.length > 0 ? lineas[lineas.length - 1] : null;

  function elegirOperacion(id: string) {
    if (inactivo || fase !== "operacion") return;
    if (id === actual.correcta) {
      setFase("cuenta");
      setEntrada("");
      setMensaje(null);
      return;
    }
    setErroresOperacion((n) => n + 1);
    setMensaje(actual.pista);
  }

  function confirmarCuenta(e: React.FormEvent) {
    e.preventDefault();
    if (inactivo || fase !== "cuenta" || entrada === "") return;
    if (aNumero(entrada) !== actual.respuesta) {
      setErroresCuenta((n) => n + 1);
      setMensaje(`${actual.pregunta} ${entrada} no es correcto. Revisa la cuenta.`);
      return;
    }
    if (actual.tipo === "igualar") {
      setEcuacion1(actual.resultado);
    } else if (actual.tipo === "eliminar") {
      setColapsado(true);
      setLineas([actual.resultado]);
    } else {
      setLineas((l) => [...l, actual.resultado]);
    }
    setMensaje(null);
    setEntrada("");
    if (paso + 1 < sistema.pasos.length) {
      const siguiente = sistema.pasos[paso + 1];
      setPaso(paso + 1);
      setFase(siguiente.opciones ? "operacion" : "cuenta");
    } else {
      setFase("comprobar");
    }
  }

  function confirmarComprobacion(e: React.FormEvent) {
    e.preventDefault();
    if (inactivo || fase !== "comprobar" || entrada === "") return;
    if (aNumero(entrada) !== sistema.comprobacion.valorEsperado) {
      setErroresComprobacion((n) => n + 1);
      setMensaje(
        "Revisa la cuenta de la comprobación: al sustituir x e y en la ecuación 2, debe dar el mismo número que al otro lado."
      );
      return;
    }
    setMensaje(null);
    setFase("fin");
  }

  function responder() {
    if (bloqueado || fase !== "fin") return;
    const bien = errores === 0;
    onResponder({
      respuestaDada: `x=${conSigno(sistema.solucionX)}, y=${conSigno(sistema.solucionY)}`,
      valor: bien ? sistema.solucionX : NaN,
      pasos: {
        modo: "sistema_ecuaciones",
        ecuacion1: sistema.texto1,
        ecuacion2: sistema.texto2,
        solucion_x: sistema.solucionX,
        solucion_y: sistema.solucionY,
        errores_operacion: erroresOperacion,
        errores_cuenta: erroresCuenta,
        errores_comprobacion: erroresComprobacion,
        requeria_marcas: true,
        uso_marcas: true,
        marcas_correctas: bien,
      },
      detalle: bien
        ? undefined
        : `Llegaste a x = ${conSigno(sistema.solucionX)}, y = ${conSigno(sistema.solucionY)}, pero tuviste ${errores} error${errores === 1 ? "" : "es"} en el camino ` +
          `(${erroresOperacion} al elegir la operación, ${erroresCuenta} en cuentas y ${erroresComprobacion} en la comprobación), así que cuenta como incorrecto.`,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        Elimina una de las letras sumando las dos ecuaciones, resuelve la que queda y sustituye para hallar la otra.
      </p>

      {!colapsado ? (
        <div className="flex flex-col items-center gap-1 font-mono text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          <div>{ecuacion1}</div>
          <div>{sistema.texto2}</div>
        </div>
      ) : (
        <>
          {lineas.length > 1 && (
            <div className="flex flex-col items-center gap-1 font-mono text-xl text-zinc-400 dark:text-zinc-500">
              {lineas.slice(0, -1).map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
          <p className="font-mono text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{textoActual}</p>
        </>
      )}

      {fase === "operacion" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">¿Qué haces ahora?</p>
          <div className="flex w-full flex-col gap-2">
            {actual.opciones?.map((o) => (
              <button key={o.id} type="button" disabled={inactivo} onClick={() => elegirOperacion(o.id)} className={BOTON_OPCION}>
                {o.etiqueta}
              </button>
            ))}
          </div>
        </div>
      )}

      {fase === "cuenta" && (
        <form onSubmit={confirmarCuenta} className="flex items-center gap-2">
          <span className="font-mono text-xl text-zinc-700 dark:text-zinc-200">{actual.pregunta}</span>
          <CampoEntero valor={entrada} onCambio={setEntrada} etiqueta="Resultado de la cuenta" deshabilitado={inactivo} />
          <button type="submit" disabled={entrada === "" || entrada === "−"} className={BOTON_RESPONDER}>
            OK
          </button>
        </form>
      )}

      {fase === "comprobar" && (
        <form onSubmit={confirmarComprobacion} className="flex flex-col items-center gap-3">
          <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            Comprueba en la ecuación 2: cambia x por <strong className="font-mono">{conSigno(sistema.solucionX)}</strong> e y por{" "}
            <strong className="font-mono">{conSigno(sistema.solucionY)}</strong> y haz la cuenta.
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-zinc-700 dark:text-zinc-200">{sistema.comprobacion.expresion}</span>
            <CampoEntero valor={entrada} onCambio={setEntrada} etiqueta="Resultado" deshabilitado={inactivo} />
          </div>
          <button type="submit" disabled={entrada === "" || entrada === "−"} className={BOTON_RESPONDER}>
            Comprobar
          </button>
        </form>
      )}

      {fase === "fin" && (
        <>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            ✓ Comprobado: x = {conSigno(sistema.solucionX)}, y = {conSigno(sistema.solucionY)}
          </p>
          {!bloqueado && <BotonResponder enviando={enviando} alClic={responder} />}
        </>
      )}

      <Mensaje texto={mensaje} />
    </div>
  );
}
