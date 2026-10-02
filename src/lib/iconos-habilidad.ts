import {
  Brain,
  Divide,
  GitMerge,
  Minus,
  Plus,
  Puzzle,
  Radical,
  Scale,
  Superscript,
  Table2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { HabilidadPracticable } from "./ejercicios/generador";

// Un icono por "familia" de operacion: las versiones con signo (_enteros) reusan el mismo, la
// habilidad se distingue igual por el color del nivel y el nombre.
export const ICONOS_HABILIDAD: Record<HabilidadPracticable, LucideIcon> = {
  suma: Plus,
  resta: Minus,
  tabla_multiplicacion: Table2,
  multiplicacion: X,
  division: Divide,
  potencia: Superscript,
  raiz: Radical,
  operaciones_combinadas: Puzzle,
  suma_enteros: Plus,
  resta_enteros: Minus,
  multiplicacion_enteros: X,
  division_enteros: Divide,
  potencia_enteros: Superscript,
  raiz_enteros: Radical,
  ecuaciones: Scale,
  combinadas_enteros: Puzzle,
  sistemas_ecuaciones: GitMerge,
  atajos: Zap,
  razonamiento: Brain,
};
