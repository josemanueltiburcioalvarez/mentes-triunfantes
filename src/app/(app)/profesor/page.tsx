import ListaEstudiantes from "@/components/estudiante/lista-estudiantes";

type Parametros = Record<string, string | string[] | undefined>;

// La base de datos (RLS) ya restringe "vista_estudiantes_admin" a los estudiantes que este profesor
// tiene asignados y activos, asi que se reutiliza el mismo listado del panel de admin.
export default async function ProfesorPage({ searchParams }: { searchParams: Promise<Parametros> }) {
  const sp = await searchParams;
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Mis estudiantes</h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Progreso de los estudiantes que tienes asignados. Para editar algo (estado, habilidades bloqueadas,
        exámenes) pide a un administrador.
      </p>
      <ListaEstudiantes searchParams={sp} basePath="/profesor/estudiantes" />
    </div>
  );
}
