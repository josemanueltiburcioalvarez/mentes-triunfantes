import Image from "next/image";

// El logo es negro sobre transparente; en modo oscuro se usa la version blanca. "emblema" es solo la M·T
// (para el encabezado) y "completo" lleva debajo "Mentes Triunfantes".
const MEDIDAS = {
  completo: { ancho: 700, alto: 368, negro: "/logo-completo-negro.png", blanco: "/logo-completo-blanco.png" },
  emblema: { ancho: 700, alto: 310, negro: "/logo-emblema-negro.png", blanco: "/logo-emblema-blanco.png" },
} as const;

export default function Logo({
  variante,
  ancho,
  prioridad = false,
  className = "",
}: {
  variante: keyof typeof MEDIDAS;
  ancho: number;
  prioridad?: boolean;
  className?: string;
}) {
  const m = MEDIDAS[variante];
  const alto = Math.round((ancho * m.alto) / m.ancho);
  return (
    <>
      <Image src={m.negro} alt="Mentes Triunfantes" width={ancho} height={alto} priority={prioridad} className={`dark:hidden ${className}`} />
      <Image src={m.blanco} alt="" aria-hidden width={ancho} height={alto} priority={prioridad} className={`hidden dark:block ${className}`} />
    </>
  );
}
