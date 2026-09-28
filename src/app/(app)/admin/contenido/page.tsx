import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha } from "@/lib/admin";
import { DESCRIPCIONES_ATAJOS } from "@/lib/ejercicios/atajos";
import { DESCRIPCIONES_RAZONAMIENTO } from "@/lib/ejercicios/razonamiento";
import FormAgregarEjercicio from "@/components/admin/form-agregar-ejercicio";
import BotonEliminarEjercicio from "@/components/admin/boton-eliminar-ejercicio";

const HABILIDADES = [
  { nombre: "atajos" as const, titulo: "Atajos", descripciones: DESCRIPCIONES_ATAJOS },
  { nombre: "razonamiento" as const, titulo: "Razonamiento", descripciones: DESCRIPCIONES_RAZONAMIENTO },
];

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ContenidoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const habilidadParam = uno(sp.habilidad);
  const seleccionada = HABILIDADES.find((h) => h.nombre === habilidadParam) ?? HABILIDADES[0];

  const supabase = await crearClienteServidor();
  const { data: habilidadFila } = await supabase
    .from("habilidades")
    .select("id")
    .eq("nombre", seleccionada.nombre)
    .single();

  const ejercicios = habilidadFila
    ? ((
        await supabase
          .from("ejercicios")
          .select("*")
          .eq("habilidad_id", habilidadFila.id)
          .order("dificultad")
          .order("created_at", { ascending: false })
      ).data ?? [])
    : [];

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Contenido</h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Ejercicios que escribes a mano para Atajos y Razonamiento. Se mezclan con los que la aplicación genera
        automáticamente; no hace falta llenar todos los dígitos para que la habilidad funcione.
      </p>

      <div className="mb-4 flex gap-2">
        {HABILIDADES.map((h) => (
          <Link
            key={h.nombre}
            href={`/admin/contenido?habilidad=${h.nombre}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              seleccionada.nombre === h.nombre
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {h.titulo}
          </Link>
        ))}
      </div>

      {!habilidadFila ? (
        <p className="text-sm text-red-600">No se encontró la habilidad.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {[1, 2, 3, 4, 5].map((digito) => {
            const filas = ejercicios.filter((e) => e.dificultad === digito);
            return (
              <section key={digito}>
                <h2 className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Dígito {digito} ·{" "}
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">{seleccionada.descripciones[digito]}</span>
                </h2>
                {filas.length > 0 && (
                  <ul className="mb-2 flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                    {filas.map((e) => (
                      <li key={e.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-zinc-800 dark:text-zinc-200">{e.enunciado}</p>
                          <BotonEliminarEjercicio id={e.id} habilidadId={habilidadFila.id} dificultad={digito} />
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Respuesta: <span className="font-medium">{e.respuesta}</span>
                          {e.explicacion && <> · {e.explicacion}</>}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">{formatearFecha(e.created_at)}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <FormAgregarEjercicio habilidadId={habilidadFila.id} habilidadNombre={seleccionada.nombre} dificultad={digito} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
