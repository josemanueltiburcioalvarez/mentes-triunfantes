"use client";

import { useState } from "react";
import type { Json } from "@/lib/supabase/database.types";
import { NO_EXISTE, type EnteroRaiz as DatosRaiz } from "@/lib/ejercicios/enteros";
import VerticalRaiz from "./vertical-raiz";
import { BotonResponder, Mensaje, Opciones, OPCIONES_SIGNO, conSigno, type Opcion } from "./entero-comun";
import type { PropsComunes, RespuestaPregunta } from "./tipos-pregunta";

const OPCIONES_EXISTE: Opcion[] = [
  { id: "si", etiqueta: "Sí, es un número entero" },
  { id: "no", etiqueta: "No existe en los números enteros" },
];

type Fase = "existe" | "raiz" | "signo" | "fin";

// Raiz con signo: ¿existe? -> raiz del numero sin signo (con comprobacion en vertical) -> signo del resultado.
export default function EnteroRaiz({
  raiz,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { raiz: DatosRaiz }) {
  const { indice, radicando, menosAfuera } = raiz;
  const magnitudRadicando = Math.abs(radicando);
  const magnitudRaiz = Math.round(magnitudRadicando ** (1 / indice));
  const existe = raiz.respuesta !== NO_EXISTE;
  const negativoFinal = existe && raiz.respuesta < 0;

  const [fase, setFase] = useState<Fase>("existe");
  const [errores, setErrores] = useState(0);
  const [raizEscrita, setRaizEscrita] = useState<number | null>(null);
  const [pasosRaiz, setPasosRaiz] = useState<unknown>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const simbolo = indice === 3 ? "∛" : "√";
  const cuerpo = radicando < 0 ? `(−${magnitudRadicando})` : String(radicando);
  const expresion = `${menosAfuera ? "−" : ""}${simbolo}${cuerpo}`;

  function fallar(texto: string) {
    setErrores((n) => n + 1);
    setMensaje(texto);
  }

  function elegirExiste(id: string) {
    if (bloqueado) return;
    if ((id === "si") !== existe) {
      fallar(
        existe
          ? indice === 3
            ? "Las raíces cúbicas sí existen para números negativos: (−2)³ = −8, por eso ∛(−8) = −2."
            : `Sí existe: ${magnitudRaiz} × ${magnitudRaiz} = ${magnitudRadicando}.`
          : "Ningún número multiplicado por sí mismo da un resultado negativo (+ por + da +, y − por − también da +), así que la raíz cuadrada de un negativo no existe en los enteros."
      );
      return;
    }
    setMensaje(null);
    setFase(existe ? "raiz" : "fin");
  }

  function alResponderRaiz(r: RespuestaPregunta) {
    if (r.valor !== magnitudRaiz) setErrores((n) => n + 1);
    setRaizEscrita(r.valor === magnitudRaiz ? magnitudRaiz : null);
    setPasosRaiz(r.pasos);
    setMensaje(null);
    setFase("signo");
  }

  function elegirSigno(id: string) {
    if (bloqueado) return;
    const correcto = negativoFinal ? "-" : "+";
    if (id !== correcto) {
      fallar(
        menosAfuera
          ? "Primero se calcula la raíz (con su signo) y después el menos de afuera cambia el signo de ese resultado."
          : indice === 3
            ? "En la raíz cúbica el resultado tiene el mismo signo que el número de adentro."
            : "La raíz cuadrada da un resultado positivo."
      );
      return;
    }
    setMensaje(null);
    setFase("fin");
  }

  function responder() {
    if (bloqueado) return;
    const bien = errores === 0;
    onResponder({
      respuestaDada: existe ? conSigno(raiz.respuesta) : "no existe en los enteros",
      valor: bien ? raiz.respuesta : NaN,
      pasos: {
        modo: "enteros",
        operacion: "raiz",
        indice,
        radicando,
        menos_afuera: menosAfuera,
        existe,
        raiz_escrita: raizEscrita,
        errores,
        comprobacion: (pasosRaiz ?? null) as Json,
        requeria_marcas: existe,
        uso_marcas: existe,
        marcas_correctas: bien,
      },
      detalle: bien
        ? undefined
        : `Llegaste al resultado, pero tuviste ${errores} error${errores === 1 ? "" : "es"} en el camino (elegir si existe, calcular la raíz o poner el signo), así que cuenta como incorrecto.`,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-mono text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{expresion}</p>

      {fase === "existe" && (
        <Opciones
          pregunta={`¿Existe ${expresion} en los números enteros?`}
          opciones={OPCIONES_EXISTE}
          deshabilitado={bloqueado}
          onElegir={elegirExiste}
        />
      )}

      {fase === "raiz" && (
        <>
          <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            Calcula primero la raíz del número sin signo.
          </p>
          <VerticalRaiz
            radicando={magnitudRadicando}
            raiz={magnitudRaiz}
            indice={indice}
            bloqueado={bloqueado}
            enviando={enviando}
            onResponder={alResponderRaiz}
          />
        </>
      )}

      {fase === "signo" && (
        <>
          <p className="font-mono text-lg text-zinc-600 dark:text-zinc-300">
            {simbolo}
            {magnitudRadicando} = {magnitudRaiz}
          </p>
          <Opciones
            pregunta={`¿Qué signo tiene el resultado de ${expresion}?`}
            opciones={OPCIONES_SIGNO}
            deshabilitado={bloqueado}
            onElegir={elegirSigno}
          />
        </>
      )}

      {fase === "fin" && (
        <>
          <p className="font-mono text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            = {existe ? conSigno(raiz.respuesta) : "no existe en los enteros"}
          </p>
          {!bloqueado && <BotonResponder enviando={enviando} alClic={responder} />}
        </>
      )}

      <Mensaje texto={mensaje} />
    </div>
  );
}
