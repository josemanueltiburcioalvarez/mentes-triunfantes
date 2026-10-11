"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/components/formulario-accion";
import { registrarAccion } from "@/lib/admin-log";

const ESTADOS = ["activo", "inactivo", "suspendido"] as const;
type Estado = (typeof ESTADOS)[number];

// El RLS ya limita estos cambios al rol admin; aqui solo se valida la entrada.
export async function cambiarEstadoEstudiante(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "") as Estado;
  if (!id || !ESTADOS.includes(estado)) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data, error } = await supabase
    .from("perfiles")
    .update({ estado })
    .eq("id", id)
    .eq("rol", "estudiante")
    .select("id");

  revalidatePath(`/admin/estudiantes/${id}`);
  revalidatePath("/admin/estudiantes");
  if (error || !data || data.length === 0) return { error: "No se pudo cambiar el estado." };
  await registrarAccion(supabase, user.id, "cambiar_estado", id, { estado });
  return null;
}

// Abre un nivel completo (todas sus habilidades y el primer ejercicio de cada una) o, sin "nivel_id", todos los
// niveles de la modalidad del estudiante. No toca lo que el estudiante ya avanzo: solo cambia bloqueado -> abierto.
export async function abrirNiveles(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const estudianteId = String(formData.get("estudiante_id") ?? "");
  const nivelId = String(formData.get("nivel_id") ?? "");
  if (!estudianteId) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data: estudiante } = await supabase
    .from("perfiles")
    .select("modalidad")
    .eq("id", estudianteId)
    .eq("rol", "estudiante")
    .maybeSingle();
  if (!estudiante) return { error: "No se encontró al estudiante." };

  // Solo niveles de su modalidad: cada estudiante tiene progreso en las dos, pero solo una es la suya.
  let consultaNiveles = supabase.from("niveles").select("id");
  if (estudiante.modalidad) consultaNiveles = consultaNiveles.eq("modalidad", estudiante.modalidad);
  if (nivelId) consultaNiveles = consultaNiveles.eq("id", nivelId);
  const { data: niveles } = await consultaNiveles;
  if (!niveles || niveles.length === 0) return { error: "No se encontró el nivel." };

  const { data: habilidades } = await supabase
    .from("habilidades")
    .select("id")
    .in(
      "nivel_id",
      niveles.map((n) => n.id)
    );
  const habilidadIds = (habilidades ?? []).map((h) => h.id);
  if (habilidadIds.length === 0) return { error: "Ese nivel no tiene habilidades." };

  const { error } = await supabase
    .from("progreso_habilidad")
    .update({ desbloqueada: true })
    .eq("estudiante_id", estudianteId)
    .in("habilidad_id", habilidadIds);
  if (error) return { error: "No se pudo abrir el nivel." };

  const { error: errorEjercicios } = await supabase
    .from("progreso_ejercicio")
    .update({ desbloqueado: true })
    .eq("estudiante_id", estudianteId)
    .in("habilidad_id", habilidadIds)
    .eq("digito", 1)
    .eq("numero_ejercicio", 1);

  revalidatePath(`/admin/estudiantes/${estudianteId}`);
  await registrarAccion(supabase, user.id, "abrir_nivel", estudianteId, {
    nivel_id: nivelId || "todos",
    habilidades: habilidadIds.length,
  });
  if (errorEjercicios) return { error: "Se abrieron las habilidades, pero no todos sus primeros ejercicios." };
  return null;
}

// Abre una habilidad y su primer ejercicio (dígito 1, ejercicio 1) sin que el estudiante tenga que aprobar la anterior.
export async function abrirHabilidad(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const estudianteId = String(formData.get("estudiante_id") ?? "");
  const habilidadId = String(formData.get("habilidad_id") ?? "");
  if (!estudianteId || !habilidadId) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data, error } = await supabase
    .from("progreso_habilidad")
    .update({ desbloqueada: true })
    .eq("estudiante_id", estudianteId)
    .eq("habilidad_id", habilidadId)
    .select("habilidad_id");
  if (error || !data || data.length === 0) return { error: "No se pudo abrir la habilidad." };

  const { error: errorSet } = await supabase
    .from("progreso_ejercicio")
    .update({ desbloqueado: true })
    .eq("estudiante_id", estudianteId)
    .eq("habilidad_id", habilidadId)
    .eq("digito", 1)
    .eq("numero_ejercicio", 1);

  revalidatePath(`/admin/estudiantes/${estudianteId}`);
  await registrarAccion(supabase, user.id, "abrir_habilidad", estudianteId, { habilidad_id: habilidadId });
  if (errorSet) return { error: "Se abrió la habilidad, pero no su primer ejercicio." };
  return null;
}
