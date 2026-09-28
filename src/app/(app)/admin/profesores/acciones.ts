"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/components/formulario-accion";
import { registrarAccion } from "@/lib/admin-log";

// Vuelve profesora a una cuenta que ya se registro (queda como estudiante hasta que un admin la
// promueve; el RLS solo deja cambiar el rol a un admin).
export async function promoverProfesor(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Escribe un correo." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data: candidato } = await supabase.from("perfiles").select("id, rol").ilike("email", email).maybeSingle();
  if (!candidato) return { error: "No se encontró ninguna cuenta con ese correo. Debe registrarse primero en /login." };
  if (candidato.rol === "admin") return { error: "Esa cuenta ya es administradora." };
  if (candidato.rol === "profesor") return { error: "Esa cuenta ya es profesora." };

  const { data, error } = await supabase
    .from("perfiles")
    .update({ rol: "profesor" })
    .eq("id", candidato.id)
    .eq("rol", "estudiante")
    .select("id");

  if (error || !data || data.length === 0) return { error: "No se pudo cambiar el rol." };
  await registrarAccion(supabase, user.id, "promover_profesor", candidato.id, { email });
  revalidatePath("/admin/profesores");
  return null;
}

// Le quita el rol de profesor. Primero se desactivan todas sus asignaciones: si mas adelante vuelve
// a ser estudiante, no debe conservar acceso a datos de otros estudiantes.
export async function quitarProfesor(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  await supabase.from("profesor_estudiante").update({ activo: false }).eq("profesor_id", id);

  const { data, error } = await supabase.from("perfiles").update({ rol: "estudiante" }).eq("id", id).eq("rol", "profesor").select("id");
  if (error || !data || data.length === 0) return { error: "No se pudo quitar el rol de profesor." };

  await registrarAccion(supabase, user.id, "quitar_profesor", id, {});
  revalidatePath("/admin/profesores");
  revalidatePath("/admin/estudiantes");
  return null;
}

export async function asignarEstudiante(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const profesorId = String(formData.get("profesor_id") ?? "");
  const estudianteId = String(formData.get("estudiante_id") ?? "");
  if (!profesorId || !estudianteId) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data, error } = await supabase
    .from("profesor_estudiante")
    .upsert({ profesor_id: profesorId, estudiante_id: estudianteId, activo: true }, { onConflict: "profesor_id,estudiante_id" })
    .select("id");

  revalidatePath(`/admin/profesores/${profesorId}`);
  if (error || !data || data.length === 0) return { error: "No se pudo asignar el estudiante." };
  await registrarAccion(supabase, user.id, "asignar_estudiante", estudianteId, { profesor_id: profesorId });
  return null;
}

export async function quitarEstudiante(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const profesorId = String(formData.get("profesor_id") ?? "");
  const estudianteId = String(formData.get("estudiante_id") ?? "");
  if (!profesorId || !estudianteId) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data, error } = await supabase
    .from("profesor_estudiante")
    .update({ activo: false })
    .eq("profesor_id", profesorId)
    .eq("estudiante_id", estudianteId)
    .select("id");

  revalidatePath(`/admin/profesores/${profesorId}`);
  if (error || !data || data.length === 0) return { error: "No se pudo quitar el estudiante." };
  await registrarAccion(supabase, user.id, "desasignar_estudiante", estudianteId, { profesor_id: profesorId });
  return null;
}
