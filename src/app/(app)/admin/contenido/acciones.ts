"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/components/formulario-accion";
import { registrarAccion } from "@/lib/admin-log";

const HABILIDADES_CURADAS = ["atajos", "razonamiento"] as const;

export async function crearEjercicio(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const habilidadId = String(formData.get("habilidad_id") ?? "");
  const habilidadNombre = String(formData.get("habilidad_nombre") ?? "");
  const dificultad = Number(formData.get("dificultad") ?? "");
  const enunciado = String(formData.get("enunciado") ?? "").trim().slice(0, 500);
  const respuesta = String(formData.get("respuesta") ?? "").trim().slice(0, 100);
  const explicacion = String(formData.get("explicacion") ?? "").trim().slice(0, 1000);

  if (!habilidadId || !HABILIDADES_CURADAS.includes(habilidadNombre as (typeof HABILIDADES_CURADAS)[number])) {
    return { error: "Habilidad no válida." };
  }
  if (!Number.isInteger(dificultad) || dificultad < 1 || dificultad > 5) return { error: "Dígito no válido." };
  if (!enunciado) return { error: "Escribe el enunciado." };
  if (!respuesta || !Number.isFinite(Number(respuesta.replace(",", ".")))) {
    return { error: "La respuesta debe ser un número (ej. 40 o -12)." };
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { error } = await supabase.from("ejercicios").insert({
    habilidad_id: habilidadId,
    dificultad,
    enunciado,
    respuesta,
    explicacion: explicacion || null,
  });
  if (error) return { error: "No se pudo guardar el ejercicio." };

  await registrarAccion(supabase, user.id, "crear_ejercicio", null, {
    habilidad_id: habilidadId,
    dificultad,
  });
  revalidatePath("/admin/contenido");
  return null;
}

export async function eliminarEjercicio(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const id = String(formData.get("id") ?? "");
  const habilidadId = String(formData.get("habilidad_id") ?? "");
  const dificultad = Number(formData.get("dificultad") ?? "");
  if (!id) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { error } = await supabase.from("ejercicios").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar el ejercicio." };

  await registrarAccion(supabase, user.id, "eliminar_ejercicio", null, {
    habilidad_id: habilidadId || undefined,
    dificultad: Number.isFinite(dificultad) ? dificultad : undefined,
  });
  revalidatePath("/admin/contenido");
  return null;
}
