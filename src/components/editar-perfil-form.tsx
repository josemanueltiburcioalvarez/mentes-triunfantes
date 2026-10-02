"use client";

import FormularioAccion from "@/components/formulario-accion";
import { actualizarPerfil } from "@/app/(app)/acciones";
import { GRADOS_ESCOLARES } from "@/lib/grados";

const CAMPO =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800";

export default function EditarPerfilForm({
  nombre,
  edad,
  gradoEscolar,
}: {
  nombre: string;
  edad: number | null;
  gradoEscolar: string | null;
}) {
  return (
    <FormularioAccion accion={actualizarPerfil} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Nombre del estudiante
        <input name="nombre" type="text" required maxLength={100} defaultValue={nombre} className={CAMPO} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Edad
        <input name="edad" type="number" required min={3} max={25} defaultValue={edad ?? undefined} className={CAMPO} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Año escolar
        <select name="grado_escolar" required defaultValue={gradoEscolar ?? ""} className={CAMPO}>
          <option value="" disabled>
            Elige una opción
          </option>
          <optgroup label="Primaria">
            {GRADOS_ESCOLARES.filter((g) => g.value.startsWith("primaria")).map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Secundaria">
            {GRADOS_ESCOLARES.filter((g) => g.value.startsWith("secundaria")).map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </optgroup>
        </select>
        <span className="font-normal text-xs text-zinc-500 dark:text-zinc-400">
          Si cambias de primaria a secundaria (o al revés), empezarás esa parte desde su primera habilidad.
        </span>
      </label>
      <button
        type="submit"
        className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Guardar cambios
      </button>
    </FormularioAccion>
  );
}
