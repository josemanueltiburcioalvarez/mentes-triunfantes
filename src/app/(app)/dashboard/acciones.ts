"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function solicitarEvaluacionNivel(formData: FormData) {
  const nivelId = String(formData.get("nivel_id") ?? "");
  if (!nivelId) return;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS exige haber aprobado el examen final de todas las habilidades del nivel
  // y que no haya otra solicitud abierta.
  await supabase.from("autorizaciones_examen").insert({ estudiante_id: user.id, nivel_id: nivelId });

  revalidatePath("/dashboard");
}
