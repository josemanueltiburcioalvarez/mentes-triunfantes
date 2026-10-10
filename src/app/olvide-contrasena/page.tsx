import MarcoAuth from "@/components/marco-auth";
import PedirRecuperacionForm from "@/components/pedir-recuperacion-form";

export const metadata = { title: "Recuperar contraseña · Mentes Triunfantes" };

export default async function OlvideContrasenaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <MarcoAuth titulo="Recupera tu contraseña" descripcion="Escribe tu correo y te enviamos un enlace para crear una contraseña nueva.">
      <PedirRecuperacionForm
        errorInicial={
          error === "enlace"
            ? "El enlace no es válido o ya venció. Pide uno nuevo y ábrelo en el mismo navegador donde lo pediste."
            : undefined
        }
      />
    </MarcoAuth>
  );
}
