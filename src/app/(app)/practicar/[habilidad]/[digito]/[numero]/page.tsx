import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { HabilidadPracticable } from "@/lib/ejercicios/generador";
import { NOMBRES_HABILIDAD, descripcionDigito, esHabilidadPracticable } from "@/lib/ejercicios/generador";
import { habilidadDelEstudiante } from "@/lib/habilidad-estudiante";
import SetPracticaClient from "./set-client";


export default async function SetPracticaPage({
  params,
}: {
  params: Promise<{ habilidad: string; digito: string; numero: string }>;
}) {
  const { habilidad, digito: digitoStr, numero: numeroStr } = await params;
  const digito = Number(digitoStr);
  const numero = Number(numeroStr);

  if (
    !esHabilidadPracticable(habilidad) ||
    !Number.isInteger(digito) ||
    digito < 1 ||
    digito > 5 ||
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 3
  ) {
    return <MensajeCentrado titulo="No encontrado" mensaje="Este ejercicio no existe." habilidad={habilidad} />;
  }
  const nombreHabilidad = habilidad as HabilidadPracticable;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const habilidadFila = await habilidadDelEstudiante(supabase, user.id, nombreHabilidad);

  if (!habilidadFila) {
    return <MensajeCentrado titulo="No encontrado" mensaje="Habilidad no encontrada." habilidad={habilidad} />;
  }

  const { data: progreso } = await supabase
    .from("progreso_ejercicio")
    .select("desbloqueado")
    .eq("estudiante_id", user.id)
    .eq("habilidad_id", habilidadFila.id)
    .eq("digito", digito)
    .eq("numero_ejercicio", numero)
    .maybeSingle();

  if (!progreso?.desbloqueado) {
    return (
      <MensajeCentrado
        titulo="Ejercicio bloqueado"
        mensaje="Todavía no has desbloqueado este ejercicio."
        habilidad={habilidad}
      />
    );
  }

  return (
    <SetPracticaClient
      habilidadId={habilidadFila.id}
      nombreHabilidad={nombreHabilidad}
      tituloHabilidad={NOMBRES_HABILIDAD[nombreHabilidad]}
      estudianteId={user.id}
      digito={digito}
      numeroEjercicio={numero}
      descripcionDigito={descripcionDigito(nombreHabilidad, digito, numero)}
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
