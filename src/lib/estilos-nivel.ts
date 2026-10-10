// Un color por nivel (Basico, Intermedio, Avanzado, Experto) para que el estudiante identifique de un
// vistazo en que etapa esta. Las clases van completas (no interpoladas) para que Tailwind las detecte.
export interface EstiloNivel {
  borde: string;
  fondoTarjeta: string;
  textoTitulo: string;
  badge: string;
  barra: string;
  iconoFondo: string;
  iconoColor: string;
  // resplandor de la tarjeta y de la barra (solo se nota en modo oscuro / sobre el fondo)
  brillo: string;
  barraBrillo: string;
  anillo: string;
  // filtro CSS que lleva la medalla de arte (verde) al color del nivel
  tono: string;
}

const BASICO: EstiloNivel = {
  borde: "border-emerald-200 dark:border-emerald-900",
  fondoTarjeta: "bg-emerald-50 dark:bg-emerald-950/30",
  textoTitulo: "text-emerald-700 dark:text-emerald-400",
  badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  barra: "bg-emerald-500",
  iconoFondo: "bg-emerald-100 dark:bg-emerald-900",
  iconoColor: "text-emerald-600 dark:text-emerald-400",
  brillo: "dark:shadow-[0_0_26px_-10px_rgba(16,185,129,0.6)]",
  barraBrillo: "shadow-[0_0_10px_rgba(16,185,129,0.65)]",
  anillo: "text-emerald-500 dark:text-emerald-400",
  tono: "none",
};

const INTERMEDIO: EstiloNivel = {
  borde: "border-blue-200 dark:border-blue-900",
  fondoTarjeta: "bg-blue-50 dark:bg-blue-950/30",
  textoTitulo: "text-blue-700 dark:text-blue-400",
  badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  barra: "bg-blue-500",
  iconoFondo: "bg-blue-100 dark:bg-blue-900",
  iconoColor: "text-blue-600 dark:text-blue-400",
  brillo: "dark:shadow-[0_0_26px_-10px_rgba(59,130,246,0.6)]",
  barraBrillo: "shadow-[0_0_10px_rgba(59,130,246,0.65)]",
  anillo: "text-blue-500 dark:text-blue-400",
  tono: "hue-rotate(60deg)",
};

const AVANZADO: EstiloNivel = {
  borde: "border-violet-200 dark:border-violet-900",
  fondoTarjeta: "bg-violet-50 dark:bg-violet-950/30",
  textoTitulo: "text-violet-700 dark:text-violet-400",
  badge: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  barra: "bg-violet-500",
  iconoFondo: "bg-violet-100 dark:bg-violet-900",
  iconoColor: "text-violet-600 dark:text-violet-400",
  brillo: "dark:shadow-[0_0_26px_-10px_rgba(139,92,246,0.6)]",
  barraBrillo: "shadow-[0_0_10px_rgba(139,92,246,0.65)]",
  anillo: "text-violet-500 dark:text-violet-400",
  tono: "hue-rotate(110deg)",
};

const EXPERTO: EstiloNivel = {
  borde: "border-amber-200 dark:border-amber-900",
  fondoTarjeta: "bg-amber-50 dark:bg-amber-950/30",
  textoTitulo: "text-amber-700 dark:text-amber-400",
  badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  barra: "bg-amber-500",
  iconoFondo: "bg-amber-100 dark:bg-amber-900",
  iconoColor: "text-amber-600 dark:text-amber-400",
  brillo: "dark:shadow-[0_0_26px_-10px_rgba(245,158,11,0.6)]",
  barraBrillo: "shadow-[0_0_10px_rgba(245,158,11,0.65)]",
  anillo: "text-amber-500 dark:text-amber-400",
  tono: "hue-rotate(-115deg)",
};

// por "orden" del nivel (1 a 4); si hay un quinto nivel algun dia, cae en el estilo de Experto.
const ESTILOS: EstiloNivel[] = [BASICO, INTERMEDIO, AVANZADO, EXPERTO];

export function estiloNivel(orden: number): EstiloNivel {
  return ESTILOS[Math.min(orden, ESTILOS.length) - 1] ?? EXPERTO;
}
