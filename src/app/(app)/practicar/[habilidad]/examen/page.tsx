import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { HabilidadBasica } from "@/lib/ejercicios/generador";
import { NOMBRES_HABILIDAD_BASICA } from "@/lib/ejercicios/generador";
import ExamenClient from "./examen-client";

const HABILIDADES_VALIDAS = new Set<HabilidadBasica>(["suma", "resta", "tabla_multiplicacion"]);

export default async function ExamenPage({
  params,
}: {
  params: Promise<{ habilidad: string }>;
}) {
  const { habilidad } = await params;

  if (!HABILIDADES_VALIDAS.has(habilidad as HabilidadBasica)) {
    return <MensajeCentrado titulo="No disponible" mensaje="Esta habilidad no existe." habilidad={habilidad} />;
  }
  const nombreHabilidad = habilidad as HabilidadBasica;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: habilidadFila } = await supabase
    .from("habilidades")
    .select("id, nota_aprobacion")
    .eq("nombre", nombreHabilidad)
    .single();

  if (!habilidadFila) {
    return <MensajeCentrado titulo="No encontrado" mensaje="Habilidad no encontrada." habilidad={habilidad} />;
  }

  const { data: progresoEjercicios } = await supabase
    .from("progreso_ejercicio")
    .select("aprobado")
    .eq("estudiante_id", user.id)
    .eq("habilidad_id", habilidadFila.id);

  const totalAprobados = (progresoEjercicios ?? []).filter((p) => p.aprobado).length;

  if (totalAprobados < 15) {
    return (
      <MensajeCentrado
        titulo="Examen bloqueado"
        mensaje="Primero aprueba los 15 ejercicios (5 dígitos × 3 sets) de esta habilidad."
        habilidad={habilidad}
      />
    );
  }

  return (
    <ExamenClient
      habilidadId={habilidadFila.id}
      nombreHabilidad={nombreHabilidad}
      tituloHabilidad={NOMBRES_HABILIDAD_BASICA[nombreHabilidad]}
      estudianteId={user.id}
      notaAprobacion={habilidadFila.nota_aprobacion}
    />
  );
}

function MensajeCentrado({
  titulo,
  mensaje,
  habilidad,
}: {
  titulo: string;
  mensaje: string;
  habilidad: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">{titulo}</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{mensaje}</p>
      <Link
        href={`/practicar/${habilidad}`}
        className="mt-2 text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        Volver
      </Link>
    </div>
  );
}
