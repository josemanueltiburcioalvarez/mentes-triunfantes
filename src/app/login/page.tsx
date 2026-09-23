"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";

type Modo = "iniciar_sesion" | "registrarse";

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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Mentes Triunfantes
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          {modo === "iniciar_sesion"
            ? "Inicia sesión para practicar."
            : "Crea tu cuenta de estudiante."}
        </p>

        <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
          {modo === "registrarse" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="nombre" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div className="flex flex-col gap-1">
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
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {mensaje && <p className="text-sm text-emerald-600">{mensaje}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {cargando
              ? "Un momento..."
              : modo === "iniciar_sesion"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setModo(modo === "iniciar_sesion" ? "registrarse" : "iniciar_sesion");
            setError(null);
          }}
          className="mt-4 w-full text-center text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          {modo === "iniciar_sesion"
            ? "¿No tienes cuenta? Regístrate"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </div>
  );
}
