"use server";

import { revalidatePath } from "next/cache";
import { esHabilidadPracticable } from "@/lib/ejercicios/generador";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function solicitarExamen(formData: FormData) {
  const habilidad = String(formData.get("habilidad") ?? "");
  if (!esHabilidadPracticable(habilidad)) return;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: habilidadFila } = await supabase
    .from("habilidades")
    .select("id")
    .eq("nombre", habilidad)
    .single();
  if (!habilidadFila) return;

  // RLS exige haber aprobado los 15 sets y que no haya otra solicitud abierta.
  await supabase
    .from("autorizaciones_examen")
    .insert({ estudiante_id: user.id, habilidad_id: habilidadFila.id });

  revalidatePath(`/practicar/${habilidad}`);
}
