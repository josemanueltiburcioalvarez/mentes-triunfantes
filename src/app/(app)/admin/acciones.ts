"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/components/formulario-accion";
import { registrarAccion } from "@/lib/admin-log";

function esUrlHttps(valor: string): boolean {
  try {
    return new URL(valor).protocol === "https:";
  } catch {
    return false;
  }
}

// El RLS de autorizaciones_examen ya limita estos UPDATE a rol admin; aqui solo se valida la entrada.
export async function autorizarExamen(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const id = String(formData.get("id") ?? "");
  const meetUrl = String(formData.get("meet_url") ?? "").trim();
  if (!id) return { error: "Solicitud no válida." };
  if (!esUrlHttps(meetUrl)) return { error: "El enlace de Meet debe empezar con https://" };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data, error } = await supabase
    .from("autorizaciones_examen")
    .update({
      estado: "autorizado",
      meet_url: meetUrl,
      autorizado_por: user.id,
      autorizado_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("estado", "solicitado")
    .select("id, estudiante_id, habilidad_id, nivel_id");

  revalidatePath("/admin");
  if (error || !data || data.length === 0) {
    return { error: "No se pudo autorizar: la solicitud ya no está pendiente o no tienes permiso." };
  }
  await registrarAccion(supabase, user.id, "autorizar_examen", data[0].estudiante_id, {
    habilidad_id: data[0].habilidad_id,
    nivel_id: data[0].nivel_id,
    meet_url: meetUrl,
  });
  return null;
}

export async function cancelarAutorizacion(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Solicitud no válida." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data, error } = await supabase
    .from("autorizaciones_examen")
    .update({ estado: "cancelado" })
    .eq("id", id)
    .in("estado", ["solicitado", "autorizado"])
    .select("id, estudiante_id, habilidad_id, nivel_id");

  revalidatePath("/admin");
  if (error || !data || data.length === 0) {
    return { error: "No se pudo cancelar: la solicitud ya no está abierta o no tienes permiso." };
  }
  await registrarAccion(supabase, user.id, "cancelar_autorizacion", data[0].estudiante_id, {
    habilidad_id: data[0].habilidad_id,
    nivel_id: data[0].nivel_id,
  });
  return null;
}
