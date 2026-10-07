import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, CalendarDays, ChevronRight, Lock, Medal } from "lucide-react";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esHabilidadPracticable, HABILIDADES_PRACTICABLES, NOMBRES_HABILIDAD } from "@/lib/ejercicios/generador";
import { estiloNivel } from "@/lib/estilos-nivel";
import { ICONOS_HABILIDAD } from "@/lib/iconos-habilidad";
import { nombreGrado } from "@/lib/grados";
import AnilloProgreso from "@/components/anillo-progreso";
import FondoEstudiante from "@/components/fondo-estudiante";
import MapaNiveles, { type NivelMapa } from "@/components/mapa/mapa-niveles";
import SelectorVista from "@/components/mapa/selector-vista";
import TarjetaRachaLogros from "@/components/logros/tarjeta-racha-logros";
import { cargarLogros } from "@/lib/logros";
import BloqueEvaluacion from "./bloque-evaluacion";

const ORDEN_HABILIDADES = [
  ...HABILIDADES_PRACTICABLES,
  "atajos",
  "razonamiento",
] as const;

type NombreHabilidad = (typeof ORDEN_HABILIDADES)[number];

const NOMBRES_LEGIBLES: Record<NombreHabilidad, string> = {
  ...NOMBRES_HABILIDAD,
  atajos: "Atajos",
  razonamiento: "Razonamiento",
};

const TARJETA_PANEL =
  "rounded-2xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60";

export default async function DashboardPage() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // todas las consultas viajan juntas (en vez de esperar el rol y el resumen antes de lanzar el resto)
  const [
    { data: perfil },
    { data: filas },
    { data: nivelesTabla },
    { data: habilidadesTabla },
    { data: examenesHabilidad },
    { data: evaluacionesNivel },
    { data: autorizacionesNivel },
    { logros, racha },
  ] = await Promise.all([
    supabase.from("perfiles").select("rol, modalidad").eq("id", user.id).single(),
    supabase.from("vista_resumen_estudiante").select("*").eq("estudiante_id", user.id),
    supabase.from("niveles").select("id, nombre, orden, modalidad"),
    supabase.from("habilidades").select("id, nivel_id, nombre"),
    supabase.from("evaluaciones_habilidad").select("habilidad_id").eq("estudiante_id", user.id).eq("aprobado", true),
    supabase.from("evaluaciones_nivel").select("nivel_id").eq("estudiante_id", user.id).eq("aprobado", true),
    supabase
      .from("autorizaciones_examen")
      .select("nivel_id, estado, meet_url")
      .eq("estudiante_id", user.id)
      .not("nivel_id", "is", null)
      .in("estado", ["solicitado", "autorizado"]),
    cargarLogros(supabase, user.id),
  ]);

  if (perfil?.rol === "admin") redirect("/admin");
  if (perfil?.rol === "profesor") redirect("/profesor");

  // hay un nivel con el mismo "orden" por modalidad: solo cuentan los de la modalidad del estudiante
  const modalidad = perfil?.modalidad ?? "primaria";
  const nivelesDeLaModalidad = (nivelesTabla ?? []).filter((n) => n.modalidad === modalidad);

  const idsExamenesAprobados = new Set((examenesHabilidad ?? []).map((e) => e.habilidad_id));
  const idsNivelesAprobados = new Set((evaluacionesNivel ?? []).map((e) => e.nivel_id));

  const niveles = new Map<
    string,
    { nombre: string; orden: number; habilidades: NonNullable<typeof filas>[number][] }
  >();

  for (const fila of filas ?? []) {
    if (!fila.nivel_nombre) continue;
    const clave = fila.nivel_nombre;
    if (!niveles.has(clave)) {
      niveles.set(clave, { nombre: clave, orden: fila.nivel_orden ?? 0, habilidades: [] });
    }
    niveles.get(clave)!.habilidades.push(fila);
  }

  const nivelesOrdenados = Array.from(niveles.values())
    .sort((a, b) => a.orden - b.orden)
    .map((nivel) => ({
      ...nivel,
      habilidades: nivel.habilidades
        .slice()
        .sort(
          (a, b) =>
            ORDEN_HABILIDADES.indexOf(a.habilidad_nombre as NombreHabilidad) -
            ORDEN_HABILIDADES.indexOf(b.habilidad_nombre as NombreHabilidad)
        ),
    }));

  const nivelActual = filas?.[0]?.nivel_actual ?? null;
  const diasActivos = filas?.[0]?.dias_activos ?? 0;
  const grado = filas?.[0]?.grado_escolar ?? null;
  const ordenActual = nivelesOrdenados.find((n) => n.nombre === nivelActual)?.orden ?? 1;
  const estiloActual = estiloNivel(ordenActual);

  // habilidades con el examen final aprobado (se marcan con una medalla), por nivel y nombre
  const medallas = new Set<string>();
  for (const h of habilidadesTabla ?? []) {
    const nivel = nivelesDeLaModalidad.find((n) => n.id === h.nivel_id);
    if (nivel && idsExamenesAprobados.has(h.id)) medallas.add(`${nivel.orden}-${h.nombre}`);
  }

  // avance general: promedio del dominio (atajos y razonamiento todavia no tienen ejercicios)
  const conEjercicios = (filas ?? []).filter(
    (f) => f.habilidad_nombre !== "atajos" && f.habilidad_nombre !== "razonamiento"
  );
  const avanceGeneral = conEjercicios.length
    ? Math.round(conEjercicios.reduce((suma, f) => suma + Number(f.porcentaje_dominio ?? 0), 0) / conEjercicios.length)
    : 0;

  // siguiente reto: la primera habilidad abierta que todavia no domina
  let siguiente: { nivelOrden: number; fila: NonNullable<typeof filas>[number] } | null = null;
  for (const nivel of nivelesOrdenados) {
    const fila = nivel.habilidades.find(
      (h) =>
        h.desbloqueada &&
        esHabilidadPracticable(h.habilidad_nombre ?? "") &&
        h.habilidad_nombre !== "atajos" &&
        h.habilidad_nombre !== "razonamiento" &&
        Math.round(h.porcentaje_dominio ?? 0) < 100
    );
    if (fila) {
      siguiente = { nivelOrden: nivel.orden, fila };
      break;
    }
  }

  const siguienteProps = siguiente
    ? {
        nombre: NOMBRES_LEGIBLES[siguiente.fila.habilidad_nombre as NombreHabilidad],
        habilidad: siguiente.fila.habilidad_nombre as NombreHabilidad,
        dominio: Math.round(siguiente.fila.porcentaje_dominio ?? 0),
        nivelOrden: siguiente.nivelOrden,
      }
    : null;

  const lista = (
    <div key="lista" className="flex flex-col gap-8">
          {nivelesOrdenados.map((nivel) => {
            const nivelFila = nivelesDeLaModalidad.find((n) => n.orden === nivel.orden);
            const habilidadesDelNivel = (habilidadesTabla ?? []).filter((h) => h.nivel_id === nivelFila?.id);
            const nivelListoParaEvaluar =
              habilidadesDelNivel.length > 0 && habilidadesDelNivel.every((h) => esHabilidadPracticable(h.nombre));
            const todosExamenesAprobados = habilidadesDelNivel.every((h) => idsExamenesAprobados.has(h.id));
            const nivelAprobado = nivelFila ? idsNivelesAprobados.has(nivelFila.id) : false;
            const autorizacion = (autorizacionesNivel ?? []).find((a) => a.nivel_id === nivelFila?.id);
            const estilo = estiloNivel(nivel.orden);
            const aprobadasDelNivel = habilidadesDelNivel.filter((h) => idsExamenesAprobados.has(h.id)).length;

            return (
              <section key={nivel.nombre}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className={`text-lg font-semibold ${estilo.textoTitulo}`}>{nivel.nombre}</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${estilo.badge}`}>
                    {aprobadasDelNivel}/{habilidadesDelNivel.length}
                  </span>
                </div>

                {/* celular: lista compacta de accesos, una fila por habilidad */}
                <div className="flex flex-col gap-2 sm:hidden">
                  {nivel.habilidades.map((h) => {
                    const nombreHabilidad = h.habilidad_nombre as NombreHabilidad;
                    const dominio = Math.round(h.porcentaje_dominio ?? 0);
                    const desbloqueada = h.desbloqueada ?? false;
                    const tienePractica = esHabilidadPracticable(nombreHabilidad);
                    const Icono = ICONOS_HABILIDAD[nombreHabilidad];
                    const puedeEntrar = desbloqueada && tienePractica;
                    const conMedalla = medallas.has(`${nivel.orden}-${nombreHabilidad}`);

                    const fila = (
                      <div
                        className={`flex items-center gap-3 rounded-xl border p-3 backdrop-blur-sm transition-colors ${
                          desbloqueada
                            ? `${estilo.borde} ${estilo.fondoTarjeta} ${estilo.brillo} ${puedeEntrar ? "active:brightness-95" : ""}`
                            : "border-zinc-100 bg-zinc-100/60 dark:border-zinc-900 dark:bg-zinc-900/40"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            desbloqueada
                              ? `${estilo.iconoFondo} ${estilo.iconoColor}`
                              : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                          }`}
                        >
                          {desbloqueada ? <Icono className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                              {NOMBRES_LEGIBLES[nombreHabilidad]}
                            </span>
                            {conMedalla && <Award className="h-4 w-4 shrink-0 text-amber-500" aria-label="Examen aprobado" />}
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className={`h-full rounded-full ${
                                desbloqueada ? `${estilo.barra} ${dominio > 0 ? estilo.barraBrillo : ""}` : "bg-zinc-300 dark:bg-zinc-700"
                              }`}
                              style={{ width: `${dominio}%` }}
                            />
                          </div>
                        </div>
                        {puedeEntrar ? (
                          <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
                        ) : (
                          <span className="shrink-0 text-[10px] font-medium text-zinc-400">
                            {desbloqueada ? "Pronto" : ""}
                          </span>
                        )}
                      </div>
                    );

                    return puedeEntrar ? (
                      <Link key={nombreHabilidad} href={`/practicar/${nombreHabilidad}`}>
                        {fila}
                      </Link>
                    ) : (
                      <div key={nombreHabilidad}>{fila}</div>
                    );
                  })}
                </div>

                {/* tablet/escritorio: tarjetas con la practica y la guia a la vista */}
                <div className="hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-3">
                  {nivel.habilidades.map((h) => {
                    const nombreHabilidad = h.habilidad_nombre as NombreHabilidad;
                    const dominio = Math.round(h.porcentaje_dominio ?? 0);
                    const desbloqueada = h.desbloqueada ?? false;
                    const tienePractica = esHabilidadPracticable(nombreHabilidad);
                    const Icono = ICONOS_HABILIDAD[nombreHabilidad];
                    const conMedalla = medallas.has(`${nivel.orden}-${nombreHabilidad}`);

                    return (
                      <div
                        key={nombreHabilidad}
                        className={`rounded-xl border p-4 backdrop-blur-sm transition-shadow ${
                          desbloqueada
                            ? `${estilo.borde} ${estilo.fondoTarjeta} ${estilo.brillo} hover:shadow-md`
                            : "border-zinc-100 bg-zinc-100/60 dark:border-zinc-900 dark:bg-zinc-900/40"
                        }`}
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              desbloqueada
                                ? `${estilo.iconoFondo} ${estilo.iconoColor}`
                                : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                            }`}
                          >
                            {desbloqueada ? <Icono className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </span>
                          <span className="min-w-0 flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {NOMBRES_LEGIBLES[nombreHabilidad]}
                          </span>
                          {conMedalla && <Award className="h-5 w-5 shrink-0 text-amber-500" aria-label="Examen aprobado" />}
                        </div>

                        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className={`h-full rounded-full ${
                              desbloqueada ? `${estilo.barra} ${dominio > 0 ? estilo.barraBrillo : ""}` : "bg-zinc-300 dark:bg-zinc-700"
                            }`}
                            style={{ width: `${dominio}%` }}
                          />
                        </div>
                        <div className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{dominio}% de dominio</div>

                        {desbloqueada && tienePractica ? (
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/practicar/${nombreHabilidad}`}
                              className="inline-block rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                            >
                              Practicar
                            </Link>
                            <Link
                              href={`/guia/${nombreHabilidad}/1`}
                              className="text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                            >
                              Ver guía
                            </Link>
                          </div>
                        ) : desbloqueada ? (
                          <span className="text-xs text-zinc-400">Próximamente</span>
                        ) : (
                          <span className="text-xs text-zinc-400">Bloqueada</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {nivelListoParaEvaluar && nivelFila && (
                  <BloqueEvaluacion
                    nivelNombre={nivel.nombre}
                    nivelOrden={nivel.orden}
                    nivelId={nivelFila.id}
                    estilo={estilo}
                    nivelAprobado={nivelAprobado}
                    todosExamenesAprobados={todosExamenesAprobados}
                    autorizacion={autorizacion}
                    esUltimoNivel={nivel.orden >= nivelesOrdenados[nivelesOrdenados.length - 1].orden}
                    conMarco
                  />
                )}
              </section>
            );
          })}
    </div>
  );

  const datosMapa: NivelMapa[] = nivelesOrdenados.map((nivel) => {
    const nivelFila = nivelesDeLaModalidad.find((n) => n.orden === nivel.orden);
    const habilidadesDelNivel = (habilidadesTabla ?? []).filter((h) => h.nivel_id === nivelFila?.id);
    const nivelListoParaEvaluar =
      habilidadesDelNivel.length > 0 && habilidadesDelNivel.every((h) => esHabilidadPracticable(h.nombre));
    const todosExamenesAprobados = habilidadesDelNivel.every((h) => idsExamenesAprobados.has(h.id));
    const nivelAprobado = nivelFila ? idsNivelesAprobados.has(nivelFila.id) : false;
    const autorizacion = (autorizacionesNivel ?? []).find((a) => a.nivel_id === nivelFila?.id);

    const nodos = nivel.habilidades.map((h, i) => {
      const slug = h.habilidad_nombre as NombreHabilidad;
      const previa = i > 0 ? nivel.habilidades[i - 1] : null;
      return {
        slug,
        nombre: NOMBRES_LEGIBLES[slug],
        dominio: Math.round(h.porcentaje_dominio ?? 0),
        desbloqueada: h.desbloqueada ?? false,
        practicable: esHabilidadPracticable(slug),
        medalla: medallas.has(`${nivel.orden}-${slug}`),
        siguiente: siguiente?.nivelOrden === nivel.orden && siguiente.fila.habilidad_nombre === slug,
        textoBloqueo: previa
          ? `Aprueba el examen final de ${NOMBRES_LEGIBLES[previa.habilidad_nombre as NombreHabilidad]} para abrirla.`
          : "Se abre al aprobar la evaluación del nivel anterior.",
      };
    });

    return {
      orden: nivel.orden,
      nombre: nivel.nombre,
      aprobadas: habilidadesDelNivel.filter((h) => idsExamenesAprobados.has(h.id)).length,
      total: habilidadesDelNivel.length,
      nivelAprobado,
      abierto: nodos.some((n) => n.desbloqueada),
      nodos,
      estadoPortal: nivelAprobado ? "aprobado" : todosExamenesAprobados ? "listo" : "bloqueado",
      portal:
        nivelListoParaEvaluar && nivelFila ? (
          <BloqueEvaluacion
            nivelNombre={nivel.nombre}
            nivelOrden={nivel.orden}
            nivelId={nivelFila.id}
            estilo={estiloNivel(nivel.orden)}
            nivelAprobado={nivelAprobado}
            todosExamenesAprobados={todosExamenesAprobados}
            autorizacion={autorizacion}
            esUltimoNivel={nivel.orden >= nivelesOrdenados[nivelesOrdenados.length - 1].orden}
            conMarco={false}
          />
        ) : null,
    };
  });
  const mapa = <MapaNiveles key="mapa" niveles={datosMapa} />;

  return (
    <div className="fondo-estudiante relative flex-1 overflow-x-clip">
      <FondoEstudiante />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Tu progreso</h1>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <aside className="order-2 flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <div className={`${TARJETA_PANEL} p-4`}>
              <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Tu perfil académico</h2>
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${estiloActual.iconoFondo} ${estiloActual.iconoColor}`}
                    >
                      <Medal className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Nivel actual</div>
                      <div className={`text-lg font-bold leading-tight ${estiloActual.textoTitulo}`}>
                        {nivelActual ?? "Básico"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Días activos</div>
                      <div className="text-lg font-bold leading-tight text-zinc-800 dark:text-zinc-100">{diasActivos}</div>
                    </div>
                  </div>
                </div>
                <AnilloProgreso valor={avanceGeneral} color={estiloActual.anillo} etiqueta={`Avance general: ${avanceGeneral}%`}>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{avanceGeneral}%</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">avance</span>
                </AnilloProgreso>
              </div>
              {grado && <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{nombreGrado(grado)}</div>}
            </div>

            {siguienteProps && (
              <div className="hidden lg:block">
                <SiguienteReto {...siguienteProps} />
              </div>
            )}

            <TarjetaRachaLogros racha={racha} logros={logros} />
          </aside>

          <div className="order-1">
            {siguienteProps && <SiguienteRetoCompacto {...siguienteProps} />}
            <SelectorVista mapa={mapa} lista={lista} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Version de una sola fila para celular: un toque para seguir con la habilidad que toca, sin bajar hasta el perfil.
function SiguienteRetoCompacto({
  nombre,
  habilidad,
  dominio,
  nivelOrden,
}: {
  nombre: string;
  habilidad: NombreHabilidad;
  dominio: number;
  nivelOrden: number;
}) {
  const estilo = estiloNivel(nivelOrden);
  const Icono = ICONOS_HABILIDAD[habilidad];
  return (
    <div
      className={`mb-4 flex items-center gap-3 rounded-2xl border p-3 backdrop-blur-sm lg:hidden ${estilo.borde} ${estilo.fondoTarjeta} ${estilo.brillo}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${estilo.iconoFondo} ${estilo.iconoColor}`}>
        <Icono className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Tu siguiente reto</div>
        <div className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {nombre} <span className="font-semibold text-zinc-500 dark:text-zinc-400">· {dominio}%</span>
        </div>
      </div>
      <Link
        href={`/practicar/${habilidad}`}
        className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_14px_-2px_rgba(16,185,129,0.6)] hover:bg-emerald-400"
      >
        Practicar
      </Link>
    </div>
  );
}

function SiguienteReto({
  nombre,
  habilidad,
  dominio,
  nivelOrden,
}: {
  nombre: string;
  habilidad: NombreHabilidad;
  dominio: number;
  nivelOrden: number;
}) {
  const estilo = estiloNivel(nivelOrden);
  const Icono = ICONOS_HABILIDAD[habilidad];
  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-sm ${estilo.borde} ${estilo.fondoTarjeta} ${estilo.brillo}`}>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Tu siguiente reto
      </div>
      <div className="flex items-center gap-4">
        <AnilloProgreso valor={dominio} tamano={84} grosor={7} color={estilo.anillo} etiqueta={`Dominio de ${nombre}: ${dominio}%`}>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{dominio}%</span>
        </AnilloProgreso>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${estilo.iconoFondo} ${estilo.iconoColor}`}>
              <Icono className="h-4 w-4" />
            </span>
            <span className="truncate">{nombre}</span>
          </div>
          <Link
            href={`/practicar/${habilidad}`}
            className="inline-block rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_0_14px_-2px_rgba(16,185,129,0.6)] hover:bg-emerald-400"
          >
            Practicar
          </Link>
        </div>
      </div>
    </div>
  );
}
