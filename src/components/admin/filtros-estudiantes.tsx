"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface ValoresFiltro {
  q: string;
  nivel: string;
  estado: string;
  inactivo: string;
  alerta: string;
  orden: string;
}

const CAMPO =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";

// Filtros del listado de estudiantes: al cambiar algo se actualiza la direccion (y se vuelve a la
// pagina 1); el texto de busqueda espera un instante para no consultar en cada tecla.
export default function FiltrosEstudiantes({ inicial }: { inicial: ValoresFiltro }) {
  const router = useRouter();
  const ruta = usePathname();
  const [valores, setValores] = useState<ValoresFiltro>(inicial);
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    const espera = setTimeout(() => {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(valores)) if (v) q.set(k, v);
      const s = q.toString();
      router.replace(s ? `${ruta}?${s}` : ruta);
    }, 300);
    return () => clearTimeout(espera);
  }, [valores, router, ruta]);

  const cambiar = (campo: keyof ValoresFiltro) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValores((v) => ({ ...v, [campo]: e.target.value }));

  const hayFiltros = Object.entries(valores).some(([k, v]) => v && k !== "orden");

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        Buscar
        <input
          type="search"
          value={valores.q}
          onChange={cambiar("q")}
          placeholder="Nombre o correo"
          className={CAMPO}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        Nivel
        <select value={valores.nivel} onChange={cambiar("nivel")} className={CAMPO}>
          <option value="">Todos</option>
          <option value="1">Básico</option>
          <option value="2">Intermedio</option>
          <option value="3">Avanzado</option>
          <option value="4">Experto</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        Estado
        <select value={valores.estado} onChange={cambiar("estado")} className={CAMPO}>
          <option value="">Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="suspendido">Suspendido</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        Actividad
        <select value={valores.inactivo} onChange={cambiar("inactivo")} className={CAMPO}>
          <option value="">Cualquiera</option>
          <option value="7">Sin practicar 7+ días</option>
          <option value="15">Sin practicar 15+ días</option>
          <option value="30">Sin practicar 30+ días</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        Mostrar
        <select value={valores.alerta} onChange={cambiar("alerta")} className={CAMPO}>
          <option value="">Todos</option>
          <option value="alertas">Con alertas</option>
          <option value="examen">Con examen pendiente</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        Ordenar por
        <select value={valores.orden} onChange={cambiar("orden")} className={CAMPO}>
          <option value="">Nombre (A–Z)</option>
          <option value="avance">Mayor avance</option>
          <option value="avance_asc">Menor avance</option>
          <option value="reciente">Actividad más reciente</option>
          <option value="antiguo">Más tiempo sin practicar</option>
        </select>
      </label>
      {hayFiltros && (
        <button
          type="button"
          onClick={() => setValores({ q: "", nivel: "", estado: "", inactivo: "", alerta: "", orden: valores.orden })}
          className="pb-2 text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
