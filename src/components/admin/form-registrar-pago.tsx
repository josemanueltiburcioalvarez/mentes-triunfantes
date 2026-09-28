"use client";

import { useState } from "react";
import FormularioAccion from "@/components/formulario-accion";
import { registrarPago } from "@/app/(app)/admin/suscripciones/acciones";

const CAMPO =
  "rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800";

// Formulario para anotar un pago (no hay pasarela: el admin lo registra despues de cobrar en efectivo,
// Yape/Plin o transferencia). Se muestra u oculta con un boton para no llenar la fila de siempre.
export default function FormRegistrarPago({ estudianteId, siguienteInicio }: { estudianteId: string; siguienteInicio: string }) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Registrar pago
      </button>
    );
  }

  return (
    <FormularioAccion accion={registrarPago} className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800/50">
      <input type="hidden" name="estudiante_id" value={estudianteId} />
      <label className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Desde
        <input type="date" name="fecha_inicio" defaultValue={siguienteInicio} required className={CAMPO} />
      </label>
      <label className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Duración
        <select name="meses" defaultValue="1" className={CAMPO}>
          <option value="1">1 mes</option>
          <option value="3">3 meses</option>
          <option value="6">6 meses</option>
          <option value="12">12 meses</option>
        </select>
      </label>
      <label className="flex w-20 flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Monto (S/)
        <input type="number" name="monto" defaultValue="50" min="1" max="10000" step="0.01" required className={CAMPO} />
      </label>
      <label className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Método
        <select name="metodo_pago" defaultValue="Efectivo" className={CAMPO}>
          <option>Efectivo</option>
          <option>Yape/Plin</option>
          <option>Transferencia</option>
          <option>Otro</option>
        </select>
      </label>
      <label className="flex min-w-32 flex-1 flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Referencia (opcional)
        <input type="text" name="referencia_pago" maxLength={200} placeholder="N.º de operación" className={CAMPO} />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
      >
        Cancelar
      </button>
    </FormularioAccion>
  );
}
