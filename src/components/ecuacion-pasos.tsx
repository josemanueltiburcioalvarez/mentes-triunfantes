"use client";

import { useState } from "react";
import type { Ecuacion } from "@/lib/ejercicios/ecuaciones";
import { BOTON_RESPONDER, type PropsComunes } from "./tipos-pregunta";
import { BOTON_OPCION, BotonResponder, CampoEntero, Mensaje, aNumero, conSigno } from "./entero-comun";

type Fase = "operacion" | "cuenta" | "comprobar" | "fin";

// Ecuaciones por operaciones inversas: en cada paso el estudiante elige la operacion que deshace
// lo que estorba a la x, hace la cuenta y la ecuacion se reescribe; al final comprueba sustituyendo.
export default function EcuacionPasos({
  ecuacion,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { ecuacion: Ecuacion }) {
  const [paso, setPaso] = useState(0);
  const [fase, setFase] = useState<Fase>("operacion");
  const [entrada, setEntrada] = useState("");
  const [entradaDerecha, setEntradaDerecha] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [erroresOperacion, setErroresOperacion] = useState(0);
  const [erroresCuenta, setErroresCuenta] = useState(0);
  const [erroresComprobacion, setErroresComprobacion] = useState(0);
  const [lineas, setLineas] = useState<string[]>([]);

  const actual = ecuacion.pasos[paso];
  const comp = ecuacion.comprobacion;
  const errores = erroresOperacion + erroresCuenta + erroresComprobacion;
  const inactivo = bloqueado || fase === "fin";
  const textoActual = lineas.length > 0 ? lineas[lineas.length - 1] : ecuacion.texto;

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
    setLineas((l) => [...l, actual.resultado]);
    setMensaje(null);
    setEntrada("");
    if (paso + 1 < ecuacion.pasos.length) {
      setPaso(paso + 1);
      setFase("operacion");
    } else {
      setFase("comprobar");
    }
  }

  function confirmarComprobacion(e: React.FormEvent) {
    e.preventDefault();
    if (inactivo || fase !== "comprobar" || entrada === "") return;
    const izquierdaBien = aNumero(entrada) === comp.valorIzquierda;
    const derechaBien = comp.derecha === null || aNumero(entradaDerecha) === comp.valorDerecha;
    if (!izquierdaBien || !derechaBien) {
      setErroresComprobacion((n) => n + 1);
      setMensaje("Revisa las cuentas de la comprobación: al sustituir la x, los dos lados deben dar el mismo número.");
      return;
    }
    setMensaje(null);
    setFase("fin");
  }

  function responder() {
    if (bloqueado || fase !== "fin") return;
    const bien = errores === 0;
    onResponder({
      respuestaDada: conSigno(ecuacion.solucion),
      valor: bien ? ecuacion.solucion : NaN,
      pasos: {
        modo: "ecuacion",
        ecuacion: ecuacion.texto,
        solucion: ecuacion.solucion,
        errores_operacion: erroresOperacion,
        errores_cuenta: erroresCuenta,
        errores_comprobacion: erroresComprobacion,
        requeria_marcas: true,
        uso_marcas: true,
        marcas_correctas: bien,
      },
      detalle: bien
        ? undefined
        : `Llegaste a x = ${conSigno(ecuacion.solucion)}, pero tuviste ${errores} error${errores === 1 ? "" : "es"} en el camino ` +
          `(${erroresOperacion} al elegir la operación, ${erroresCuenta} en cuentas y ${erroresComprobacion} en la comprobación), así que cuenta como incorrecto.`,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        Deja la <strong>x</strong> sola: deshaz las operaciones que la rodean, y lo que hagas a un lado se hace al otro.
      </p>

      {lineas.length > 0 && (
        <div className="flex flex-col items-center gap-1 font-mono text-xl text-zinc-400 dark:text-zinc-500">
          {[ecuacion.texto, ...lineas.slice(0, -1)].map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
      <p className="font-mono text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{textoActual}</p>

      {fase === "operacion" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">¿Qué haces ahora?</p>
          <div className="flex w-full flex-col gap-2">
            {actual.opciones.map((o) => (
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
            Comprueba: cambia la x por <strong className="font-mono">{conSigno(ecuacion.solucion)}</strong> y haz las cuentas.
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-zinc-700 dark:text-zinc-200">{comp.izquierda}</span>
            <CampoEntero valor={entrada} onCambio={setEntrada} etiqueta="Lado izquierdo" deshabilitado={inactivo} />
          </div>
          {comp.derecha !== null && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg text-zinc-700 dark:text-zinc-200">{comp.derecha}</span>
              <input
                type="text"
                autoComplete="off"
                value={entradaDerecha}
                onChange={(e) => setEntradaDerecha(e.target.value.replace(/[^\d−-]/g, "").replace(/^-/, "−").slice(0, 8))}
                aria-label="Lado derecho"
                className="h-11 w-28 rounded-lg border border-zinc-300 px-2 text-center font-mono text-xl outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={entrada === "" || entrada === "−" || (comp.derecha !== null && (entradaDerecha === "" || entradaDerecha === "−"))}
            className={BOTON_RESPONDER}
          >
            Comprobar
          </button>
        </form>
      )}

      {fase === "fin" && (
        <>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            ✓ Comprobado: x = {conSigno(ecuacion.solucion)}
          </p>
          {!bloqueado && <BotonResponder enviando={enviando} alClic={responder} />}
        </>
      )}

      <Mensaje texto={mensaje} />
    </div>
  );
}
