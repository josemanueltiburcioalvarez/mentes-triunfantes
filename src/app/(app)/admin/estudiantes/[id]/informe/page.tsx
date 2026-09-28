import InformeEstudiante from "@/components/estudiante/informe-estudiante";

export default async function InformePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InformeEstudiante id={id} volverHref={`/admin/estudiantes/${id}`} />;
}
