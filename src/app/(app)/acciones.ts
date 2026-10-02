"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esGradoEscolarValido } from "@/lib/grados";
import type { EstadoAccion } from "@/components/formulario-accion";

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}

// Primer paso del onboarding: nombre del estudiante, edad y año escolar (de ahi se deduce la
// modalidad). Se pide aqui y no en el registro porque a veces el correo lo crea el papa/mama.
export async function completarPerfil(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 100);
  const edad = Number(formData.get("edad") ?? "");
  const gradoEscolar = String(formData.get("grado_escolar") ?? "");

  if (!nombre) return { error: "Escribe el nombre del estudiante." };
  if (!Number.isInteger(edad) || edad < 3 || edad > 25) return { error: "Escribe una edad válida." };
  if (!esGradoEscolarValido(gradoEscolar)) return { error: "Elige el año escolar." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { error } = await supabase
    .from("perfiles")
    .update({ nombre, edad, grado_escolar: gradoEscolar })
    .eq("id", user.id);
  if (error) return { error: "No se pudo guardar tu perfil. Intenta de nuevo." };

  revalidatePath("/", "layout");
  return null;
}

// Segundo paso: aplica el resultado del examen de ubicacion (desbloquea el punto de partida segun
// el puntaje). La funcion de base de datos valida todo e impide rendirlo dos veces.
export async function registrarExamenUbicacion(
  puntaje: number
): Promise<{ error?: string; nivelNombre?: string }> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("aplicar_examen_ubicacion", { p_puntaje: puntaje });
  if (error || !data || data.length === 0) {
    return { error: "No se pudo registrar el resultado del examen. Intenta de nuevo." };
  }
  revalidatePath("/", "layout");
  return { nivelNombre: data[0].nivel_nombre };
}
