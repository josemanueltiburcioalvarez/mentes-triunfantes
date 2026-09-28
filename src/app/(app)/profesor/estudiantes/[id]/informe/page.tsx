import InformeEstudiante from "@/components/estudiante/informe-estudiante";

export default async function InformeProfesorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InformeEstudiante id={id} volverHref={`/profesor/estudiantes/${id}`} />;
}
