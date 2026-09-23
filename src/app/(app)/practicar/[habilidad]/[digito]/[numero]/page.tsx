import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { HabilidadBasica } from "@/lib/ejercicios/generador";
import { NOMBRES_HABILIDAD_BASICA, descripcionDigito } from "@/lib/ejercicios/generador";
import SetPracticaClient from "./set-client";

const HABILIDADES_VALIDAS = new Set<HabilidadBasica>(["suma", "resta", "tabla_multiplicacion"]);

export default async function SetPracticaPage({
  params,
}: {
  params: Promise<{ habilidad: string; digito: string; numero: string }>;
}) {
  const { habilidad, digito: digitoStr, numero: numeroStr } = await params;
  const digito = Number(digitoStr);
  const numero = Number(numeroStr);

  if (
    !HABILIDADES_VALIDAS.has(habilidad as HabilidadBasica) ||
    !Number.isInteger(digito) ||
    digito < 1 ||
    digito > 5 ||
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 3
  ) {
    return <MensajeCentrado titulo="No encontrado" mensaje="Este ejercicio no existe." habilidad={habilidad} />;
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
      tituloHabilidad={NOMBRES_HABILIDAD_BASICA[nombreHabilidad]}
      estudianteId={user.id}
      digito={digito}
      numeroEjercicio={numero}
      descripcionDigito={descripcionDigito(nombreHabilidad, digito)}
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
