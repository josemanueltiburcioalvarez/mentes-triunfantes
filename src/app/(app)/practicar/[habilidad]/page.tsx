import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { HabilidadBasica } from "@/lib/ejercicios/generador";
import { NOMBRES_HABILIDAD_BASICA } from "@/lib/ejercicios/generador";
import PracticaClient from "./practica-client";

const HABILIDADES_VALIDAS = new Set<HabilidadBasica>(["suma", "resta", "tabla_multiplicacion"]);

export default async function PracticarPage({
  params,
}: {
  params: Promise<{ habilidad: string }>;
}) {
  const { habilidad } = await params;

  if (!HABILIDADES_VALIDAS.has(habilidad as HabilidadBasica)) {
    return (
      <MensajeCentrado
        titulo="Habilidad no disponible"
        mensaje="Esta habilidad todavía no tiene práctica generada. Vuelve pronto."
      />
    );
  }

  const nombreHabilidad = habilidad as HabilidadBasica;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: habilidadFila } = await supabase
    .from("habilidades")
    .select("id, nombre")
    .eq("nombre", nombreHabilidad)
    .single();

  if (!habilidadFila) {
    return (
      <MensajeCentrado
        titulo="Habilidad no encontrada"
        mensaje="No se encontró esta habilidad en el catálogo."
      />
    );
  }

  const { data: progreso } = await supabase
    .from("progreso_habilidad")
    .select("desbloqueada, dificultad_actual, porcentaje_dominio")
    .eq("estudiante_id", user.id)
    .eq("habilidad_id", habilidadFila.id)
    .maybeSingle();

  if (!progreso?.desbloqueada) {
    return (
      <MensajeCentrado
        titulo="Habilidad bloqueada"
        mensaje="Todavía no has desbloqueado esta habilidad. Sigue practicando las anteriores."
      />
    );
  }

  return (
    <PracticaClient
      habilidadId={habilidadFila.id}
      nombreHabilidad={nombreHabilidad}
      tituloHabilidad={NOMBRES_HABILIDAD_BASICA[nombreHabilidad]}
      estudianteId={user.id}
      dificultadInicial={progreso.dificultad_actual}
    />
  );
}

function MensajeCentrado({ titulo, mensaje }: { titulo: string; mensaje: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">{titulo}</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{mensaje}</p>
      <Link
        href="/dashboard"
        className="mt-2 text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        Volver al panel
      </Link>
    </div>
  );
}
