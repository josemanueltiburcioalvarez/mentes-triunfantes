import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esHabilidadPracticable, NOMBRES_HABILIDAD, usaNombreDigito } from "@/lib/ejercicios/generador";
import ExamenClient from "@/components/examen-client";

export default async function ExamenPage({
  params,
}: {
  params: Promise<{ habilidad: string }>;
}) {
  const { habilidad } = await params;

  if (!esHabilidadPracticable(habilidad)) {
    return <MensajeCentrado titulo="No disponible" mensaje="Esta habilidad no existe." habilidad={habilidad} />;
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: habilidadFila } = await supabase
    .from("habilidades")
    .select("id, nota_aprobacion")
    .eq("nombre", habilidad)
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
        mensaje={
          usaNombreDigito(habilidad)
            ? "Primero aprueba los 15 ejercicios (5 dígitos × 3 sets) de esta habilidad."
            : "Primero aprueba los 15 ejercicios (5 niveles × 3 sets) de esta habilidad."
        }
        habilidad={habilidad}
      />
    );
  }

  const { data: autorizacion } = await supabase
    .from("autorizaciones_examen")
    .select("meet_url")
    .eq("estudiante_id", user.id)
    .eq("habilidad_id", habilidadFila.id)
    .eq("estado", "autorizado")
    .maybeSingle();

  if (!autorizacion?.meet_url) {
    return (
      <MensajeCentrado
        titulo="Examen sin autorización"
        mensaje="El examen final se rinde en vivo con tu profesor. Solicítalo desde el mapa y espera su autorización."
        habilidad={habilidad}
      />
    );
  }

  return (
    <ExamenClient
      titulo={`Examen final de ${NOMBRES_HABILIDAD[habilidad]}`}
      tipoSesion="evaluacion_habilidad"
      habilidadId={habilidadFila.id}
      estudianteId={user.id}
      habilidades={[habilidad]}
      idsHabilidad={{ [habilidad]: habilidadFila.id }}
      notaAprobacion={habilidadFila.nota_aprobacion}
      meetUrl={autorizacion.meet_url}
      volverHref={`/practicar/${habilidad}`}
      volverTexto="Volver al mapa"
      mensajeAprobado="Se desbloqueó la siguiente habilidad."
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
