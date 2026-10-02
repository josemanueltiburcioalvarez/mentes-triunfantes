import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cerrarSesion } from "./acciones";
import { formatearSoloFecha } from "@/lib/admin";
import CompletarPerfilForm from "@/components/completar-perfil-form";
import ExamenUbicacionClient from "@/components/examen-ubicacion-client";

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
  // una suscripcion vencida o cancelada bloquea el acceso del estudiante (no "sin_pagos": a un
  // estudiante recien registrado no se le corta el acceso antes de que el admin le registre el primer pago).
  let bloqueoSuscripcion: { vencida: boolean; fechaFin: string | null } | null = null;

  if (user) {
    const [{ data: perfil }, { data: suscripcion }, { data: ubicacion }] = await Promise.all([
      supabase.from("perfiles").select("nombre, rol, grado_escolar, modalidad").eq("id", user.id).single(),
      supabase
        .from("vista_suscripciones_admin")
        .select("estado_actual, fecha_fin")
        .eq("estudiante_id", user.id)
        .maybeSingle(),
      supabase.from("evaluaciones_ubicacion").select("id").eq("estudiante_id", user.id).maybeSingle(),
    ]);
    nombre = perfil?.nombre ?? "";
    esAdmin = perfil?.rol === "admin";
    esProfesor = perfil?.rol === "profesor";
    modalidad = perfil?.modalidad ?? null;

    const esEstudiante = !esAdmin && !esProfesor;
    perfilIncompleto = esEstudiante && !perfil?.grado_escolar;
    faltaExamenUbicacion = esEstudiante && !perfilIncompleto && !ubicacion;

    if (esEstudiante && (suscripcion?.estado_actual === "vencida" || suscripcion?.estado_actual === "cancelada")) {
      bloqueoSuscripcion = { vencida: suscripcion.estado_actual === "vencida", fechaFin: suscripcion.fecha_fin };
    }
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
      <main className="flex flex-1 flex-col">
        {perfilIncompleto ? (
          <CompletarPerfilForm />
        ) : faltaExamenUbicacion && modalidad ? (
          <ExamenUbicacionClient modalidad={modalidad} />
        ) : bloqueoSuscripcion ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
              {bloqueoSuscripcion.vencida ? "Tu suscripción venció" : "Tu suscripción fue cancelada"}
            </h1>
            <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              {bloqueoSuscripcion.vencida && bloqueoSuscripcion.fechaFin
                ? `Venció el ${formatearSoloFecha(bloqueoSuscripcion.fechaFin)}. `
                : ""}
              Contacta al administrador para renovarla y recuperar el acceso.
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
