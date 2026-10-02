-- Con dos niveles "Basico" (uno por modalidad) la vista mezclaba las habilidades de primaria y
-- secundaria bajo el mismo nombre de nivel. Se filtra por la modalidad del estudiante (si todavia
-- no la eligio, se trata como primaria, el comportamiento que ya tenia la app).
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
    select count(distinct i.created_at::date) as dias_activos
    from intentos i
    where i.estudiante_id = p.id
  ) actividad on true
where p.rol = 'estudiante';
