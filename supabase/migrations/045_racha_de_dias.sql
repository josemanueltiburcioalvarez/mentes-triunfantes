-- Racha de dias del estudiante (para el panel y los logros), contada en hora de Lima. Un dia cuenta si respondio
-- al menos una pregunta (las preguntas saltadas con "No sé" no cuentan). La racha sigue viva si su ultimo dia fue
-- hoy o ayer. "dias_recientes" son los dias con actividad de los ultimos 7 (hoy incluido).
create or replace view public.vista_racha_estudiante with (security_invoker = true) as
with dias as (
  select distinct i.estudiante_id, (i.created_at at time zone 'America/Lima')::date as dia
  from public.intentos i
  where coalesce(i.pasos ->> 'modo', '') <> 'saltada'
),
numerados as (
  select estudiante_id, dia, dia - (row_number() over (partition by estudiante_id order by dia))::int as grupo
  from dias
),
rachas as (
  select estudiante_id, grupo, count(*)::int as largo, max(dia) as ultimo
  from numerados
  group by estudiante_id, grupo
)
select r.estudiante_id,
  coalesce(max(r.largo) filter (where r.ultimo >= public.hoy_lima() - 1), 0) as racha_actual,
  max(r.largo) as mejor_racha,
  bool_or(r.ultimo = public.hoy_lima()) as practico_hoy,
  coalesce(
    (select array_agg(d.dia order by d.dia) from dias d
     where d.estudiante_id = r.estudiante_id and d.dia >= public.hoy_lima() - 6),
    '{}'::date[]
  ) as dias_recientes
from rachas r
group by r.estudiante_id;

-- "dias activos" del resumen tambien usaba la fecha en UTC (el dia cambiaba a las 7 pm de Lima).
create or replace view public.vista_resumen_estudiante with (security_invoker = true) as
select p.id as estudiante_id,
  p.nombre as estudiante_nombre,
  p.grado_escolar,
  h.nombre as habilidad_nombre,
  n.nombre as nivel_nombre,
  n.orden as nivel_orden,
  ph.porcentaje_dominio,
  ph.desbloqueada,
  ph.ultima_practica,
  ph.total_intentos,
  nivel_actual.nombre as nivel_actual,
  actividad.dias_activos
from perfiles p
  join progreso_habilidad ph on ph.estudiante_id = p.id
  join habilidades h on h.id = ph.habilidad_id
  join niveles n on n.id = h.nivel_id and n.modalidad = coalesce(p.modalidad, 'primaria'::modalidad_estudiante)
  left join lateral (
    select n2.nombre
    from progreso_habilidad ph2
      join habilidades h2 on h2.id = ph2.habilidad_id
      join niveles n2 on n2.id = h2.nivel_id
    where ph2.estudiante_id = p.id and ph2.desbloqueada
      and n2.modalidad = coalesce(p.modalidad, 'primaria'::modalidad_estudiante)
    order by n2.orden desc
    limit 1
  ) nivel_actual on true
  left join lateral (
    select count(distinct (i.created_at at time zone 'America/Lima')::date) as dias_activos
    from intentos i
    where i.estudiante_id = p.id
  ) actividad on true
where p.rol = 'estudiante';
