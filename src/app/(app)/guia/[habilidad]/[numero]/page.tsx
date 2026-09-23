import Link from "next/link";
import { notFound } from "next/navigation";
import { esHabilidadPracticable, NOMBRES_HABILIDAD } from "@/lib/ejercicios/generador";
import { guiasDe } from "@/lib/guias/catalogo";
import GuiaPasoAPaso from "@/components/guia/guia-paso-a-paso";
import GuiaConsejosVista from "@/components/guia/guia-consejos";

export default async function GuiaPage({
  params,
}: {
  params: Promise<{ habilidad: string; numero: string }>;
}) {
  const { habilidad, numero } = await params;
  if (!esHabilidadPracticable(habilidad)) notFound();

  const guias = guiasDe(habilidad);
  const guia = guias.find((g) => String(g.numero) === numero);
  if (!guia) notFound();

  const practicarHref = `/practicar/${habilidad}`;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Guía de {NOMBRES_HABILIDAD[habilidad]}
        </h1>
        <Link href={practicarHref} className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
          Ir a practicar
        </Link>
      </div>

      {guias.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {guias.map((g) => (
            <Link
              key={g.numero}
              href={`/guia/${habilidad}/${g.numero}`}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                g.numero === guia.numero
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              Guía {g.numero}: {g.titulo}
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-1 text-lg font-medium text-zinc-800 dark:text-zinc-200">{guia.titulo}</h2>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">{guia.resumen}</p>

      {guia.tipo === "pasos" ? (
        <GuiaPasoAPaso key={`${habilidad}-${guia.numero}`} pasos={guia.pasos} practicarHref={practicarHref} />
      ) : (
        <GuiaConsejosVista secciones={guia.secciones} mostrarTabla={habilidad === "tabla_multiplicacion"} />
      )}

      {guia.tipo === "consejos" && (
        <div className="mt-8 text-center">
          <Link
            href={practicarHref}
            className="inline-block rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Ir a practicar
          </Link>
        </div>
      )}

      {guia.tipo === "pasos" && guias.some((g) => g.numero === guia.numero + 1) && (
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿Quieres verlo con números más grandes?{" "}
          <Link href={`/guia/${habilidad}/${guia.numero + 1}`} className="text-blue-600 underline-offset-2 hover:underline dark:text-blue-400">
            Ver la guía {guia.numero + 1}
          </Link>
        </p>
      )}
    </div>
  );
}
