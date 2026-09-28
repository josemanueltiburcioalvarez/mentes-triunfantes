"use client";

import { useState } from "react";
import FormularioAccion from "@/components/formulario-accion";
import { crearEjercicio } from "@/app/(app)/admin/contenido/acciones";

const CAMPO =
  "w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800";

export default function FormAgregarEjercicio({
  habilidadId,
  habilidadNombre,
  dificultad,
}: {
  habilidadId: string;
  habilidadNombre: string;
  dificultad: number;
}) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        + Agregar ejercicio
      </button>
    );
  }

  return (
    <FormularioAccion
      accion={async (previo, formData) => {
        const r = await crearEjercicio(previo, formData);
        if (!r) setAbierto(false);
        return r;
      }}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
    >
      <input type="hidden" name="habilidad_id" value={habilidadId} />
      <input type="hidden" name="habilidad_nombre" value={habilidadNombre} />
      <input type="hidden" name="dificultad" value={dificultad} />
      <label className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Enunciado
        <textarea name="enunciado" required maxLength={500} rows={2} className={CAMPO} />
      </label>
      <div className="flex gap-2">
        <label className="flex w-32 flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Respuesta (solo número)
          <input type="text" name="respuesta" required maxLength={100} placeholder="ej. 40 o -12" className={CAMPO} />
        </label>
        <label className="flex flex-1 flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Explicación (opcional)
          <input type="text" name="explicacion" maxLength={1000} placeholder="Se muestra al alumno después de responder" className={CAMPO} />
        </label>
      </div>
      <div className="flex gap-2">
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
      </div>
    </FormularioAccion>
  );
}
