import ListaEstudiantes from "@/components/estudiante/lista-estudiantes";

type Parametros = Record<string, string | string[] | undefined>;

export default async function EstudiantesPage({ searchParams }: { searchParams: Promise<Parametros> }) {
  const sp = await searchParams;
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Estudiantes</h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Busca por nombre o correo, filtra por nivel o actividad y entra a la ficha de cada uno.
      </p>
      <ListaEstudiantes searchParams={sp} basePath="/admin/estudiantes" />
    </div>
  );
}
