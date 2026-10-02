-- Primaria (el curriculo que ya existe) y Secundaria (un segundo curriculo, por ahora solo Basico e
-- Intermedio) comparten las mismas habilidades/generadores de ejercicios, solo cambia como se agrupan
-- en niveles. La modalidad del estudiante se deduce del grado escolar, no se pregunta aparte.

create type public.modalidad_estudiante as enum ('primaria', 'secundaria');

alter table public.perfiles
  add column edad smallint check (edad between 3 and 25),
  add column modalidad public.modalidad_estudiante;

alter table public.perfiles
  add constraint perfiles_grado_escolar_valido check (
    grado_escolar is null or grado_escolar in (
      'primaria_1', 'primaria_2', 'primaria_3', 'primaria_4', 'primaria_5', 'primaria_6',
      'secundaria_1', 'secundaria_2', 'secundaria_3', 'secundaria_4', 'secundaria_5'
    )
  );

create or replace function public.actualizar_modalidad_perfil()
returns trigger
language plpgsql
as $$
begin
  new.modalidad := case
    when new.grado_escolar is null then null
    when new.grado_escolar like 'primaria_%' then 'primaria'
    else 'secundaria'
  end;
  return new;
end;
$$;
create trigger actualizar_modalidad_perfil_trigger before insert or update of grado_escolar on public.perfiles
  for each row execute function public.actualizar_modalidad_perfil();

-- "orden" (1 a 4) ahora es unico por modalidad, no global, porque habra un nivel 1 de primaria y
-- un nivel 1 de secundaria.
alter table public.niveles add column modalidad public.modalidad_estudiante not null default 'primaria';
alter table public.niveles drop constraint niveles_orden_key;
alter table public.niveles add constraint niveles_modalidad_orden_key unique (modalidad, orden);
alter table public.niveles alter column modalidad drop default;

insert into public.niveles (nombre, orden, modalidad) values
  ('Básico', 1, 'secundaria'),
  ('Intermedio', 2, 'secundaria');

-- Basico de secundaria: todas las operaciones basicas juntas (en primaria estan repartidas en dos niveles)
insert into public.habilidades (nivel_id, nombre, orden)
select n.id, x.nombre, x.orden
from public.niveles n, (values
  ('suma'::public.nombre_habilidad, 1),
  ('resta', 2),
  ('tabla_multiplicacion', 3),
  ('multiplicacion', 4),
  ('division', 5),
  ('potencia', 6),
  ('raiz', 7)
) as x(nombre, orden)
where n.modalidad = 'secundaria' and n.orden = 1;

-- Intermedio de secundaria: combinadas + numeros con signo + combinadas con signo
insert into public.habilidades (nivel_id, nombre, orden)
select n.id, x.nombre, x.orden
from public.niveles n, (values
  ('operaciones_combinadas'::public.nombre_habilidad, 1),
  ('suma_enteros', 2),
  ('resta_enteros', 3),
  ('multiplicacion_enteros', 4),
  ('division_enteros', 5),
  ('potencia_enteros', 6),
  ('raiz_enteros', 7),
  ('combinadas_enteros', 8)
) as x(nombre, orden)
where n.modalidad = 'secundaria' and n.orden = 2;

-- progreso para los estudiantes ya existentes, en las habilidades nuevas de secundaria (sin esto
-- quedarian sin filas y romperian la pagina de practica si algun dia cambian de modalidad)
insert into public.progreso_habilidad (estudiante_id, habilidad_id)
select p.id, h.id
from public.perfiles p
cross join public.habilidades h
join public.niveles n on n.id = h.nivel_id
where p.rol = 'estudiante' and n.modalidad = 'secundaria'
on conflict (estudiante_id, habilidad_id) do nothing;

insert into public.progreso_ejercicio (estudiante_id, habilidad_id, digito, numero_ejercicio)
select p.id, h.id, d.digito, e.numero_ejercicio
from public.perfiles p
cross join public.habilidades h
join public.niveles n on n.id = h.nivel_id
cross join generate_series(1, 5) as d(digito)
cross join generate_series(1, 3) as e(numero_ejercicio)
where p.rol = 'estudiante' and n.modalidad = 'secundaria'
on conflict (estudiante_id, habilidad_id, digito, numero_ejercicio) do nothing;

-- el trigger que inicializa progreso para estudiantes nuevos debe cubrir tambien las habilidades
-- de secundaria (antes solo recorria "habilidades" sin filtrar, asi que ya las cubre automaticamente;
-- se recrea igual para dejar constancia y porque el cross join con niveles debe mantenerse identico)

-- examen de ubicacion: se rinde una sola vez (unique en estudiante_id), queda como registro para
-- el admin/profesor.
create table public.evaluaciones_ubicacion (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null unique references public.perfiles(id) on delete cascade,
  modalidad public.modalidad_estudiante not null,
  puntaje smallint not null check (puntaje between 0 and 20),
  nivel_inicial smallint not null check (nivel_inicial between 1 and 4),
  created_at timestamptz not null default now()
);
alter table public.evaluaciones_ubicacion enable row level security;
create policy evaluaciones_ubicacion_select on public.evaluaciones_ubicacion for select to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin'
         or ((select rol_actual()) = 'profesor' and es_profesor_de(estudiante_id)));

-- El estudiante no puede escribir directo en progreso_habilidad/progreso_ejercicio (RLS lo restringe
-- a admin), asi que el resultado del examen de ubicacion se aplica con una funcion seria que valida
-- todo server-side: cuantas preguntas, que modalidad tiene el estudiante, y hasta que nivel existe
-- para esa modalidad (secundaria por ahora solo llega a Intermedio).
create or replace function public.aplicar_examen_ubicacion(p_puntaje smallint)
returns table (nivel_orden smallint, nivel_nombre text)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_estudiante uuid := auth.uid();
  v_modalidad public.modalidad_estudiante;
  v_max_orden smallint;
  v_objetivo smallint;
begin
  if v_estudiante is null then
    raise exception 'No autenticado';
  end if;
  if p_puntaje is null or p_puntaje < 0 or p_puntaje > 20 then
    raise exception 'Puntaje invalido';
  end if;

  select modalidad into v_modalidad from perfiles where id = v_estudiante;
  if v_modalidad is null then
    raise exception 'Completa tu perfil (grado escolar) antes de rendir el examen de ubicacion';
  end if;

  select max(orden) into v_max_orden from niveles where modalidad = v_modalidad;

  v_objetivo := case
    when p_puntaje >= 16 then least(4, v_max_orden)
    when p_puntaje >= 11 then least(3, v_max_orden)
    else 1
  end;

  insert into evaluaciones_ubicacion (estudiante_id, modalidad, puntaje, nivel_inicial)
  values (v_estudiante, v_modalidad, p_puntaje, v_objetivo);

  update progreso_habilidad ph
  set desbloqueada = true
  from habilidades h, niveles n
  where ph.habilidad_id = h.id and h.nivel_id = n.id
    and ph.estudiante_id = v_estudiante
    and n.modalidad = v_modalidad
    and n.orden <= v_objetivo;

  update progreso_ejercicio pe
  set desbloqueado = true
  from habilidades h, niveles n
  where pe.habilidad_id = h.id and h.nivel_id = n.id
    and pe.estudiante_id = v_estudiante
    and n.modalidad = v_modalidad
    and n.orden <= v_objetivo
    and pe.digito = 1 and pe.numero_ejercicio = 1;

  return query
    select n.orden, n.nombre from niveles n where n.modalidad = v_modalidad and n.orden = v_objetivo;
end;
$$;

revoke execute on function public.aplicar_examen_ubicacion(smallint) from public;
revoke execute on function public.aplicar_examen_ubicacion(smallint) from anon;
grant execute on function public.aplicar_examen_ubicacion(smallint) to authenticated;
