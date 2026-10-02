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

// Validacion compartida por el onboarding y la edicion de perfil posterior.
function validarDatosPerfil(formData: FormData): { nombre: string; edad: number; gradoEscolar: string } | { error: string } {
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 100);
  const edad = Number(formData.get("edad") ?? "");
  const gradoEscolar = String(formData.get("grado_escolar") ?? "");

  if (!nombre) return { error: "Escribe el nombre del estudiante." };
  if (!Number.isInteger(edad) || edad < 3 || edad > 25) return { error: "Escribe una edad válida." };
  if (!esGradoEscolarValido(gradoEscolar)) return { error: "Elige el año escolar." };

  return { nombre, edad, gradoEscolar };
}

// Primer paso del onboarding: nombre del estudiante, edad y año escolar (de ahi se deduce la
// modalidad). Se pide aqui y no en el registro porque a veces el correo lo crea el papa/mama.
export async function completarPerfil(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const datos = validarDatosPerfil(formData);
  if ("error" in datos) return datos;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { error } = await supabase
    .from("perfiles")
    .update({ nombre: datos.nombre, edad: datos.edad, grado_escolar: datos.gradoEscolar })
    .eq("id", user.id);
  if (error) return { error: "No se pudo guardar tu perfil. Intenta de nuevo." };

  revalidatePath("/", "layout");
  return null;
}

// Edicion de perfil para un estudiante que ya completo el onboarding: puede corregir su nombre,
// edad o año escolar despues (a veces el papa/mama se equivoca al registrarlo). Si el año escolar
// nuevo cambia de modalidad, el trigger de la base de datos actualiza "modalidad" solo; el estudiante
// arranca esa nueva modalidad desde su primera habilidad, igual que si hubiera sacado menos de 11
// puntos en el examen de ubicacion (no hace falta rendirlo de nuevo).
export async function actualizarPerfil(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const datos = validarDatosPerfil(formData);
  if ("error" in datos) return datos;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { error } = await supabase
    .from("perfiles")
    .update({ nombre: datos.nombre, edad: datos.edad, grado_escolar: datos.gradoEscolar })
    .eq("id", user.id);
  if (error) return { error: "No se pudo guardar los cambios. Intenta de nuevo." };

  revalidatePath("/", "layout");
  return { ok: "Perfil actualizado." };
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
