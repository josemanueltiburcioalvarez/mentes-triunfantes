"use client";

import { useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { BOTON_AUTH, CAMPO_AUTH } from "@/components/marco-auth";

// Pide el correo y manda el enlace para elegir una contrasena nueva. Siempre responde lo mismo, exista o no
// el correo, para que nadie pueda averiguar quien tiene cuenta.
export default function PedirRecuperacionForm({ errorInicial }: { errorInicial?: string }) {
  const supabase = crearClienteNavegador();
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(errorInicial ?? null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/restablecer-contrasena`,
    });
    setCargando(false);
    if (error && (error.status === 429 || /rate limit/i.test(error.message))) {
      setError("Ya se enviaron varios correos seguidos. Espera unos minutos y vuelve a intentarlo.");
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          Si ese correo tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Revisa tu bandeja de entrada y
          también la carpeta de spam.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Abre el enlace en el mismo navegador donde lo pediste. Si no llega en unos minutos, puedes pedirlo de nuevo.
        </p>
        <button
          type="button"
          onClick={() => setEnviado(false)}
          className="text-center text-sm text-zinc-500 underline-offset-2 hover:text-emerald-600 hover:underline dark:text-zinc-400 dark:hover:text-emerald-400"
        >
          Pedir otro enlace
        </button>
        <Link href="/login" className="text-center text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Correo
        </label>
        <input
          id="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={CAMPO_AUTH}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={cargando} className={BOTON_AUTH}>
        {cargando ? "Enviando..." : "Enviar enlace"}
      </button>

      <Link
        href="/login"
        className="text-center text-sm text-zinc-500 underline-offset-2 hover:text-emerald-600 hover:underline dark:text-zinc-400 dark:hover:text-emerald-400"
      >
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
