import { cache } from "react";
import { crearClienteServidor } from "@/lib/supabase/server";
import { METODO_PRUEBA } from "@/lib/planes";

export type AccesoEstudiante =
  | { permitido: true }
  | {
      permitido: false;
      estado: "sin_pagos" | "vencida" | "cancelada";
      fechaFin: string | null;
      // la ultima suscripcion fue la prueba gratuita
      eraPrueba: boolean;
      nombre: string;
      email: string;
    };

// Practica, guias y examenes exigen un plan activo. El panel no: se ve con todos los niveles para que el
// estudiante vea a donde llega antes de pagar. Admin y profesor no necesitan plan. Se calcula una sola vez por
// peticion (cache) aunque lo pidan el layout y la pagina.
export const verificarAcceso = cache(async (): Promise<AccesoEstudiante> => {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { permitido: true }; // sin sesion lo resuelve el proxy (redirige a /login)

  const [{ data: perfil }, { data: suscripcion }] = await Promise.all([
    supabase.from("perfiles").select("rol, nombre, email").eq("id", user.id).single(),
    supabase.from("vista_suscripciones_admin").select("estado_actual, fecha_fin, metodo_pago").eq("estudiante_id", user.id).maybeSingle(),
  ]);

  if (perfil?.rol === "admin" || perfil?.rol === "profesor") return { permitido: true };
  if (suscripcion?.estado_actual === "activa") return { permitido: true };

  const estado = suscripcion?.estado_actual;
  return {
    permitido: false,
    estado: estado === "vencida" || estado === "cancelada" ? estado : "sin_pagos",
    fechaFin: suscripcion?.fecha_fin ?? null,
    eraPrueba: suscripcion?.metodo_pago === METODO_PRUEBA,
    nombre: perfil?.nombre ?? "",
    email: perfil?.email ?? user.email ?? "",
  };
});
