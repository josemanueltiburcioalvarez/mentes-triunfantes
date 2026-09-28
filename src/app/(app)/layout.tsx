import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cerrarSesion } from "./acciones";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nombre = "";
  let esAdmin = false;
  let esProfesor = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("nombre, rol")
      .eq("id", user.id)
      .single();
    nombre = perfil?.nombre ?? "";
    esAdmin = perfil?.rol === "admin";
    esProfesor = perfil?.rol === "profesor";
  }
  const inicio = esAdmin ? "/admin" : esProfesor ? "/profesor" : "/dashboard";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="print:hidden flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href={inicio} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Mentes Triunfantes{esAdmin ? " · Admin" : esProfesor ? " · Profesor" : ""}
        </Link>
        <div className="flex items-center gap-4">
          {nombre && (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Hola, {nombre}</span>
          )}
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
