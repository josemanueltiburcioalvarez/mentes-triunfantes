import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

export type TipoAccion =
  | "autorizar_examen"
  | "cancelar_autorizacion"
  | "cambiar_estado"
  | "abrir_habilidad"
  | "revisar_alerta"
  | "deshacer_revision"
  | "promover_profesor"
  | "quitar_profesor"
  | "asignar_estudiante"
  | "desasignar_estudiante"
  | "abrir_nivel"
  | "registrar_pago"
  | "dar_prueba"
  | "cancelar_suscripcion"
  | "crear_ejercicio"
  | "eliminar_ejercicio";

export const ETIQUETAS_ACCION: Record<TipoAccion, string> = {
  autorizar_examen: "Autorizó un examen",
  cancelar_autorizacion: "Canceló o rechazó una solicitud de examen",
  cambiar_estado: "Cambió el estado de un estudiante",
  abrir_habilidad: "Abrió una habilidad",
  revisar_alerta: "Revisó una alerta",
  deshacer_revision: "Volvió a abrir una alerta",
  promover_profesor: "Hizo profesor a una cuenta",
  quitar_profesor: "Quitó el rol de profesor",
  asignar_estudiante: "Asignó un estudiante a un profesor",
  desasignar_estudiante: "Quitó un estudiante de un profesor",
  abrir_nivel: "Abrió niveles",
  registrar_pago: "Registró un pago",
  dar_prueba: "Dio una prueba gratuita",
  cancelar_suscripcion: "Canceló una suscripción",
  crear_ejercicio: "Agregó un ejercicio de contenido",
  eliminar_ejercicio: "Eliminó un ejercicio de contenido",
};

// Deja constancia de una accion del administrador. Un fallo al registrar no interrumpe la accion.
export async function registrarAccion(
  supabase: SupabaseClient<Database>,
  adminId: string,
  tipo: TipoAccion,
  estudianteId: string | null,
  detalle: Record<string, Json | undefined> = {}
): Promise<void> {
  await supabase
    .from("acciones_admin")
    .insert({ admin_id: adminId, tipo, estudiante_id: estudianteId, detalle: detalle as Json });
}
