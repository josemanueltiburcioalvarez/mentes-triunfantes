"use client";

import { useState } from "react";
import type { Json } from "@/lib/supabase/database.types";
import { signado, signoDe } from "@/lib/ejercicios/enteros";
import VerticalAditiva from "./vertical-aditiva";
import { BotonResponder, Mensaje, Opciones, OPCIONES_SIGNO, conSigno, type Opcion } from "./entero-comun";
import type { PropsComunes, RespuestaPregunta } from "./tipos-pregunta";

type Fase = "convertir" | "caso" | "magnitud" | "signo" | "fin";

const OPCIONES_CONVERTIR: Opcion[] = [
  { id: "bien", etiqueta: "Cambiar − por + y cambiar el signo del segundo número" },
  { id: "igual", etiqueta: "Cambiar − por + y dejar el segundo número como está" },
  { id: "directo", etiqueta: "Restar directamente los números sin mirar los signos" },
];

const OPCIONES_CASO: Opcion[] = [
  { id: "iguales", etiqueta: "Signos iguales → se suman los números y se deja el mismo signo" },
  { id: "diferentes", etiqueta: "Signos diferentes → se restan los números y gana el signo del mayor" },
];

// Suma y resta de numeros con signo, paso a paso: (convertir la resta en suma) -> ¿signos iguales o
// diferentes? -> cuenta en vertical con los numeros sin signo -> signo del resultado.
export default function EnteroSumaResta({
  operacion,
  terminos,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { operacion: "suma" | "resta"; terminos: number[] }) {
  const [acumulado, setAcumulado] = useState(terminos[0]);
  const [indice, setIndice] = useState(1); // termino que se esta sumando/restando
  const [fase, setFase] = useState<Fase>(operacion === "resta" ? "convertir" : "caso");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errores, setErrores] = useState(0);
  const [lineas, setLineas] = useState<string[]>([]);
  const [magnitudMal, setMagnitudMal] = useState<string[]>([]);
  const [pasos, setPasos] = useState<unknown[]>([]);
  const [magnitudEscrita, setMagnitudEscrita] = useState<number | null>(null);

  const simbolo = operacion === "suma" ? "+" : "−";
  const termino = terminos[indice];
  // termino "efectivo": en una resta se convierte en suma del opuesto
  const efectivo = operacion === "resta" ? -termino : termino;
  const iguales = signoDe(acumulado) === signoDe(efectivo);
  const magnitud = iguales ? Math.abs(acumulado) + Math.abs(efectivo) : Math.abs(Math.abs(acumulado) - Math.abs(efectivo));
  const nuevo = acumulado + efectivo;
  const inactivo = bloqueado || fase === "fin";

  const restantes = terminos.slice(indice + 1);
  const lineaActual = [
    signado(acumulado),
    fase === "convertir" || operacion === "suma" ? `${simbolo} ${signado(termino)}` : `+ ${signado(efectivo)}`,
    ...restantes.map((t) => `${simbolo} ${signado(t)}`),
  ].join(" ");

  function fallar(texto: string) {
    setErrores((n) => n + 1);
    setMensaje(texto);
  }

  function elegirConversion(id: string) {
    if (inactivo) return;
    if (id === "bien") {
      setMensaje(null);
      setFase("caso");
      return;
    }
    fallar(
      id === "igual"
        ? "Restar es sumar el opuesto: al pasar de − a + hay que cambiar también el signo del segundo número."
        : "Con signos no se restan directo: restar un número es lo mismo que sumar su opuesto (el de signo contrario)."
    );
  }

  function elegirCaso(id: string) {
    if (inactivo) return;
    if ((id === "iguales") === iguales) {
      setMensaje(null);
      setFase("magnitud");
      return;
    }
    fallar(
      iguales
        ? `${signado(acumulado)} y ${signado(efectivo)} tienen el mismo signo.`
        : `${signado(acumulado)} y ${signado(efectivo)} tienen signos diferentes.`
    );
  }

  function alResponderMagnitud(r: RespuestaPregunta) {
    // valor es -1 cuando las llevadas/prestadas estan mal anotadas; lo escrito va en respuestaDada
    const escrito = Number(r.respuestaDada);
    if (r.valor !== magnitud) {
      setErrores((n) => n + 1);
      const cuenta = `${Math.abs(acumulado)} ${iguales ? "+" : "−"} ${Math.abs(efectivo)} = ${magnitud}`;
      setMagnitudMal((m) => [...m, escrito !== magnitud ? `${cuenta} (escribiste ${escrito})` : `${cuenta}: ${(r.detalle ?? "procedimiento con errores").replace(/\.$/, "")}`]);
    }
    setMagnitudEscrita(escrito);
    setMensaje(null);
    setFase("signo");
  }

  function elegirSigno(id: string) {
    if (inactivo) return;
    const signoCorrecto = nuevo < 0 ? "-" : "+";
    if (id !== signoCorrecto) {
      fallar(
        iguales
          ? "Como los signos son iguales, el resultado conserva ese mismo signo."
          : "Como los signos son diferentes, el resultado lleva el signo del número que tiene el valor más grande (sin signo)."
      );
      return;
    }
    setMensaje(null);
    const linea = `${signado(acumulado)} + ${signado(efectivo)} = ${signado(nuevo)}`;
    setLineas((l) => [...l, linea]);
    setPasos((p) => [
      ...p,
      { acumulado, termino, efectivo, iguales, magnitud_escrita: magnitudEscrita, magnitud_correcta: magnitud, resultado: nuevo },
    ]);
    setAcumulado(nuevo);
    setMagnitudEscrita(null);
    if (indice + 1 < terminos.length) {
      setIndice(indice + 1);
      setFase(operacion === "resta" ? "convertir" : "caso");
    } else {
      setFase("fin");
    }
  }

  function responder() {
    if (bloqueado) return;
    onResponder({
      respuestaDada: conSigno(acumulado),
      valor: errores === 0 ? acumulado : NaN,
      pasos: {
        modo: "enteros",
        operacion,
        terminos,
        pasos: JSON.parse(JSON.stringify(pasos)) as Json,
        errores,
        requeria_marcas: true,
        uso_marcas: true,
        marcas_correctas: errores === 0,
      },
      detalle:
        errores === 0
          ? undefined
          : `Llegaste a ${conSigno(acumulado)}, pero tuviste ${errores} error${errores === 1 ? "" : "es"} en el camino, así que cuenta como incorrecto.` +
            (magnitudMal.length ? ` Cuentas mal hechas: ${magnitudMal.join("; ")}.` : ""),
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {lineas.length > 0 && (
        <ul className="flex flex-col items-center gap-0.5 font-mono text-sm text-emerald-600 dark:text-emerald-400">
          {lineas.map((l, i) => (
            <li key={i}>{l} ✓</li>
          ))}
        </ul>
      )}

      {fase !== "fin" ? (
        <>
          <p className="font-mono text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {lineaActual}
          </p>
          {terminos.length > 2 && (
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Paso {indice} de {terminos.length - 1}: se resuelve de izquierda a derecha
            </p>
          )}

          {fase === "convertir" && (
            <Opciones
              pregunta={`¿Cómo se convierte ${signado(acumulado)} − ${signado(termino)} en una suma?`}
              opciones={OPCIONES_CONVERTIR}
              deshabilitado={inactivo}
              onElegir={elegirConversion}
            />
          )}
          {fase === "caso" && (
            <>
              {operacion === "resta" && (
                <p className="font-mono text-lg text-zinc-600 dark:text-zinc-300">
                  {signado(acumulado)} + {signado(efectivo)}
                </p>
              )}
              <Opciones
                pregunta="¿Los signos son iguales o diferentes?"
                opciones={OPCIONES_CASO}
                deshabilitado={inactivo}
                onElegir={elegirCaso}
              />
            </>
          )}
          {fase === "magnitud" && (
            <>
              <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
                {iguales
                  ? `Se suman los números sin signo: ${Math.abs(acumulado)} + ${Math.abs(efectivo)}.`
                  : `Se resta el menor del mayor, sin signo: ${Math.max(Math.abs(acumulado), Math.abs(efectivo))} − ${Math.min(Math.abs(acumulado), Math.abs(efectivo))}.`}
              </p>
              <VerticalAditiva
                key={indice}
                operacion={iguales ? "suma" : "resta"}
                a={iguales ? Math.abs(acumulado) : Math.max(Math.abs(acumulado), Math.abs(efectivo))}
                b={iguales ? Math.abs(efectivo) : Math.min(Math.abs(acumulado), Math.abs(efectivo))}
                bloqueado={inactivo}
                enviando={enviando}
                onResponder={alResponderMagnitud}
              />
            </>
          )}
          {fase === "signo" && (
            <Opciones
              pregunta={`¿Qué signo lleva el resultado (${magnitud})?`}
              opciones={OPCIONES_SIGNO}
              deshabilitado={inactivo}
              onElegir={elegirSigno}
            />
          )}
        </>
      ) : (
        <>
          <p className="font-mono text-3xl font-semibold text-zinc-900 dark:text-zinc-50">= {signado(acumulado)}</p>
          {!bloqueado && <BotonResponder enviando={enviando} alClic={responder} />}
        </>
      )}

      <Mensaje texto={mensaje} />
    </div>
  );
}
