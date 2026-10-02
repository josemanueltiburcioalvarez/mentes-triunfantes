"use client";

import FormularioAccion from "@/components/formulario-accion";
import { completarPerfil } from "@/app/(app)/acciones";
import { GRADOS_ESCOLARES } from "@/lib/grados";

const CAMPO =
  "rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800";

export default function CompletarPerfilForm() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-6 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Cuéntanos sobre el estudiante</h1>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        A veces el correo lo crea el papá o la mamá, así que preguntamos aparte. Esto nos ayuda a armar el nivel
        justo para empezar — después rendirás un examen corto de ubicación.
      </p>
      <FormularioAccion accion={completarPerfil} className="flex w-full flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nombre del estudiante
          <input name="nombre" type="text" required maxLength={100} autoFocus className={CAMPO} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Edad
          <input name="edad" type="number" required min={3} max={25} className={CAMPO} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Año escolar
          <select name="grado_escolar" required defaultValue="" className={CAMPO}>
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
        </label>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Continuar
        </button>
      </FormularioAccion>
    </div>
  );
}
