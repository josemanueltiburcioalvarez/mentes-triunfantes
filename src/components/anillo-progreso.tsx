// Anillo de progreso (0 a 100) con el valor o cualquier contenido al centro.
export default function AnilloProgreso({
  valor,
  tamano = 112,
  grosor = 9,
  color = "text-emerald-500",
  etiqueta,
  children,
}: {
  valor: number;
  tamano?: number;
  grosor?: number;
  color?: string;
  etiqueta: string;
  children?: React.ReactNode;
}) {
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const v = Math.max(0, Math.min(100, valor));

  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }} role="img" aria-label={etiqueta}>
      <svg width={tamano} height={tamano} className="-rotate-90" aria-hidden>
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          stroke="currentColor"
          strokeWidth={grosor}
          className="text-zinc-200 dark:text-zinc-800"
        />
        {v > 0 && (
          <circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            fill="none"
            stroke="currentColor"
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={circunferencia * (1 - v / 100)}
            className={color}
            style={{ filter: "drop-shadow(0 0 5px currentColor)" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
