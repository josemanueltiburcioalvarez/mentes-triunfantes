import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cerrarSesion } from "./acciones";
import CompletarPerfilForm from "@/components/completar-perfil-form";
import ExamenUbicacionClient from "@/components/examen-ubicacion-client";
import Logo from "@/components/logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nombre = "";
  let esAdmin = false;
  let esProfesor = false;
  let perfilIncompleto = false;
  let modalidad: "primaria" | "secundaria" | null = null;
  let faltaExamenUbicacion = false;

  if (user) {
    // El plan (suscripcion) no se revisa aqui: el panel se ve siempre; la practica, las guias y los examenes
    // piden un plan activo en su propia pagina (ver verificarAcceso).
    const [{ data: perfil }, { data: ubicacion }] = await Promise.all([
      supabase.from("perfiles").select("nombre, rol, grado_escolar, modalidad").eq("id", user.id).single(),
      supabase.from("evaluaciones_ubicacion").select("id").eq("estudiante_id", user.id).maybeSingle(),
    ]);
    nombre = perfil?.nombre ?? "";
    esAdmin = perfil?.rol === "admin";
    esProfesor = perfil?.rol === "profesor";
    modalidad = perfil?.modalidad ?? null;

    const esEstudiante = !esAdmin && !esProfesor;
    perfilIncompleto = esEstudiante && !perfil?.grado_escolar;
    faltaExamenUbicacion = esEstudiante && !perfilIncompleto && !ubicacion;
  }
  const inicio = esAdmin ? "/admin" : esProfesor ? "/profesor" : "/dashboard";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="print:hidden flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href={inicio} className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <Logo variante="emblema" ancho={64} prioridad />
          <span>
            <span className="hidden sm:inline">Mentes Triunfantes</span>
            {(esAdmin || esProfesor) && (
              <>
                <span className="hidden sm:inline"> · </span>
                {esAdmin ? "Admin" : "Profesor"}
              </>
            )}
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {nombre && (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Hola, {nombre}</span>
          )}
          {!esAdmin && !esProfesor && !perfilIncompleto && !faltaExamenUbicacion && (
            <Link href="/perfil" className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
              Mi perfil
            </Link>
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
      <main className="flex flex-1 flex-col">
        {perfilIncompleto ? (
          <CompletarPerfilForm />
        ) : faltaExamenUbicacion && modalidad ? (
          <ExamenUbicacionClient modalidad={modalidad} />
        ) : (
          children
        )}
      </main>
    </div>
  );
}
