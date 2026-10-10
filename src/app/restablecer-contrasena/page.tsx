import MarcoAuth from "@/components/marco-auth";
import RestablecerContrasenaForm from "@/components/restablecer-contrasena-form";

export const metadata = { title: "Nueva contraseña · Mentes Triunfantes" };

// Sin sesion, el proxy manda al login: solo se llega aqui desde el enlace del correo.
export default function RestablecerContrasenaPage() {
  return (
    <MarcoAuth titulo="Elige tu contraseña nueva" descripcion="Después de guardarla entrarás directo a tu panel.">
      <RestablecerContrasenaForm />
    </MarcoAuth>
  );
}
