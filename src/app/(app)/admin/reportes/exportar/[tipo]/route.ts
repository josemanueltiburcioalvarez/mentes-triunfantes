import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";
import { aCsv, type CeldaCsv } from "@/lib/csv";
import { NOMBRES_HABILIDAD, TIPOS_SESION } from "@/lib/admin";

type Cliente = Awaited<ReturnType<typeof crearClienteServidor>>;

// Trae todas las filas de una consulta paginando de 1000 en 1000 (limite de la API).
async function traerTodo<T>(pedir: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; desde < 100_000; desde += 1000) {
    const { data, error } = await pedir(desde, desde + 999);
    if (error) throw new Error("consulta");
    filas.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return filas;
}

// AAAA-MM-DD HH:MM:SS (hora de Lima): Excel lo reconoce como fecha y ordena bien
const fecha = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString("sv-SE", { timeZone: "America/Lima" }) : "");

async function estudiantes(supabase: Cliente) {
  const filas = await traerTodo((d, h) => supabase.from("vista_estudiantes_admin").select("*").order("nombre").range(d, h));
  return aCsv(
    ["Nombre", "Correo", "Grado", "Estado", "Nivel actual", "Avance (%)", "Último acceso", "Registrado", "Alertas sin revisar", "Solicitudes de examen abiertas"],
    filas.map((e): CeldaCsv[] => [
      e.nombre, e.email, e.grado_escolar, e.estado, e.nivel_actual, e.avance, fecha(e.fecha_ultimo_acceso), fecha(e.created_at), e.alertas, e.solicitudes_abiertas,
    ])
  );
}

async function progreso(supabase: Cliente) {
  const [perfiles, habilidades, avance] = await Promise.all([
    traerTodo((d, h) => supabase.from("vista_estudiantes_admin").select("id, nombre, email").range(d, h)),
    supabase.from("habilidades").select("id, nombre, orden, nivel:niveles(nombre, orden)"),
    traerTodo((d, h) =>
      supabase
        .from("progreso_habilidad")
        .select("estudiante_id, habilidad_id, porcentaje_dominio, desbloqueada, total_intentos, ultima_practica")
        .range(d, h)
    ),
  ]);
  const alumno = new Map(perfiles.map((p) => [p.id ?? "", p]));
  const hab = new Map((habilidades.data ?? []).map((x) => [x.id, x]));

  const filas = avance
    .filter((a) => alumno.has(a.estudiante_id))
    .map((a) => ({ a, p: alumno.get(a.estudiante_id)!, h: hab.get(a.habilidad_id) }))
    .sort(
      (x, y) =>
        (x.p.nombre ?? "").localeCompare(y.p.nombre ?? "") ||
        (x.h?.nivel?.orden ?? 0) - (y.h?.nivel?.orden ?? 0) ||
        (x.h?.orden ?? 0) - (y.h?.orden ?? 0)
    );
  return aCsv(
    ["Estudiante", "Correo", "Nivel", "Habilidad", "Abierta", "Dominio (%)", "Respuestas", "Última práctica"],
    filas.map(({ a, p, h }): CeldaCsv[] => [
      p.nombre, p.email, h?.nivel?.nombre, NOMBRES_HABILIDAD[h?.nombre ?? ""] ?? h?.nombre, a.desbloqueada ? "Sí" : "No",
      Number(a.porcentaje_dominio), a.total_intentos, fecha(a.ultima_practica),
    ])
  );
}

async function sesiones(supabase: Cliente, desde: string, hasta: string) {
  const inicio = `${desde}T00:00:00-05:00`; // hora de Lima
  const fin = `${hasta}T23:59:59.999-05:00`;
  const [perfiles, filas] = await Promise.all([
    traerTodo((d, h) => supabase.from("vista_estudiantes_admin").select("id, nombre, email").range(d, h)),
    traerTodo((d, h) =>
      supabase
        .from("sesiones")
        .select("id, estudiante_id, tipo, inicio, fin, total_ejercicios, correctos, digito, numero_ejercicio, habilidad:habilidades(nombre), nivel:niveles(nombre)")
        .gte("inicio", inicio)
        .lte("inicio", fin)
        .gt("total_ejercicios", 0)
        .order("inicio", { ascending: false })
        .range(d, h)
    ),
  ]);
  const alumno = new Map(perfiles.map((p) => [p.id ?? "", p]));
  return aCsv(
    ["Fecha", "Estudiante", "Correo", "Tipo", "Habilidad o nivel", "Nivel de dificultad", "Ejercicio", "Correctas", "Total", "Aciertos (%)", "Duración (min)"],
    filas.map((s): CeldaCsv[] => {
      const minutos = s.fin ? Math.round(((new Date(s.fin).getTime() - new Date(s.inicio).getTime()) / 60000) * 10) / 10 : null;
      return [
        fecha(s.inicio),
        alumno.get(s.estudiante_id)?.nombre,
        alumno.get(s.estudiante_id)?.email,
        TIPOS_SESION[s.tipo] ?? s.tipo,
        s.habilidad?.nombre ? (NOMBRES_HABILIDAD[s.habilidad.nombre] ?? s.habilidad.nombre) : `Nivel ${s.nivel?.nombre ?? ""}`,
        s.digito,
        s.numero_ejercicio,
        s.correctos,
        s.total_ejercicios,
        s.total_ejercicios > 0 ? Math.round((1000 * s.correctos) / s.total_ejercicios) / 10 : null,
        minutos,
      ];
    })
  );
}

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (perfil?.rol !== "admin") return new NextResponse("No autorizado", { status: 403 });

  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  let contenido: string;
  try {
    if (tipo === "estudiantes") contenido = await estudiantes(supabase);
    else if (tipo === "progreso") contenido = await progreso(supabase);
    else if (tipo === "sesiones") {
      const desde = request.nextUrl.searchParams.get("desde") ?? "";
      const hasta = request.nextUrl.searchParams.get("hasta") ?? "";
      if (!FECHA_VALIDA.test(desde) || !FECHA_VALIDA.test(hasta) || desde > hasta) {
        return new NextResponse("Fechas no válidas", { status: 400 });
      }
      contenido = await sesiones(supabase, desde, hasta);
    } else return new NextResponse("Reporte no encontrado", { status: 404 });
  } catch {
    return new NextResponse("No se pudo generar el reporte", { status: 500 });
  }

  return new NextResponse(contenido, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mentes-triunfantes-${tipo}-${hoy}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
