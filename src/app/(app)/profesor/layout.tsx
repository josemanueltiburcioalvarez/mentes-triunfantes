import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

// Protege las paginas de /profesor: solo entra el rol profesor.
export default async function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol === "admin") redirect("/admin");
  if (perfil?.rol !== "profesor") redirect("/dashboard");

  return <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</div>;
}
