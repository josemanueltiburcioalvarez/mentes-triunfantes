import { NOMBRES_HABILIDAD as NOMBRES_BASE } from "@/lib/ejercicios/generador";

export const NOMBRES_HABILIDAD: Record<string, string> = {
  ...NOMBRES_BASE,
  atajos: "Atajos",
  razonamiento: "Razonamiento",
};

export const TIPOS_SESION: Record<string, string> = {
  practica: "Práctica",
  evaluacion_habilidad: "Examen de habilidad",
  evaluacion: "Evaluación de nivel",
};

export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

// "hoy", "ayer", "hace 5 días"... para el ultimo acceso
export function tiempoRelativo(iso: string | null | undefined): string {
  if (!iso) return "nunca";
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "hace 1 mes" : `hace ${meses} meses`;
}

// Fecha (ISO) de hace n dias, para filtrar por actividad
export function haceDias(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}
