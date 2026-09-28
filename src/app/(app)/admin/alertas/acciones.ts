"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoAccion } from "@/components/formulario-accion";
import { registrarAccion } from "@/lib/admin-log";

// Marca una sesion sospechosa como revisada o descartada (con una nota opcional).
export async function revisarAlerta(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesionId = String(formData.get("sesion_id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  const nota = String(formData.get("nota") ?? "").trim().slice(0, 500);
  if (!sesionId || (estado !== "revisada" && estado !== "descartada")) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data: sesion } = await supabase
    .from("vista_sesiones_sospechosas")
    .select("estudiante_id")
    .eq("sesion_id", sesionId)
    .maybeSingle();

  const { error } = await supabase
    .from("revisiones_alerta")
    .upsert({ sesion_id: sesionId, estado, nota: nota || null, admin_id: user.id }, { onConflict: "sesion_id" });

  revalidatePath("/admin/alertas");
  revalidatePath("/admin");
  if (error) return { error: "No se pudo guardar la revisión." };
  await registrarAccion(supabase, user.id, "revisar_alerta", sesion?.estudiante_id ?? null, {
    sesion_id: sesionId,
    estado,
    nota: nota || null,
  });
  return null;
}

// Devuelve una alerta ya revisada a la lista de pendientes.
export async function reabrirAlerta(_previo: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const sesionId = String(formData.get("sesion_id") ?? "");
  if (!sesionId) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const { data: sesion } = await supabase
    .from("vista_sesiones_sospechosas")
    .select("estudiante_id")
    .eq("sesion_id", sesionId)
    .maybeSingle();

  const { data, error } = await supabase.from("revisiones_alerta").delete().eq("sesion_id", sesionId).select("sesion_id");

  revalidatePath("/admin/alertas");
  revalidatePath("/admin");
  if (error || !data || data.length === 0) return { error: "No se pudo reabrir la alerta." };
  await registrarAccion(supabase, user.id, "deshacer_revision", sesion?.estudiante_id ?? null, { sesion_id: sesionId });
  return null;
}
