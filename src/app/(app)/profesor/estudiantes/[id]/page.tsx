import FichaEstudiante from "@/components/estudiante/ficha-estudiante";

export default async function FichaEstudianteProfesorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const bruto = Array.isArray(sp.pagina) ? sp.pagina[0] : sp.pagina;
  const pagina = Math.max(1, Math.floor(Number(bruto)) || 1);

  return (
    <FichaEstudiante
      id={id}
      pagina={pagina}
      volverHref="/profesor"
      volverTexto="Volver a mis estudiantes"
      rutaBase={`/profesor/estudiantes/${id}`}
      soloLectura
    />
  );
}
