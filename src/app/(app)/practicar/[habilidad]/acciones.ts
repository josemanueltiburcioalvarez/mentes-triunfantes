"use server";

import { revalidatePath } from "next/cache";
import { esHabilidadPracticable } from "@/lib/ejercicios/generador";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/components/formulario-accion";

export async function solicitarExamen(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const habilidad = String(formData.get("habilidad") ?? "");
  if (!esHabilidadPracticable(habilidad)) return { error: "Habilidad no válida." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data: habilidadFila } = await supabase
    .from("habilidades")
    .select("id")
    .eq("nombre", habilidad)
    .single();
  if (!habilidadFila) return { error: "No se encontró la habilidad." };

  // RLS exige haber aprobado los 15 sets y que no haya otra solicitud abierta.
  const { error } = await supabase
    .from("autorizaciones_examen")
    .insert({ estudiante_id: user.id, habilidad_id: habilidadFila.id });

  revalidatePath(`/practicar/${habilidad}`);
  if (error) {
    return {
      error:
        "No se pudo enviar la solicitud. Revisa que hayas aprobado los 15 ejercicios y que no tengas otra solicitud abierta.",
    };
  }
  return null;
}
