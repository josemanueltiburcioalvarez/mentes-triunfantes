-- Atajos y razonamiento mezclan ejercicios generados en la aplicacion con ejercicios curados que el
-- administrador escribe a mano (tabla "ejercicios"). Esa tabla solo la puede leer admin/profesor (RLS),
-- asi que el estudiante pide uno a la vez con esta funcion, que no expone el resto del banco.
create or replace function public.obtener_ejercicio_curado(
  p_habilidad_id uuid,
  p_dificultad smallint,
  p_excluir uuid[] default '{}'
)
returns table (id uuid, enunciado text, respuesta text, explicacion text)
language sql
security definer
set search_path to 'public'
stable
as $$
  select e.id, e.enunciado, e.respuesta, e.explicacion
  from ejercicios e
  where auth.uid() is not null
    and e.habilidad_id = p_habilidad_id
    and e.dificultad = p_dificultad
    and not (e.id = any (p_excluir))
  order by random()
  limit 1;
$$;

grant execute on function public.obtener_ejercicio_curado(uuid, smallint, uuid[]) to authenticated;
