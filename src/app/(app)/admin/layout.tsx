import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/admin-nav";

// Protege todas las paginas de /admin: solo entra el rol admin.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol !== "admin") redirect("/dashboard");

  // insignias del menu: solicitudes de examen abiertas y sesiones sospechosas
  const [{ count: solicitudes }, { count: alertas }] = await Promise.all([
    supabase.from("autorizaciones_examen").select("id", { count: "exact", head: true }).eq("estado", "solicitado"),
    supabase.from("vista_sesiones_sospechosas").select("sesion_id", { count: "exact", head: true }).eq("sospechosa", true),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
      <AdminNav solicitudes={solicitudes ?? 0} alertas={alertas ?? 0} />
      {children}
    </div>
  );
}
