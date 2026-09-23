import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esHabilidadPracticable, type HabilidadPracticable } from "@/lib/ejercicios/generador";
import ExamenClient from "@/components/examen-client";

export default async function ExamenNivelPage({
  params,
}: {
  params: Promise<{ orden: string }>;
}) {
  const { orden: ordenStr } = await params;
  const orden = Number(ordenStr);

  if (!Number.isInteger(orden) || orden < 1 || orden > 4) {
    return <MensajeCentrado titulo="No encontrado" mensaje="Este nivel no existe." />;
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: nivel } = await supabase
    .from("niveles")
    .select("id, nombre, nota_aprobacion")
    .eq("orden", orden)
    .single();
  if (!nivel) return <MensajeCentrado titulo="No encontrado" mensaje="Este nivel no existe." />;

  const { data: habilidadesNivel } = await supabase
    .from("habilidades")
    .select("id, nombre")
    .eq("nivel_id", nivel.id)
    .order("orden");

  const habilidades = habilidadesNivel ?? [];
  if (habilidades.length === 0 || !habilidades.every((h) => esHabilidadPracticable(h.nombre))) {
    return (
      <MensajeCentrado
        titulo="Evaluación no disponible"
        mensaje="Este nivel todavía no tiene todas sus habilidades listas para practicar."
      />
    );
  }

  const { data: examenesAprobados } = await supabase
    .from("evaluaciones_habilidad")
    .select("habilidad_id")
    .eq("estudiante_id", user.id)
    .eq("aprobado", true)
    .in(
      "habilidad_id",
      habilidades.map((h) => h.id)
    );

  const idsAprobados = new Set((examenesAprobados ?? []).map((e) => e.habilidad_id));
  if (!habilidades.every((h) => idsAprobados.has(h.id))) {
    return (
      <MensajeCentrado
        titulo="Evaluación bloqueada"
        mensaje="Primero aprueba el examen final de todas las habilidades del nivel."
      />
    );
  }

  const { data: autorizacion } = await supabase
    .from("autorizaciones_examen")
    .select("meet_url")
    .eq("estudiante_id", user.id)
    .eq("nivel_id", nivel.id)
    .eq("estado", "autorizado")
    .maybeSingle();

  if (!autorizacion?.meet_url) {
    return (
      <MensajeCentrado
        titulo="Evaluación sin autorización"
        mensaje="La evaluación de nivel se rinde en vivo con tu profesor. Solicítala desde el panel y espera su autorización."
      />
    );
  }

  return (
    <ExamenClient
      titulo={`Evaluación del nivel ${nivel.nombre}`}
      tipoSesion="evaluacion"
      nivelId={nivel.id}
      estudianteId={user.id}
      habilidades={habilidades.map((h) => h.nombre as HabilidadPracticable)}
      idsHabilidad={Object.fromEntries(habilidades.map((h) => [h.nombre, h.id]))}
      notaAprobacion={nivel.nota_aprobacion}
      meetUrl={autorizacion.meet_url}
      volverHref="/dashboard"
      volverTexto="Volver al panel"
      mensajeAprobado="Se desbloqueó el siguiente nivel."
    />
  );
}

function MensajeCentrado({ titulo, mensaje }: { titulo: string; mensaje: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">{titulo}</h1>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{mensaje}</p>
      <Link
        href="/dashboard"
        className="mt-2 text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        Volver al panel
      </Link>
    </div>
  );
}
