"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/components/formulario-accion";

export async function solicitarEvaluacionNivel(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const nivelId = String(formData.get("nivel_id") ?? "");
  if (!nivelId) return { error: "Nivel no válido." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  // RLS exige haber aprobado el examen final de todas las habilidades del nivel
  // y que no haya otra solicitud abierta.
  const { error } = await supabase.from("autorizaciones_examen").insert({ estudiante_id: user.id, nivel_id: nivelId });

  revalidatePath("/dashboard");
  if (error) {
    return {
      error:
        "No se pudo enviar la solicitud. Revisa que hayas aprobado el examen de todas las habilidades del nivel y que no tengas otra solicitud abierta.",
    };
  }
  return null;
}
