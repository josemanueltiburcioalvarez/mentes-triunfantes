"use client";

import { useActionState, type ReactNode } from "react";

export type EstadoAccion = { error?: string; ok?: string } | null;

// Formulario para server actions que pueden fallar: muestra el error debajo y bloquea los botones
// mientras se procesa.
export default function FormularioAccion({
  accion,
  className,
  children,
}: {
  accion: (estadoPrevio: EstadoAccion, datos: FormData) => Promise<EstadoAccion>;
  className?: string;
  children: ReactNode;
}) {
  const [estado, ejecutar, pendiente] = useActionState(accion, null);
  return (
    <form action={ejecutar} className={className}>
      <fieldset disabled={pendiente} className="contents">
        {children}
      </fieldset>
      {estado?.error && (
        <p role="alert" className="w-full max-w-xs text-sm text-red-600">
          {estado.error}
        </p>
      )}
      {estado?.ok && (
        <p role="status" className="w-full max-w-xs text-sm text-emerald-600 dark:text-emerald-400">
          {estado.ok}
        </p>
      )}
    </form>
  );
}
