-- Igual que la vista del dashboard (migracion 038): como ahora cada habilidad existe una vez por
-- modalidad, y el trigger de alta deja desbloqueada la primera habilidad de AMBAS modalidades (para
-- no tener que saber la modalidad antes de que el estudiante complete su perfil), varias vistas del
-- admin promediaban o contaban progreso de la modalidad que el estudiante ni siquiera usa.

-- vista_estudiantes_admin: el "% de avance" quedaba diluido con las habilidades de la otra modalidad
-- (siempre en 0%, porque nunca se practican). Tambien se agrega modalidad y edad para el panel.
create or replace view public.vista_estudiantes_admin with (security_invoker = true) as
select
  p.id, p.nombre, p.email, p.grado_escolar, p.estado, p.fecha_ultimo_acceso, p.created_at,
  na.orden as nivel_orden,
  na.nombre as nivel_actual,
  coalesce(av.avance, 0) as avance,
  coalesce(sol.n, 0) as solicitudes_abiertas,
  coalesce(ale.n, 0) as alertas,
  -- al final de la lista: create or replace view no permite insertar columnas en medio
  p.modalidad, p.edad
from public.perfiles p
left join lateral (
  select n.orden, n.nombre
  from public.progreso_habilidad ph
  join public.habilidades h on h.id = ph.habilidad_id
  join public.niveles n on n.id = h.nivel_id
  where ph.estudiante_id = p.id and ph.desbloqueada
    and n.modalidad = coalesce(p.modalidad, 'primaria'::modalidad_estudiante)
  order by n.orden desc
  limit 1
) na on true
left join lateral (
  select round(avg(ph.porcentaje_dominio), 1) as avance
  from public.progreso_habilidad ph
  join public.habilidades h on h.id = ph.habilidad_id
  join public.niveles n on n.id = h.nivel_id
  where ph.estudiante_id = p.id and h.nombre::text not in ('atajos', 'razonamiento')
    and n.modalidad = coalesce(p.modalidad, 'primaria'::modalidad_estudiante)
) av on true
left join lateral (
  select count(*) as n
  from public.autorizaciones_examen a
  where a.estudiante_id = p.id and a.estado in ('solicitado', 'autorizado')
) sol on true
left join lateral (
  select count(*) as n
  from public.vista_sesiones_sospechosas s
  where s.estudiante_id = p.id and s.sospechosa and s.revision_estado is null
) ale on true
where p.rol = 'estudiante';

-- vista_resumen_profesor: el progreso promedio de los estudiantes asignados tenia el mismo problema.
create or replace view public.vista_resumen_profesor with (security_invoker = true) as
select prof.id as profesor_id,
  prof.nombre as profesor_nombre,
  count(distinct pe.estudiante_id) filter (where pe.activo) as estudiantes_activos,
  round(avg(ph.porcentaje_dominio) filter (
    where n.modalidad = coalesce(est.modalidad, 'primaria'::modalidad_estudiante)
  ), 2) as progreso_promedio,
  max(ph.ultima_practica) as ultima_actividad_estudiantes
from perfiles prof
  join profesor_estudiante pe on pe.profesor_id = prof.id
  join perfiles est on est.id = pe.estudiante_id
  left join progreso_habilidad ph on ph.estudiante_id = pe.estudiante_id
  left join habilidades h on h.id = ph.habilidad_id
  left join niveles n on n.id = h.nivel_id
where prof.rol = 'profesor'
group by prof.id, prof.nombre;

-- vista_reporte_habilidades: ahora hay dos filas "Suma, Basico" (una por modalidad) en vez de una, y
-- "estudiantes_habilitados"/"dominio_promedio" contaban a TODOS los estudiantes (la primera habilidad
-- de cada modalidad queda desbloqueada para todos desde el alta, antes de elegir modalidad). Se agrega
-- la columna modalidad para distinguirlas en el reporte, y se filtra por la modalidad real de cada quien.
create or replace view public.vista_reporte_habilidades with (security_invoker = true) as
select
  h.id as habilidad_id,
  h.nombre::text as habilidad,
  n.nombre as nivel,
  n.orden as nivel_orden,
  h.orden as habilidad_orden,
  coalesce(abiertas.n, 0) as estudiantes_habilitados,
  coalesce(abiertas.dominio, 0) as dominio_promedio,
  coalesce(resp.estudiantes, 0) as estudiantes_activos,
  coalesce(resp.total, 0) as respuestas,
  coalesce(resp.pct_correctas, 0) as pct_correctas,
  coalesce(resp.segundos, 0) as segundos_promedio,
  coalesce(ex.rendidos, 0) as examenes_rendidos,
  coalesce(ex.aprobados, 0) as examenes_aprobados,
  -- al final: create or replace view no permite insertar columnas en medio
  n.modalidad
from public.habilidades h
join public.niveles n on n.id = h.nivel_id
left join lateral (
  select count(*) as n, round(avg(ph.porcentaje_dominio), 1) as dominio
  from public.progreso_habilidad ph
  join public.perfiles p on p.id = ph.estudiante_id and p.rol = 'estudiante'
    and coalesce(p.modalidad, 'primaria'::modalidad_estudiante) = n.modalidad
  where ph.habilidad_id = h.id and ph.desbloqueada
) abiertas on true
left join lateral (
  select count(distinct i.estudiante_id) as estudiantes,
    count(*) as total,
    round(100.0 * avg(case when i.es_correcto then 1 else 0 end), 1) as pct_correctas,
    round(avg(i.segundos), 1) as segundos
  from public.intentos i
  join public.sesiones s on s.id = i.sesion_id
  where i.habilidad_id = h.id and (s.digito is not null or s.tipo <> 'practica'::tipo_sesion)
) resp on true
left join lateral (
  select count(*) as rendidos, count(*) filter (where e.aprobado) as aprobados
  from public.evaluaciones_habilidad e
  where e.habilidad_id = h.id
) ex on true;
