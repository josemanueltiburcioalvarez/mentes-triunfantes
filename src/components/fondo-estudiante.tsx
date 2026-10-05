// Decoracion del panel del estudiante: simbolos matematicos y una constelacion muy tenues, solo
// donde sobra espacio a los lados. No lleva imagenes (pesa casi nada en el celular).
const SIMBOLOS: { t: string; lado: "izq" | "der"; arriba: string; lado_px: string; tam: string }[] = [
  { t: "×", lado: "izq", arriba: "6%", lado_px: "3%", tam: "text-5xl" },
  { t: "√", lado: "izq", arriba: "22%", lado_px: "1.5%", tam: "text-6xl" },
  { t: "÷", lado: "izq", arriba: "41%", lado_px: "4%", tam: "text-5xl" },
  { t: "Σ", lado: "izq", arriba: "60%", lado_px: "2%", tam: "text-5xl" },
  { t: "π", lado: "izq", arriba: "79%", lado_px: "3.5%", tam: "text-5xl" },
  { t: "+", lado: "der", arriba: "12%", lado_px: "3%", tam: "text-5xl" },
  { t: "=", lado: "der", arriba: "33%", lado_px: "1.5%", tam: "text-6xl" },
  { t: "∫", lado: "der", arriba: "52%", lado_px: "4%", tam: "text-6xl" },
  { t: "x²", lado: "der", arriba: "71%", lado_px: "2%", tam: "text-4xl" },
  { t: "−", lado: "der", arriba: "88%", lado_px: "3.5%", tam: "text-5xl" },
];

export default function FondoEstudiante() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden select-none overflow-hidden md:block">
      {SIMBOLOS.map((s) => (
        <span
          key={s.t + s.arriba}
          className={`absolute font-mono font-light text-zinc-900/[0.06] dark:text-white/[0.07] ${s.tam}`}
          style={{ top: s.arriba, [s.lado === "izq" ? "left" : "right"]: s.lado_px }}
        >
          {s.t}
        </span>
      ))}

      {/* constelaciones */}
      <svg
        viewBox="0 0 220 150"
        className="absolute left-[2%] top-[30%] hidden w-52 text-zinc-900/[0.12] lg:block dark:text-white/[0.14]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <polyline points="10,120 50,70 95,85 140,30 200,50" />
        <polyline points="95,85 120,125 170,110" />
        {[
          [10, 120],
          [50, 70],
          [95, 85],
          [140, 30],
          [200, 50],
          [120, 125],
          [170, 110],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="currentColor" stroke="none" />
        ))}
      </svg>
      <svg
        viewBox="0 0 220 150"
        className="absolute bottom-[12%] right-[2%] hidden w-52 text-zinc-900/[0.12] lg:block dark:text-white/[0.14]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <polyline points="15,40 70,25 110,70 165,55 205,110" />
        <polyline points="110,70 90,125" />
        {[
          [15, 40],
          [70, 25],
          [110, 70],
          [165, 55],
          [205, 110],
          [90, 125],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="currentColor" stroke="none" />
        ))}
      </svg>
    </div>
  );
}
