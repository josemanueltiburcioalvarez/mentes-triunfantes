// Precios y datos de pago. Todo cambia aqui: no hay pasarela, el estudiante paga por Yape/Plin y manda el
// comprobante por WhatsApp; el admin registra el pago en /admin/suscripciones y recien ahi se activa el plan.
export const PRECIO_MENSUAL = 50;

export interface Plan {
  meses: number;
  precio: number;
}

// 3, 6 y 12 meses con descuento creciente (10 %, 15 % y 20 % sobre el precio mensual)
export const PLANES: Plan[] = [
  { meses: 1, precio: 50 },
  { meses: 3, precio: 135 },
  { meses: 6, precio: 255 },
  { meses: 12, precio: 480 },
];

export const DATOS_PAGO = {
  metodo: "Yape o Plin",
  numero: "923 768 233",
  titular: "Jose Tiburcio",
  // WhatsApp con codigo de pais (Peru: 51) y sin espacios; se asume que es el mismo numero del Yape/Plin
  whatsapp: "51923768233",
};

export function textoMeses(meses: number): string {
  return meses === 1 ? "1 mes" : `${meses} meses`;
}

export function ahorroDelPlan(plan: Plan): number {
  return PRECIO_MENSUAL * plan.meses - plan.precio;
}

export function enlaceWhatsApp(plan: Plan | null, nombre: string, email: string): string {
  const texto = plan
    ? `Hola, soy ${nombre} (${email}). Pagué el plan de ${textoMeses(plan.meses)} por S/ ${plan.precio}. Te envío mi comprobante.`
    : `Hola, soy ${nombre} (${email}). Quiero activar mi plan en Mentes Triunfantes.`;
  return `https://wa.me/${DATOS_PAGO.whatsapp}?text=${encodeURIComponent(texto)}`;
}
