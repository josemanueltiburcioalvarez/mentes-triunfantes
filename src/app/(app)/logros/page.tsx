import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cargarLogros, ESTILO_CATEGORIA, NOMBRES_CATEGORIA, type CategoriaLogro } from "@/lib/logros";
import FondoEstudiante from "@/components/fondo-estudiante";
import InsigniaLogro from "@/components/logros/insignia-logro";
import RachaTira from "@/components/logros/racha-tira";

const CATEGORIAS: CategoriaLogro[] = ["practica", "dominio", "examenes", "constancia"];

export default async function LogrosPage() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: perfil }, { logros, racha }] = await Promise.all([
    supabase.from("perfiles").select("rol").eq("id", user.id).single(),
    cargarLogros(supabase, user.id),
  ]);
  if (perfil?.rol !== "estudiante") redirect("/");

  const logrados = logros.filter((l) => l.logrado).length;

  return (
    <div className="fondo-estudiante relative flex-1 overflow-x-clip">
      <FondoEstudiante />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/dashboard" className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
          ← Volver al panel
        </Link>

        <div className="mb-6 mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Tus logros</h1>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {logrados} de {logros.length}
          </span>
        </div>

        <div className="mb-8 max-w-md rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <RachaTira racha={racha} />
        </div>

        <div className="flex flex-col gap-8">
          {CATEGORIAS.map((categoria) => {
            const deLaCategoria = logros.filter((l) => l.categoria === categoria);
            return (
              <section key={categoria}>
                <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">{NOMBRES_CATEGORIA[categoria]}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {deLaCategoria.map((logro) => (
                    <div
                      key={logro.id}
                      className={`flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-sm ${
                        logro.logrado
                          ? "border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/70"
                          : "border-zinc-200/70 bg-white/50 dark:border-zinc-800 dark:bg-zinc-900/40"
                      }`}
                    >
                      <InsigniaLogro logro={logro} tamano={56} />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-bold ${logro.logrado ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400"}`}>
                          {logro.nombre}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{logro.descripcion}</div>
                        {logro.logrado ? (
                          <div className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">¡Logrado!</div>
                        ) : (
                          <div className="mt-2">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <div
                                className={`h-full rounded-full ${ESTILO_CATEGORIA[logro.categoria].barra}`}
                                style={{ width: `${Math.round((logro.actual / logro.meta) * 100)}%` }}
                              />
                            </div>
                            <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                              {logro.actual} de {logro.meta}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
