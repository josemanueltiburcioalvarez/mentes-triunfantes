"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import FondoEstudiante from "@/components/fondo-estudiante";
import Logo from "@/components/logo";

type Modo = "iniciar_sesion" | "registrarse";

const CAMPO =
  "w-full rounded-xl border border-zinc-300 bg-white/70 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-600";

export default function LoginPage() {
  const router = useRouter();
  const supabase = crearClienteNavegador();

  const [modo, setModo] = useState<Modo>("iniciar_sesion");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    if (modo === "iniciar_sesion") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Correo o contraseña incorrectos."
            : error.message
        );
        setCargando(false);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre, rol: "estudiante" } },
      });
      if (error) {
        setError(error.message);
        setCargando(false);
        return;
      }
      if (!data.session) {
        setMensaje("Cuenta creada. Revisa tu correo para confirmar antes de iniciar sesión.");
        setModo("iniciar_sesion");
        setCargando(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="fondo-estudiante relative flex flex-1 items-center justify-center overflow-x-clip px-4 py-10">
      <FondoEstudiante />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <Logo variante="completo" ancho={210} prioridad className="mb-6 h-auto" />

        <div className="w-full rounded-2xl border border-zinc-200 bg-white/80 p-7 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-[0_0_44px_-14px_rgba(16,185,129,0.45)]">
          <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {modo === "iniciar_sesion" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
          </h1>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            {modo === "iniciar_sesion"
              ? "Inicia sesión para seguir practicando."
              : "Empieza a practicar cálculo mental a mano, paso a paso."}
          </p>

          <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
            {modo === "registrarse" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nombre" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={CAMPO}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Correo
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={CAMPO}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={CAMPO}
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </p>
            )}
            {mensaje && (
              <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {mensaje}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="mt-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_-4px_rgba(16,185,129,0.65)] transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              {cargando ? "Un momento..." : modo === "iniciar_sesion" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setModo(modo === "iniciar_sesion" ? "registrarse" : "iniciar_sesion");
              setError(null);
            }}
            className="mt-5 w-full text-center text-sm text-zinc-500 underline-offset-2 hover:text-emerald-600 hover:underline dark:text-zinc-400 dark:hover:text-emerald-400"
          >
            {modo === "iniciar_sesion" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
