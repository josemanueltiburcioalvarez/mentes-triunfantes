import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Award,
  BadgeCheck,
  CalendarCheck,
  Compass,
  Crosshair,
  Crown,
  Flame,
  Footprints,
  Gem,
  Rocket,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

// Los logros no se guardan: se calculan cada vez con el progreso que ya existe (ejercicios aprobados,
// dominio, examenes, racha). Asi nunca quedan desactualizados ni hay que migrar nada al agregar uno.

export type CategoriaLogro = "practica" | "dominio" | "examenes" | "constancia";

export const NOMBRES_CATEGORIA: Record<CategoriaLogro, string> = {
  practica: "Práctica",
  dominio: "Dominio",
  examenes: "Exámenes",
  constancia: "Constancia",
};

// clases completas (no interpoladas) para que Tailwind las detecte
export const ESTILO_CATEGORIA: Record<CategoriaLogro, { logrado: string; barra: string }> = {
  practica: {
    logrado: "bg-emerald-100 text-emerald-600 ring-emerald-400 dark:bg-emerald-950 dark:text-emerald-300 dark:shadow-[0_0_16px_-4px_rgba(16,185,129,0.7)]",
    barra: "bg-emerald-500",
  },
  dominio: {
    logrado: "bg-violet-100 text-violet-600 ring-violet-400 dark:bg-violet-950 dark:text-violet-300 dark:shadow-[0_0_16px_-4px_rgba(139,92,246,0.7)]",
    barra: "bg-violet-500",
  },
  examenes: {
    logrado: "bg-amber-100 text-amber-600 ring-amber-400 dark:bg-amber-950 dark:text-amber-300 dark:shadow-[0_0_16px_-4px_rgba(245,158,11,0.7)]",
    barra: "bg-amber-500",
  },
  constancia: {
    logrado: "bg-orange-100 text-orange-600 ring-orange-400 dark:bg-orange-950 dark:text-orange-300 dark:shadow-[0_0_16px_-4px_rgba(249,115,22,0.7)]",
    barra: "bg-orange-500",
  },
};

export interface DatosLogros {
  ejerciciosAprobados: number;
  ejerciciosPerfectos: number; // 10 de 10
  habilidadesAl100: number;
  respuestasTotales: number;
  examenesHabilidad: number;
  nivelesSuperados: number;
  mejorRacha: number;
  puntajeUbicacion: number | null;
}

interface DefinicionLogro {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaLogro;
  icono: LucideIcon;
  meta: number;
  valor: (d: DatosLogros) => number;
}

const CATALOGO: DefinicionLogro[] = [
  { id: "primeros-pasos", nombre: "Primeros pasos", descripcion: "Aprueba tu primer ejercicio", categoria: "practica", icono: Footprints, meta: 1, valor: (d) => d.ejerciciosAprobados },
  { id: "calentando", nombre: "Calentando motores", descripcion: "Aprueba 10 ejercicios", categoria: "practica", icono: Rocket, meta: 10, valor: (d) => d.ejerciciosAprobados },
  { id: "imparable", nombre: "Imparable", descripcion: "Aprueba 30 ejercicios", categoria: "practica", icono: Zap, meta: 30, valor: (d) => d.ejerciciosAprobados },
  { id: "pleno", nombre: "Pleno", descripcion: "Saca 10 de 10 en un ejercicio", categoria: "practica", icono: Star, meta: 1, valor: (d) => d.ejerciciosPerfectos },
  { id: "cien-respuestas", nombre: "Cien respuestas", descripcion: "Responde 100 preguntas", categoria: "practica", icono: Target, meta: 100, valor: (d) => d.respuestasTotales },
  { id: "maraton", nombre: "Maratón de números", descripcion: "Responde 500 preguntas", categoria: "practica", icono: Crosshair, meta: 500, valor: (d) => d.respuestasTotales },

  { id: "primer-100", nombre: "Primer 100 %", descripcion: "Llega al 100 % de dominio en una habilidad", categoria: "dominio", icono: Gem, meta: 1, valor: (d) => d.habilidadesAl100 },
  { id: "triple-dominio", nombre: "Triple dominio", descripcion: "Domina 3 habilidades al 100 %", categoria: "dominio", icono: Gem, meta: 3, valor: (d) => d.habilidadesAl100 },
  { id: "gran-maestro", nombre: "Gran maestro", descripcion: "Domina 6 habilidades al 100 %", categoria: "dominio", icono: Crown, meta: 6, valor: (d) => d.habilidadesAl100 },

  { id: "examen-aprobado", nombre: "Examen aprobado", descripcion: "Aprueba el examen final de una habilidad", categoria: "examenes", icono: BadgeCheck, meta: 1, valor: (d) => d.examenesHabilidad },
  { id: "cinco-examenes", nombre: "Cinco exámenes", descripcion: "Aprueba 5 exámenes finales", categoria: "examenes", icono: Award, meta: 5, valor: (d) => d.examenesHabilidad },
  { id: "nivel-superado", nombre: "Nivel superado", descripcion: "Aprueba la evaluación de un nivel", categoria: "examenes", icono: Trophy, meta: 1, valor: (d) => d.nivelesSuperados },
  { id: "mente-elite", nombre: "Mente de élite", descripcion: "Supera los 4 niveles", categoria: "examenes", icono: Sparkles, meta: 4, valor: (d) => d.nivelesSuperados },
  { id: "gran-inicio", nombre: "Gran inicio", descripcion: "Saca 16 o más en el examen de ubicación", categoria: "examenes", icono: Compass, meta: 16, valor: (d) => d.puntajeUbicacion ?? 0 },

  { id: "racha-3", nombre: "Tres seguidos", descripcion: "Practica 3 días seguidos", categoria: "constancia", icono: Flame, meta: 3, valor: (d) => d.mejorRacha },
  { id: "racha-7", nombre: "Semana completa", descripcion: "Practica 7 días seguidos", categoria: "constancia", icono: Flame, meta: 7, valor: (d) => d.mejorRacha },
  { id: "racha-30", nombre: "Un mes imparable", descripcion: "Practica 30 días seguidos", categoria: "constancia", icono: CalendarCheck, meta: 30, valor: (d) => d.mejorRacha },
];

export interface LogroEvaluado {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaLogro;
  icono: LucideIcon;
  meta: number;
  actual: number; // ya recortado a la meta
  logrado: boolean;
}

export function evaluarLogros(datos: DatosLogros): LogroEvaluado[] {
  return CATALOGO.map(({ valor, ...logro }) => {
    const v = Math.max(0, valor(datos));
    return { ...logro, actual: Math.min(v, logro.meta), logrado: v >= logro.meta };
  });
}

// Para el aviso de "nuevo logro" (componente cliente): el logro ya logrado, a partir de su id.
export function infoLogro(id: string): LogroEvaluado | null {
  const definicion = CATALOGO.find((l) => l.id === id);
  if (!definicion) return null;
  const { valor: _valor, ...logro } = definicion;
  void _valor;
  return { ...logro, actual: logro.meta, logrado: true };
}

export function esLogroConocido(id: string): boolean {
  return CATALOGO.some((l) => l.id === id);
}

export interface Racha {
  actual: number;
  mejor: number;
  practicoHoy: boolean;
  diasRecientes: string[]; // "YYYY-MM-DD" en hora de Lima, de los ultimos 7 dias con actividad
}

// Fecha de hoy en Lima ("YYYY-MM-DD"), igual que hoy_lima() en la base de datos.
export function hoyLima(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
}

export async function cargarLogros(
  supabase: SupabaseClient<Database>,
  estudianteId: string
): Promise<{ logros: LogroEvaluado[]; racha: Racha }> {
  const [progreso, aprobados, perfectos, examenes, niveles, ubicacion, racha] = await Promise.all([
    supabase.from("progreso_habilidad").select("porcentaje_dominio, total_intentos").eq("estudiante_id", estudianteId),
    supabase.from("progreso_ejercicio").select("*", { count: "exact", head: true }).eq("estudiante_id", estudianteId).eq("aprobado", true),
    supabase.from("progreso_ejercicio").select("*", { count: "exact", head: true }).eq("estudiante_id", estudianteId).eq("mejor_puntaje", 100),
    supabase.from("evaluaciones_habilidad").select("*", { count: "exact", head: true }).eq("estudiante_id", estudianteId).eq("aprobado", true),
    supabase.from("evaluaciones_nivel").select("*", { count: "exact", head: true }).eq("estudiante_id", estudianteId).eq("aprobado", true),
    supabase.from("evaluaciones_ubicacion").select("puntaje").eq("estudiante_id", estudianteId).maybeSingle(),
    supabase.from("vista_racha_estudiante").select("*").eq("estudiante_id", estudianteId).maybeSingle(),
  ]);

  const filas = progreso.data ?? [];
  const datos: DatosLogros = {
    ejerciciosAprobados: aprobados.count ?? 0,
    ejerciciosPerfectos: perfectos.count ?? 0,
    habilidadesAl100: filas.filter((f) => Number(f.porcentaje_dominio) >= 100).length,
    respuestasTotales: filas.reduce((suma, f) => suma + (f.total_intentos ?? 0), 0),
    examenesHabilidad: examenes.count ?? 0,
    nivelesSuperados: niveles.count ?? 0,
    mejorRacha: racha.data?.mejor_racha ?? 0,
    puntajeUbicacion: ubicacion.data?.puntaje ?? null,
  };

  return {
    logros: evaluarLogros(datos),
    racha: {
      actual: racha.data?.racha_actual ?? 0,
      mejor: racha.data?.mejor_racha ?? 0,
      practicoHoy: racha.data?.practico_hoy ?? false,
      diasRecientes: racha.data?.dias_recientes ?? [],
    },
  };
}

// Marca que sirve para saber que ya se hizo la primera revision de logros de un estudiante.
const MARCA_INICIAL = "__inicio";

// Ids de los logros ya logrados que el estudiante todavia no ha visto. La primera vez (sin ninguna fila) lo que ya
// tenia logrado se da por visto: si no, un estudiante con historial recibiria todos los avisos de golpe.
export async function logrosNuevos(
  supabase: SupabaseClient<Database>,
  estudianteId: string,
  logros: LogroEvaluado[]
): Promise<string[]> {
  const logrados = logros.filter((l) => l.logrado).map((l) => l.id);
  const { data, error } = await supabase.from("logros_vistos").select("logro_id").eq("estudiante_id", estudianteId);
  if (error || !data) return [];

  if (data.length === 0) {
    await supabase
      .from("logros_vistos")
      .upsert(
        [MARCA_INICIAL, ...logrados].map((logro_id) => ({ estudiante_id: estudianteId, logro_id })),
        { onConflict: "estudiante_id,logro_id", ignoreDuplicates: true }
      );
    return [];
  }

  const vistos = new Set(data.map((d) => d.logro_id));
  return logrados.filter((id) => !vistos.has(id));
}
