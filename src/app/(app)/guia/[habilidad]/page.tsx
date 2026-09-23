import { redirect } from "next/navigation";

export default async function GuiaIndice({ params }: { params: Promise<{ habilidad: string }> }) {
  const { habilidad } = await params;
  redirect(`/guia/${habilidad}/1`);
}
