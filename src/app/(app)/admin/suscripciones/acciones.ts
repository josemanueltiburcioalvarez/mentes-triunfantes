"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/components/formulario-accion";
import { registrarAccion } from "@/lib/admin-log";

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;
const METODOS_PAGO = ["Efectivo", "Yape/Plin", "Transferencia", "Otro"] as const;
const DURACIONES = [1, 3, 6, 12] as const;

// Suma meses de calendario a una fecha (no dias fijos, para que "1 mes" caiga siempre el mismo dia).
function sumarMeses(fechaIso: string, meses: number): string {
  const [y, m, d] = fechaIso.split("-").map(Number);
  const fin = new Date(Date.UTC(y, m - 1 + meses, d));
  return fin.toISOString().slice(0, 10);
}

// Registra un pago (efectivo, Yape/Plin, transferencia...) como una nueva suscripcion. No hay pasarela
// de pago: el administrador lo anota a mano despues de cobrar.
export async function registrarPago(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const estudianteId = String(formData.get("estudiante_id") ?? "");
  const fechaInicio = String(formData.get("fecha_inicio") ?? "");
  const meses = Number(formData.get("meses") ?? "");
  const monto = Number(formData.get("monto") ?? "");
  const metodoPago = String(formData.get("metodo_pago") ?? "");
  const referenciaPago = String(formData.get("referencia_pago") ?? "").trim().slice(0, 200);

  if (!estudianteId || !FECHA_VALIDA.test(fechaInicio)) return { error: "Fecha de inicio no válida." };
  if (!DURACIONES.includes(meses as (typeof DURACIONES)[number])) return { error: "Duración no válida." };
  if (!Number.isFinite(monto) || monto <= 0 || monto > 10000) return { error: "El monto no es válido." };
  if (!METODOS_PAGO.includes(metodoPago as (typeof METODOS_PAGO)[number])) return { error: "Elige un método de pago." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const fechaFin = sumarMeses(fechaInicio, meses);
  const { data, error } = await supabase
    .from("suscripciones")
    .insert({
      estudiante_id: estudianteId,
      estado: "activa",
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      monto,
      metodo_pago: metodoPago,
      referencia_pago: referenciaPago || null,
    })
    .select("id");

  if (error || !data || data.length === 0) return { error: "No se pudo registrar el pago." };
  await registrarAccion(supabase, user.id, "registrar_pago", estudianteId, {
    meses,
    monto,
    metodo_pago: metodoPago,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
  });
  revalidatePath("/admin/suscripciones");
  return null;
}

export async function cancelarSuscripcion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const id = String(formData.get("id") ?? "");
  const estudianteId = String(formData.get("estudiante_id") ?? "");
  if (!id) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data, error } = await supabase.from("suscripciones").update({ estado: "cancelada" }).eq("id", id).select("id");
  if (error || !data || data.length === 0) return { error: "No se pudo cancelar la suscripción." };
  await registrarAccion(supabase, user.id, "cancelar_suscripcion", estudianteId || null, {});
  revalidatePath("/admin/suscripciones");
  return null;
}
