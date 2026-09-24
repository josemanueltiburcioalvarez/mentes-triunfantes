export type EstiloCelda = "normal" | "foco" | "marca" | "resultado" | "tachado" | "apagado";

export interface Celda {
  t: string;
  e?: EstiloCelda;
}

export interface FilaEscena {
  op?: string;
  celdas: Celda[];
  linea?: boolean;
  chica?: boolean;
}

export interface EscenaColumnas {
  tipo: "columnas";
  columnas: number;
  filas: FilaEscena[];
}

// fase de un paso de la division: 0 nada, 1 cifra del cociente, 2 producto, 3 resto, 4 cifra bajada
export interface EscenaDivision {
  tipo: "division";
  dividendo: number;
  divisor: number;
  paso: number;
  fase: number;
  focoDesde: number;
  focoHasta: number;
}

export interface LineaEscena {
  t: string;
  e?: "normal" | "foco" | "resultado" | "apagado" | "tachado";
}

// lista de lineas de texto (potencias, raices, operaciones combinadas)
export interface EscenaLineas {
  tipo: "lineas";
  lineas: LineaEscena[];
}

export interface PasoGuia {
  titulo: string;
  texto: string; // admite **negrita**
  escena: EscenaColumnas | EscenaDivision | EscenaLineas;
}

export interface GuiaPasos {
  tipo: "pasos";
  numero: number;
  titulo: string;
  resumen: string;
  pasos: PasoGuia[];
}

export interface SeccionConsejo {
  titulo: string;
  texto: string;
  ejemplo?: string;
}

export interface GuiaConsejos {
  tipo: "consejos";
  numero: number;
  titulo: string;
  resumen: string;
  secciones: SeccionConsejo[];
}

export type Guia = GuiaPasos | GuiaConsejos;
