"use client";

import FormularioAccion from "@/components/formulario-accion";
import { eliminarEjercicio } from "@/app/(app)/admin/contenido/acciones";

export default function BotonEliminarEjercicio({
  id,
  habilidadId,
  dificultad,
}: {
  id: string;
  habilidadId: string;
  dificultad: number;
}) {
  return (
    <FormularioAccion accion={eliminarEjercicio}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="habilidad_id" value={habilidadId} />
      <input type="hidden" name="dificultad" value={dificultad} />
      <button
        type="submit"
        className="text-xs font-medium text-red-600 underline-offset-2 hover:underline dark:text-red-400"
      >
        Eliminar
      </button>
    </FormularioAccion>
  );
}
