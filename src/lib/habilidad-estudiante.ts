import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// El mismo nombre de habilidad (ej. "suma") ahora existe una vez por modalidad (primaria/secundaria),
// asi que ya no alcanza con filtrar por nombre: hay que desambiguar con la modalidad del estudiante.
// Si todavia no eligio modalidad (no completo su perfil), se trata como primaria.
export async function habilidadDelEstudiante(
  supabase: SupabaseClient<Database>,
  estudianteId: string,
  nombreHabilidad: string
): Promise<{ id: string; nombre: string; nota_aprobacion: number } | null> {
  const [{ data: perfil }, { data: candidatas }] = await Promise.all([
    supabase.from("perfiles").select("modalidad").eq("id", estudianteId).single(),
    supabase
      .from("habilidades")
      .select("id, nombre, nota_aprobacion, niveles(modalidad)")
      .eq("nombre", nombreHabilidad as Database["public"]["Enums"]["nombre_habilidad"]),
  ]);

  const modalidad = perfil?.modalidad ?? "primaria";
  const lista = candidatas ?? [];
  const elegida = lista.find((h) => h.niveles?.modalidad === modalidad) ?? lista[0];
  if (!elegida) return null;
  return { id: elegida.id, nombre: elegida.nombre, nota_aprobacion: elegida.nota_aprobacion };
}
