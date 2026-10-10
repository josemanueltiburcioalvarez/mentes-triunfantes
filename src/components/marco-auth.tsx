import FondoEstudiante from "@/components/fondo-estudiante";
import Logo from "@/components/logo";

// Mismo marco que el login (fondo con luces, logo y tarjeta) para las pantallas de acceso:
// recuperar y cambiar la contrasena.
export const CAMPO_AUTH =
  "w-full rounded-xl border border-zinc-300 bg-white/70 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-600";

export const BOTON_AUTH =
  "mt-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_-4px_rgba(16,185,129,0.65)] transition-colors hover:bg-emerald-400 disabled:opacity-50";

export default function MarcoAuth({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fondo-estudiante relative flex flex-1 items-center justify-center overflow-x-clip px-4 py-10">
      <FondoEstudiante />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <Logo variante="completo" ancho={210} prioridad className="mb-6 h-auto" />

        <div className="w-full rounded-2xl border border-zinc-200 bg-white/80 p-7 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-[0_0_44px_-14px_rgba(16,185,129,0.45)]">
          <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{titulo}</h1>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">{descripcion}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
