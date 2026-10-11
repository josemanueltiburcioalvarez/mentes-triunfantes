import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearSoloFecha } from "@/lib/admin";
import FormularioAccion from "@/components/formulario-accion";
import FormRegistrarPago from "@/components/admin/form-registrar-pago";
import { hoyLima } from "@/lib/logros";
import { DIAS_PRUEBA, METODO_PRUEBA } from "@/lib/planes";
import { cancelarSuscripcion, darPruebaGratis } from "./acciones";

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  activa: { texto: "Activa", clase: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  vencida: { texto: "Vencida", clase: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
  cancelada: { texto: "Cancelada", clase: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  sin_pagos: { texto: "Sin pagos", clase: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

const ORDEN_ESTADO: Record<string, number> = { vencida: 0, sin_pagos: 1, activa: 2, cancelada: 3 };

const hoy = hoyLima;
const ETIQUETA_PRUEBA = { texto: "Prueba gratuita", clase: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" };

export default async function SuscripcionesPage() {
  const supabase = await crearClienteServidor();
  const [ingresos, suscripciones, pruebas] = await Promise.all([
    supabase.from("vista_ingresos").select("*").maybeSingle(),
    supabase.from("vista_suscripciones_admin").select("*"),
    supabase.from("suscripciones").select("estudiante_id").eq("metodo_pago", METODO_PRUEBA),
  ]);
  // quienes ya usaron su prueba gratuita (solo se da una vez)
  const yaUsaronPrueba = new Set((pruebas.data ?? []).map((p) => p.estudiante_id));

  const filas = (suscripciones.data ?? [])
    .slice()
    .sort((a, b) => (ORDEN_ESTADO[a.estado_actual ?? ""] ?? 9) - (ORDEN_ESTADO[b.estado_actual ?? ""] ?? 9) || (a.nombre ?? "").localeCompare(b.nombre ?? ""));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Suscripciones</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No hay pasarela de pago: registra aquí cada cobro (efectivo, Yape/Plin o transferencia) después de recibirlo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cifra titulo="Activas" valor={String(ingresos.data?.activas ?? 0)} />
        <Cifra
          titulo="Vencidas"
          valor={String(ingresos.data?.vencidas ?? 0)}
          color={(ingresos.data?.vencidas ?? 0) > 0 ? "text-red-600 dark:text-red-400" : undefined}
        />
        <Cifra
          titulo="Por vencer en 7 días"
          valor={String(ingresos.data?.por_vencer_7_dias ?? 0)}
          color={(ingresos.data?.por_vencer_7_dias ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : undefined}
        />
        <Cifra titulo="Ingreso del mes (activas)" valor={`S/ ${Number(ingresos.data?.ingreso_mensual_total ?? 0).toFixed(2)}`} />
      </div>

      {filas.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          No hay estudiantes registrados.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filas.map((s) => {
            const esPrueba = s.metodo_pago === METODO_PRUEBA;
            const estado =
              esPrueba && s.estado_actual === "activa"
                ? ETIQUETA_PRUEBA
                : (ETIQUETA_ESTADO[s.estado_actual ?? "sin_pagos"] ?? ETIQUETA_ESTADO.sin_pagos);
            const puedeDarPrueba = s.estado_actual !== "activa" && !yaUsaronPrueba.has(s.estudiante_id ?? "");
            const siguienteInicio = s.fecha_fin && s.fecha_fin > hoy() ? s.fecha_fin : hoy();
            return (
              <li key={s.estudiante_id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link href={`/admin/estudiantes/${s.estudiante_id}`} className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50">
                      {s.nombre}
                    </Link>
                    <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">{s.email ?? "sin correo"}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}>{estado.texto}</span>
                </div>

                {s.suscripcion_id && (
                  <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatearSoloFecha(s.fecha_inicio)} a {formatearSoloFecha(s.fecha_fin)}
                    {s.estado_actual === "activa" && typeof s.dias_restantes === "number" && ` · ${s.dias_restantes} día${s.dias_restantes === 1 ? "" : "s"} restantes`}
                    {esPrueba
                      ? " · Prueba gratuita"
                      : ` · S/ ${Number(s.monto).toFixed(2)} · ${s.metodo_pago}${s.referencia_pago ? ` (${s.referencia_pago})` : ""}`}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {puedeDarPrueba && (
                    <FormularioAccion accion={darPruebaGratis}>
                      <input type="hidden" name="estudiante_id" value={s.estudiante_id ?? ""} />
                      <button
                        type="submit"
                        className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40"
                      >
                        Dar {DIAS_PRUEBA} días de prueba
                      </button>
                    </FormularioAccion>
                  )}
                  <FormRegistrarPago estudianteId={s.estudiante_id ?? ""} siguienteInicio={siguienteInicio} />
                  {s.estado_actual === "activa" && s.suscripcion_id && (
                    <FormularioAccion accion={cancelarSuscripcion}>
                      <input type="hidden" name="id" value={s.suscripcion_id} />
                      <input type="hidden" name="estudiante_id" value={s.estudiante_id ?? ""} />
                      <button type="submit" className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
                        Cancelar suscripción
                      </button>
                    </FormularioAccion>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Cifra({ titulo, valor, color }: { titulo: string; valor: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`text-3xl font-semibold ${color ?? "text-zinc-900 dark:text-zinc-50"}`}>{valor}</div>
      <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{titulo}</div>
    </div>
  );
}
