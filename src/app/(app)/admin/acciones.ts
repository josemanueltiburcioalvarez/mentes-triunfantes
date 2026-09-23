"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

function esUrlHttps(valor: string): boolean {
  try {
    return new URL(valor).protocol === "https:";
  } catch {
    return false;
  }
}

// El RLS de autorizaciones_examen ya limita estos UPDATE a rol admin; aqui solo se valida la entrada.
export async function autorizarExamen(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const meetUrl = String(formData.get("meet_url") ?? "").trim();
  if (!id || !esUrlHttps(meetUrl)) return;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("autorizaciones_examen")
    .update({
      estado: "autorizado",
      meet_url: meetUrl,
      autorizado_por: user.id,
      autorizado_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("estado", "solicitado");

  revalidatePath("/admin");
}

export async function cancelarAutorizacion(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await crearClienteServidor();
  await supabase
    .from("autorizaciones_examen")
    .update({ estado: "cancelado" })
    .eq("id", id)
    .in("estado", ["solicitado", "autorizado"]);

  revalidatePath("/admin");
}
