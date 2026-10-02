import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import EditarPerfilForm from "@/components/editar-perfil-form";

// Edicion de perfil para el estudiante ya onboardeado: antes solo el admin podia corregir nombre,
// edad o año escolar; ahora el propio estudiante (o quien use la cuenta) puede hacerlo.
export default async function PerfilPage() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, rol, edad, grado_escolar")
    .eq("id", user.id)
    .single();

  if (perfil?.rol !== "estudiante") redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-6 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Mi perfil</h1>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Corrige el nombre, la edad o el año escolar si algo quedó mal.
      </p>
      <EditarPerfilForm nombre={perfil.nombre ?? ""} edad={perfil.edad} gradoEscolar={perfil.grado_escolar} />
      <Link href="/dashboard" className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
        ← Volver
      </Link>
    </div>
  );
}
