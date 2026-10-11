import Link from "next/link";
import { MessageCircle, Smartphone } from "lucide-react";
import { formatearSoloFecha } from "@/lib/admin";
import { ahorroDelPlan, DATOS_PAGO, enlaceWhatsApp, PLANES, PRECIO_MENSUAL, textoMeses } from "@/lib/planes";
import type { AccesoEstudiante } from "@/lib/suscripcion";

type SinAcceso = Extract<AccesoEstudiante, { permitido: false }>;

const TITULOS: Record<SinAcceso["estado"], string> = {
  sin_pagos: "Activa tu plan para practicar",
  vencida: "Tu plan venció",
  cancelada: "Tu plan fue cancelado",
};

// Se muestra en lugar de la practica, las guias y los examenes cuando el estudiante no tiene un plan activo.
export default function PantallaPlanes({ acceso }: { acceso: SinAcceso }) {
  const titulo = acceso.estado === "vencida" && acceso.eraPrueba ? "Tu prueba gratuita terminó" : TITULOS[acceso.estado];
  const subtitulo =
    acceso.estado === "vencida" && acceso.fechaFin
      ? `${acceso.eraPrueba ? "Terminó" : "Venció"} el ${formatearSoloFecha(acceso.fechaFin)}. ${
          acceso.eraPrueba ? "Elige un plan para seguir practicando y viendo las guías." : "Renueva para seguir practicando y viendo las guías."
        }`
      : acceso.estado === "cancelada"
        ? "Elige un plan para volver a practicar y ver las guías."
        : "Con tu plan practicas todas las habilidades, ves las guías paso a paso y rindes tus evaluaciones en vivo con un profesor.";

  return (
    <div className="fondo-estudiante relative flex-1 overflow-x-clip">
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl dark:text-zinc-50">{titulo}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">{subtitulo}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PLANES.map((plan) => {
            const ahorro = ahorroDelPlan(plan);
            const destacado = plan.meses === 12;
            return (
              <div
                key={plan.meses}
                className={`relative flex flex-col rounded-2xl border p-4 backdrop-blur-sm ${
                  destacado
                    ? "border-emerald-400 bg-emerald-50/80 shadow-[0_0_26px_-10px_rgba(16,185,129,0.6)] dark:border-emerald-700 dark:bg-emerald-950/40"
                    : "border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/60"
                }`}
              >
                {destacado && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Mejor precio
                  </span>
                )}
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{textoMeses(plan.meses)}</div>
                <div className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">S/ {plan.precio}</div>
                <div className="mt-1 min-h-8 text-xs text-zinc-500 dark:text-zinc-400">
                  {plan.meses === 1 ? (
                    "Sin compromiso"
                  ) : (
                    <>
                      S/ {(plan.precio / plan.meses).toFixed(1).replace(".0", "")} al mes ·{" "}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">ahorras S/ {ahorro}</span>
                    </>
                  )}
                </div>
                <a
                  href={enlaceWhatsApp(plan, acceso.nombre, acceso.email)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Ya pagué este plan
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white/80 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">Cómo activar tu plan</h2>
          <ol className="flex flex-col gap-4 text-sm text-zinc-700 dark:text-zinc-300">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                1
              </span>
              <span>
                Elige tu plan y paga por <strong>{DATOS_PAGO.metodo}</strong> al número{" "}
                <strong className="inline-flex items-center gap-1 whitespace-nowrap">
                  <Smartphone className="h-3.5 w-3.5" />
                  {DATOS_PAGO.numero}
                </strong>{" "}
                a nombre de <strong>{DATOS_PAGO.titular}</strong>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                2
              </span>
              <span>
                Pulsa «Ya pagué este plan» y envía la captura del pago por WhatsApp (el mensaje ya sale escrito con tu nombre).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                3
              </span>
              <span>
                Cuando confirmemos tu pago, tu plan se activa y puedes practicar y ver las guías. Si ya pagaste, vuelve a
                entrar o recarga la página.
              </span>
            </li>
          </ol>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
            <a
              href={enlaceWhatsApp(null, acceso.nombre, acceso.email)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              ¿Dudas? Escríbenos por WhatsApp
            </a>
            <Link href="/dashboard" className="text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
              ← Volver al panel
            </Link>
          </div>
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            Precio mensual S/ {PRECIO_MENSUAL}. Pagando 3, 6 o 12 meses por adelantado ahorras.
          </p>
        </div>
      </div>
    </div>
  );
}
