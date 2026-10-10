"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Lock, X } from "lucide-react";
import AnilloProgreso from "@/components/anillo-progreso";
import { estiloNivel } from "@/lib/estilos-nivel";
import { ICONOS_HABILIDAD } from "@/lib/iconos-habilidad";
import type { HabilidadPracticable } from "@/lib/ejercicios/generador";

export interface NodoMapa {
  slug: string;
  nombre: string;
  dominio: number;
  desbloqueada: boolean;
  practicable: boolean;
  medalla: boolean; // examen final aprobado
  siguiente: boolean; // la habilidad que conviene practicar ahora
  textoBloqueo: string;
}

export type EstadoPortal = "aprobado" | "listo" | "bloqueado";

export interface NivelMapa {
  orden: number;
  nombre: string;
  aprobadas: number;
  total: number;
  nivelAprobado: boolean;
  abierto: boolean;
  nodos: NodoMapa[];
  portal: ReactNode | null;
  estadoPortal: EstadoPortal;
}

const ALTO_FILA = 124;
const SEPARACION_PORTAL = 28; // el portal es mas grande y su nombre del nodo anterior ocupa dos lineas
const PRIMERA_FILA = 50;
const TAMANO_NODO = 84;
const TAMANO_PORTAL = 100;

// En las imagenes (public/arte, ver scripts/procesar-arte.mjs) el disco ocupa ~88 % del lado y el resto es brillo.
const PROPORCION_DISCO = 0.88;

function ImagenArte({ src, disco, tono = "none" }: { src: string; disco: number; tono?: string }) {
  const lado = Math.round(disco / PROPORCION_DISCO);
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={lado}
      height={lado}
      unoptimized
      draggable={false}
      className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
      style={{ width: lado, height: lado, filter: tono }}
    />
  );
}

// El camino zigzaguea: centro, derecha, centro, izquierda...
const posicionX = (i: number) => 50 + 26 * Math.round(Math.sin((i * Math.PI) / 2));

const curva = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const medio = (a.y + b.y) / 2;
  return `C ${a.x} ${medio}, ${b.x} ${medio}, ${b.x} ${b.y}`;
};

export default function MapaNiveles({ niveles }: { niveles: NivelMapa[] }) {
  const [seleccion, setSeleccion] = useState<string | null>(null);

  // un toque fuera de un nodo o de su ventana (o Escape) la cierra
  useEffect(() => {
    if (!seleccion) return;
    const fuera = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest("[data-nodo], [data-ventana]")) setSeleccion(null);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSeleccion(null);
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [seleccion]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col">
      {niveles.map((nivel, indice) => (
        <div key={nivel.orden}>
          {indice > 0 && <div className="mx-auto h-8 w-0 border-l-2 border-dashed border-zinc-300 dark:border-zinc-700" />}
          <BloqueNivel nivel={nivel} seleccion={seleccion} alElegir={setSeleccion} />
        </div>
      ))}
    </div>
  );
}

function BloqueNivel({
  nivel,
  seleccion,
  alElegir,
}: {
  nivel: NivelMapa;
  seleccion: string | null;
  alElegir: (clave: string | null) => void;
}) {
  const estilo = estiloNivel(nivel.orden);
  const n = nivel.nodos.length;
  const filas = n + (nivel.portal ? 1 : 0);
  const alto = filas * ALTO_FILA + 36 + (nivel.portal ? SEPARACION_PORTAL : 0);

  const puntos = Array.from({ length: filas }, (_, i) => ({
    x: i < n ? posicionX(i) : 50,
    y: PRIMERA_FILA + i * ALTO_FILA + (i === n ? SEPARACION_PORTAL : 0),
  }));

  // tramo i -> i+1: se "ilumina" si el nodo al que llega ya esta abierto (o el portal ya se puede pedir)
  const tramoAlcanzado = (i: number) =>
    i + 1 < n ? nivel.nodos[i + 1].desbloqueada : nivel.estadoPortal !== "bloqueado";
  const dBase = puntos.length > 1 ? `M ${puntos[0].x} ${puntos[0].y} ${puntos.slice(1).map((p, i) => curva(puntos[i], p)).join(" ")}` : "";
  const dAlcanzado = puntos
    .slice(1)
    .map((p, i) => (tramoAlcanzado(i) ? `M ${puntos[i].x} ${puntos[i].y} ${curva(puntos[i], p)}` : ""))
    .join(" ");

  return (
    <section>
      <div
        className={`flex items-center justify-between rounded-2xl border px-4 py-3 backdrop-blur-sm ${
          nivel.abierto
            ? `${estilo.borde} ${estilo.fondoTarjeta} ${estilo.brillo}`
            : "border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900/40"
        }`}
      >
        <div>
          <h2 className={`text-lg font-bold ${nivel.abierto ? estilo.textoTitulo : "text-zinc-500 dark:text-zinc-400"}`}>
            {nivel.nombre}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {nivel.aprobadas}/{nivel.total} habilidades dominadas
          </p>
        </div>
        {nivel.nivelAprobado ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Check className="h-3.5 w-3.5" /> Nivel superado
          </span>
        ) : !nivel.abierto ? (
          <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Lock className="h-3.5 w-3.5" /> Bloqueado
          </span>
        ) : null}
      </div>

      <div className="relative" style={{ height: alto }}>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" aria-hidden>
          <path
            d={dBase}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="1 9"
            vectorEffect="non-scaling-stroke"
            className="text-zinc-300 dark:text-zinc-700"
          />
          {dAlcanzado && (
            <path
              d={dAlcanzado}
              fill="none"
              stroke="currentColor"
              strokeWidth={5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className={estilo.anillo}
              style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
            />
          )}
        </svg>

        {nivel.nodos.map((nodo, i) => (
          <NodoHabilidad
            key={nodo.slug}
            nodo={nodo}
            nivelOrden={nivel.orden}
            punto={puntos[i]}
            clave={`${nivel.orden}:${nodo.slug}`}
            seleccion={seleccion}
            alElegir={alElegir}
          />
        ))}

        {nivel.portal && (
          <NodoPortal
            nivel={nivel}
            punto={puntos[n]}
            alto={alto}
            clave={`${nivel.orden}:portal`}
            seleccion={seleccion}
            alElegir={alElegir}
          />
        )}
      </div>
    </section>
  );
}

function Ventana({
  punto,
  abajo = true,
  alto,
  ancho = 248,
  children,
}: {
  punto: { x: number; y: number };
  abajo?: boolean;
  alto: number;
  ancho?: number;
  children: ReactNode;
}) {
  // left: x% con translateX(-x%) mantiene la ventana dentro del mapa aunque el nodo este en un borde
  const estilo = abajo
    ? { top: punto.y + TAMANO_NODO / 2 + 42 }
    : { bottom: alto - punto.y + TAMANO_PORTAL / 2 + 8 };
  return (
    <div
      data-ventana
      role="dialog"
      className="absolute z-30 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      style={{ ...estilo, left: `${punto.x}%`, transform: `translateX(-${punto.x}%)`, width: ancho, maxWidth: "92%" }}
    >
      {children}
    </div>
  );
}

function NodoHabilidad({
  nodo,
  nivelOrden,
  punto,
  clave,
  seleccion,
  alElegir,
}: {
  nodo: NodoMapa;
  nivelOrden: number;
  punto: { x: number; y: number };
  clave: string;
  seleccion: string | null;
  alElegir: (clave: string | null) => void;
}) {
  const estilo = estiloNivel(nivelOrden);
  const Icono = ICONOS_HABILIDAD[nodo.slug as HabilidadPracticable];
  const abierta = seleccion === clave;
  const bloqueada = !nodo.desbloqueada;

  const colorAnillo = nodo.medalla ? "text-amber-400" : estilo.anillo;
  const imagen = bloqueada
    ? "/arte/medalla-bloqueada.webp"
    : nodo.medalla
      ? "/arte/medalla-dominada.webp"
      : "/arte/medalla-disponible.webp";
  // las imagenes son verdes: solo la medalla "abierta" cambia de tono segun el nivel
  const tono = bloqueada || nodo.medalla ? "none" : estilo.tono;
  const colorIcono = bloqueada ? "text-zinc-500" : nodo.medalla ? "text-amber-300" : estilo.anillo;

  return (
    <>
      <div
        data-nodo
        className="absolute"
        style={{ left: `${punto.x}%`, top: punto.y, transform: "translate(-50%, -50%)" }}
      >
        {nodo.siguiente && (
          <span className={`absolute inset-0 animate-ping rounded-full opacity-25 motion-reduce:animate-none ${estilo.barra}`} aria-hidden />
        )}
        <button
          type="button"
          onClick={() => alElegir(abierta ? null : clave)}
          aria-expanded={abierta}
          aria-label={`${nodo.nombre}: ${bloqueada ? "bloqueada" : `${nodo.dominio}% de dominio${nodo.medalla ? ", examen aprobado" : ""}`}`}
          className="relative block rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          style={{ width: TAMANO_NODO, height: TAMANO_NODO }}
        >
          <ImagenArte src={imagen} disco={TAMANO_NODO - 14} tono={tono} />
          <AnilloProgreso
            valor={nodo.medalla ? 100 : bloqueada ? 0 : nodo.dominio}
            tamano={TAMANO_NODO}
            grosor={4}
            color={colorAnillo}
            pista="text-white/10"
            etiqueta={`${nodo.nombre}: ${nodo.dominio}%`}
          >
            {bloqueada ? <Lock className={`h-5 w-5 ${colorIcono}`} /> : <Icono className={`h-7 w-7 ${colorIcono}`} />}
          </AnilloProgreso>
        </button>
      </div>

      <div
        className="pointer-events-none absolute text-center text-xs font-semibold leading-tight text-zinc-700 dark:text-zinc-200"
        style={{ left: `${punto.x}%`, top: punto.y + TAMANO_NODO / 2 + 4, transform: "translateX(-50%)", width: 108 }}
      >
        {nodo.nombre}
        {nodo.siguiente && <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Empieza aquí</div>}
      </div>

      {abierta && (
        <Ventana punto={punto} alto={0}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{nodo.nombre}</div>
              {!bloqueada && (
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {nodo.dominio}% de dominio
                  {nodo.medalla && <span className="ml-1 font-semibold text-amber-600 dark:text-amber-400">· examen aprobado</span>}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => alElegir(null)}
              aria-label="Cerrar"
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!bloqueada && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className={`h-full rounded-full ${estilo.barra}`} style={{ width: `${nodo.dominio}%` }} />
            </div>
          )}

          {bloqueada ? (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{nodo.textoBloqueo}</p>
          ) : nodo.practicable ? (
            <div className="mt-3 flex items-center gap-3">
              <Link
                href={`/practicar/${nodo.slug}`}
                className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_0_14px_-3px_rgba(16,185,129,0.6)] hover:bg-emerald-400"
              >
                Practicar
              </Link>
              <Link href={`/guia/${nodo.slug}/1`} className="text-sm text-blue-600 underline-offset-2 hover:underline dark:text-blue-400">
                Ver guía
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Próximamente.</p>
          )}
        </Ventana>
      )}
    </>
  );
}

function NodoPortal({
  nivel,
  punto,
  alto,
  clave,
  seleccion,
  alElegir,
}: {
  nivel: NivelMapa;
  punto: { x: number; y: number };
  alto: number;
  clave: string;
  seleccion: string | null;
  alElegir: (clave: string | null) => void;
}) {
  const abierta = seleccion === clave;
  const { estadoPortal } = nivel;
  const estilo = estiloNivel(nivel.orden);

  const imagen =
    estadoPortal === "aprobado"
      ? "/arte/medalla-dominada.webp"
      : estadoPortal === "listo"
        ? "/arte/portal-listo.webp"
        : "/arte/medalla-bloqueada.webp";
  const tono = estadoPortal === "listo" ? estilo.tono : "none";
  const texto =
    estadoPortal === "aprobado" ? "Nivel superado" : estadoPortal === "listo" ? "¡Evaluación lista!" : "Evaluación del nivel";

  return (
    <>
      <div
        data-nodo
        className="absolute"
        style={{ left: `${punto.x}%`, top: punto.y, transform: "translate(-50%, -50%)" }}
      >
        {estadoPortal === "listo" && (
          <span className={`absolute inset-0 animate-ping rounded-full opacity-25 motion-reduce:animate-none ${estilo.barra}`} aria-hidden />
        )}
        <button
          type="button"
          onClick={() => alElegir(abierta ? null : clave)}
          aria-expanded={abierta}
          aria-label={`${texto} (${nivel.nombre})`}
          className="relative flex items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          style={{ width: TAMANO_PORTAL, height: TAMANO_PORTAL }}
        >
          <ImagenArte src={imagen} disco={TAMANO_PORTAL - 8} tono={tono} />
          {estadoPortal === "aprobado" ? (
            <Check className="relative h-10 w-10 text-amber-300 drop-shadow" strokeWidth={3} />
          ) : estadoPortal === "bloqueado" ? (
            <Lock className="relative h-8 w-8 text-zinc-500" />
          ) : null}
        </button>
      </div>

      <div
        className={`pointer-events-none absolute text-center text-xs font-bold leading-tight ${
          estadoPortal === "bloqueado" ? "text-zinc-500 dark:text-zinc-400" : estilo.textoTitulo
        }`}
        style={{ left: "50%", top: punto.y + TAMANO_PORTAL / 2 + 6, transform: "translateX(-50%)", width: 150 }}
      >
        {texto}
      </div>

      {abierta && (
        <Ventana punto={punto} abajo={false} alto={alto} ancho={288}>
          <div className="mb-1 flex justify-end">
            <button
              type="button"
              onClick={() => alElegir(null)}
              aria-label="Cerrar"
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {nivel.portal}
        </Ventana>
      )}
    </>
  );
}
