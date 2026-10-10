"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { BOTON_AUTH, CAMPO_AUTH } from "@/components/marco-auth";

const MINIMO = 6;

function traducir(mensaje: string): string {
  if (/different from the old password/i.test(mensaje)) return "La contraseña nueva tiene que ser distinta a la anterior.";
  if (/at least/i.test(mensaje)) return `La contraseña debe tener al menos ${MINIMO} caracteres.`;
  if (/weak|pwned|compromised|easy to guess/i.test(mensaje)) return "Esa contraseña es muy fácil de adivinar. Elige otra.";
  if (/session|jwt|not authenticated/i.test(mensaje)) return "El enlace venció. Pide uno nuevo desde «¿Olvidaste tu contraseña?».";
  return "No se pudo cambiar la contraseña. Intenta de nuevo.";
}

// Se muestra despues de abrir el enlace del correo: la persona ya tiene una sesion temporal y solo elige la nueva clave.
export default function RestablecerContrasenaForm() {
  const router = useRouter();
  const supabase = crearClienteNavegador();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmar) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(traducir(error.message));
      setCargando(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Contraseña nueva
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={MINIMO}
          autoFocus
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={CAMPO_AUTH}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Mínimo {MINIMO} caracteres.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmar" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Repite la contraseña
        </label>
        <input
          id="confirmar"
          type="password"
          required
          minLength={MINIMO}
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className={CAMPO_AUTH}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={cargando} className={BOTON_AUTH}>
        {cargando ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
