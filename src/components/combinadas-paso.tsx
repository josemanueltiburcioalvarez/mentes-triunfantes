"use client";

import { useState } from "react";
import { aplicar, aTexto, candidatas, superindice, type Reduccion, type Token } from "@/lib/ejercicios/combinadas";
import { BOTON_RESPONDER, soloDigitos, type PropsComunes } from "./tipos-pregunta";

interface PasoHecho {
  operacion: string;
  resultado: number;
}

// Operaciones combinadas paso a paso: el estudiante elige que operacion se resuelve primero
// (respetando la jerarquia) y escribe su resultado; la linea se reescribe sola.
export default function CombinadasPaso({
  expresion,
  bloqueado,
  enviando,
  onResponder,
}: PropsComunes & { expresion: Token[] }) {
  const [tokens, setTokens] = useState<Token[]>(expresion);
  const [lineas, setLineas] = useState<string[]>([]);
  const [pendiente, setPendiente] = useState<Reduccion | null>(null);
  const [entrada, setEntrada] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [erroresOrden, setErroresOrden] = useState(0);
  const [erroresCuenta, setErroresCuenta] = useState(0);
  const [historia, setHistoria] = useState<PasoHecho[]>([]);

  const terminado = tokens.length === 1 && tokens[0].t === "num";
  const final = terminado ? (tokens[0] as { t: "num"; v: number }).v : null;
  const inactivo = bloqueado || terminado;

  function alHacerClic(indice: number) {
    if (inactivo) return;
    const candidata = candidatas(tokens).find((c) => c.indiceClic === indice);
    if (!candidata) {
      setErroresOrden((n) => n + 1);
      setPendiente(null);
      const abiertos = tokens.slice(0, indice).filter((k) => k.t === "lp").length;
      const cerrados = tokens.slice(0, indice).filter((k) => k.t === "rp").length;
      setMensaje(
        tokens.some((k) => k.t === "lp") && abiertos === cerrados
          ? "Primero se resuelve lo que está entre paréntesis."
          : "Todavía no puedes hacer esa operación: primero resuelve lo que va antes (paréntesis, potencias o raíces, y multiplicaciones o divisiones)."
      );
      return;
    }
    if (!candidata.permitida) {
      setErroresOrden((n) => n + 1);
      setPendiente(null);
      setMensaje(candidata.motivo ?? "Esa operación no va ahora.");
      return;
    }
    setPendiente(candidata);
    setEntrada("");
    setMensaje(null);
  }

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!pendiente || entrada === "" || inactivo) return;
    if (Number(entrada) !== pendiente.valor) {
      setErroresCuenta((n) => n + 1);
      setMensaje(`${pendiente.operacion} no da ${entrada}. Revisa la cuenta.`);
      return;
    }
    const nuevos = aplicar(tokens, pendiente);
    setHistoria((h) => [...h, { operacion: pendiente.operacion, resultado: pendiente.valor }]);
    setLineas((l) => [...l, aTexto(nuevos)]);
    setTokens(nuevos);
    setPendiente(null);
    setEntrada("");
    setMensaje(null);
  }

  function responder() {
    if (final === null || bloqueado) return;
    const errores = erroresOrden + erroresCuenta;
    onResponder({
      respuestaDada: String(final),
      valor: errores === 0 ? final : -1,
      pasos: {
        modo: "combinadas",
        expresion: aTexto(expresion),
        historia: historia.map((h) => ({ operacion: h.operacion, resultado: h.resultado })),
        errores_orden: erroresOrden,
        errores_cuenta: erroresCuenta,
        requeria_marcas: true,
        uso_marcas: true,
        marcas_correctas: errores === 0,
      },
      detalle:
        errores === 0
          ? undefined
          : `Llegaste al resultado ${final}, pero cometiste ${errores} error${errores === 1 ? "" : "es"} en el camino ` +
            `(${erroresOrden} de orden y ${erroresCuenta} de cuentas), así que cuenta como incorrecto.`,
    });
  }

  const enRango = (i: number) => pendiente !== null && i >= pendiente.desde && i <= pendiente.hasta;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        Toca el signo de la operación que se resuelve <strong>primero</strong> y escribe su resultado.
      </p>

      {lineas.length > 0 && (
        <div className="flex flex-col items-center gap-1 font-mono text-2xl text-zinc-400 dark:text-zinc-500">
          {[aTexto(expresion), ...lineas.slice(0, -1)].map((l, i) => (
            <div key={i}>
              {i > 0 ? "= " : ""}
              {l}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-1 font-mono text-3xl text-zinc-900 dark:text-zinc-50">
        {lineas.length > 0 && <span className="text-zinc-400">=</span>}
        {tokens.map((k, i) => {
          const resaltado = enRango(i) ? "rounded-md bg-blue-500/25 ring-2 ring-blue-500" : "";
          if (k.t === "num")
            return (
              <span key={i} className={`px-0.5 ${resaltado}`}>
                {k.v}
              </span>
            );
          if (k.t === "lp" || k.t === "rp")
            return (
              <span key={i} className="px-0.5 text-zinc-500">
                {k.t === "lp" ? "(" : ")"}
              </span>
            );
          const etiqueta = k.t === "op" ? k.v : k.t === "pow" ? superindice(k.e) : "√";
          return (
            <button
              key={i}
              type="button"
              disabled={inactivo}
              onClick={() => alHacerClic(i)}
              aria-label={`Operación ${etiqueta}`}
              className={`mx-0.5 rounded-md border border-zinc-300 px-2 py-0.5 hover:bg-blue-500/15 disabled:opacity-60 dark:border-zinc-600 ${resaltado}`}
            >
              {etiqueta}
            </button>
          );
        })}
      </div>

      {pendiente && !inactivo && (
        <form onSubmit={confirmar} className="flex items-center gap-2">
          <span className="font-mono text-xl text-zinc-700 dark:text-zinc-200">{pendiente.operacion} =</span>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={entrada}
            onChange={(e) => setEntrada(soloDigitos(e.target.value, 7))}
            aria-label="Resultado de la operación"
            className="h-11 w-24 rounded-lg border border-zinc-300 px-2 text-center font-mono text-xl outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button type="submit" disabled={entrada === ""} className={BOTON_RESPONDER}>
            OK
          </button>
        </form>
      )}

      {mensaje && <p className="max-w-xs text-sm text-red-600">{mensaje}</p>}

      {terminado && !bloqueado && (
        <button type="button" onClick={responder} disabled={enviando} className={BOTON_RESPONDER}>
          Responder
        </button>
      )}
    </div>
  );
}
