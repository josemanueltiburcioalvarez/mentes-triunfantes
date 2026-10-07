import Link from "next/link";
import FormularioAccion from "@/components/formulario-accion";
import type { EstiloNivel } from "@/lib/estilos-nivel";
import { solicitarEvaluacionNivel } from "./acciones";

export interface AutorizacionNivel {
  estado: string;
  meet_url: string | null;
}

// Estado de la evaluacion en vivo de un nivel: pedirla, esperar al profesor, entrar a Meet o ya aprobada.
// La usan la lista de niveles (con marco) y el portal del mapa (sin marco, dentro de su ventana).
export default function BloqueEvaluacion({
  nivelNombre,
  nivelOrden,
  nivelId,
  estilo,
  nivelAprobado,
  todosExamenesAprobados,
  autorizacion,
  esUltimoNivel,
  conMarco,
}: {
  nivelNombre: string;
  nivelOrden: number;
  nivelId: string;
  estilo: EstiloNivel;
  nivelAprobado: boolean;
  todosExamenesAprobados: boolean;
  autorizacion: AutorizacionNivel | undefined;
  esUltimoNivel: boolean;
  conMarco: boolean;
}) {
  const marco = conMarco
    ? `mt-3 rounded-xl border p-4 backdrop-blur-sm ${
        nivelAprobado
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
          : `${estilo.borde} ${estilo.fondoTarjeta}`
      }`
    : "";

  return (
    <div className={`text-center ${marco}`}>
      <div className="mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Evaluación del nivel {nivelNombre}</div>

      {nivelAprobado ? (
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">¡Nivel aprobado!</span>
      ) : !todosExamenesAprobados ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Aprueba el examen final de todas las habilidades del nivel para poder solicitarla
        </span>
      ) : autorizacion?.estado === "autorizado" && autorizacion.meet_url ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tu profesor autorizó la evaluación. Entra a la reunión de Meet y luego comienza.
          </p>
          <a
            href={autorizacion.meet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
          >
            Abrir reunión de Meet
          </a>
          <Link
            href={`/nivel/${nivelOrden}/examen`}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Ir a la evaluación
          </Link>
        </div>
      ) : autorizacion?.estado === "solicitado" ? (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Solicitud enviada. Tu profesor te enviará el link de Meet.
        </span>
      ) : (
        <FormularioAccion accion={solicitarEvaluacionNivel} className="flex flex-col items-center gap-2">
          <input type="hidden" name="nivel_id" value={nivelId} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {esUltimoNivel
              ? "Se rinde en vivo por Meet con tu profesor y cierra el programa."
              : "Se rinde en vivo por Meet con tu profesor y da acceso al siguiente nivel."}
          </p>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Solicitar evaluación de nivel
          </button>
        </FormularioAccion>
      )}
    </div>
  );
}
