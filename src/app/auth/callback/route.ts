import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

// Solo se puede volver a estas rutas desde un enlace del correo (evita redirecciones a otros sitios).
const DESTINOS_PERMITIDOS = ["/restablecer-contrasena", "/dashboard"];

// Destino del enlace que llega por correo. Admite los dos formatos de Supabase:
//  - ?code=...        (el de la plantilla por defecto; solo sirve en el mismo navegador donde se pidio)
//  - ?token_hash=...&type=recovery  (plantilla propia; sirve tambien si el correo se abre en otro aparato)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");
  const siguiente = searchParams.get("next");
  const destino = siguiente && DESTINOS_PERMITIDOS.includes(siguiente) ? siguiente : "/dashboard";

  const supabase = await crearClienteServidor();
  let fallo = true;

  if (tokenHash && tipo === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    fallo = !!error;
  } else if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    fallo = !!error;
  }

  if (fallo) return NextResponse.redirect(`${origin}/olvide-contrasena?error=enlace`);
  return NextResponse.redirect(`${origin}${destino}`);
}
