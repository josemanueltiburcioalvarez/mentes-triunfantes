"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/components/formulario-accion";

const ESTADOS = ["activo", "inactivo", "suspendido"] as const;
type Estado = (typeof ESTADOS)[number];

// El RLS ya limita estos cambios al rol admin; aqui solo se valida la entrada.
export async function cambiarEstadoEstudiante(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "") as Estado;
  if (!id || !ESTADOS.includes(estado)) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("perfiles")
    .update({ estado })
    .eq("id", id)
    .eq("rol", "estudiante")
    .select("id");

  revalidatePath(`/admin/estudiantes/${id}`);
  revalidatePath("/admin/estudiantes");
  if (error || !data || data.length === 0) return { error: "No se pudo cambiar el estado." };
  return null;
}

// Abre una habilidad y su primer ejercicio (dígito 1, ejercicio 1) sin que el estudiante tenga que aprobar la anterior.
export async function abrirHabilidad(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const estudianteId = String(formData.get("estudiante_id") ?? "");
  const habilidadId = String(formData.get("habilidad_id") ?? "");
  if (!estudianteId || !habilidadId) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
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
  if (errorSet) return { error: "Se abrió la habilidad, pero no su primer ejercicio." };
  return null;
}
