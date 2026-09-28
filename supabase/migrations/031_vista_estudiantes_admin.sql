-- APLICADA en Supabase (migracion 031). Una fila por estudiante con lo necesario para el listado del
-- panel de administracion (busqueda, filtros, orden y paginacion en el servidor).
create or replace view public.vista_estudiantes_admin
with (security_invoker = true) as
select
  p.id, p.nombre, p.email, p.grado_escolar, p.estado, p.fecha_ultimo_acceso, p.created_at,
  na.orden as nivel_orden,
  na.nombre as nivel_actual,
  coalesce(av.avance, 0) as avance,
  coalesce(sol.n, 0) as solicitudes_abiertas,
  coalesce(ale.n, 0) as alertas
from public.perfiles p
left join lateral (
  select n.orden, n.nombre
  from public.progreso_habilidad ph
  join public.habilidades h on h.id = ph.habilidad_id
  join public.niveles n on n.id = h.nivel_id
  where ph.estudiante_id = p.id and ph.desbloqueada
  order by n.orden desc
  limit 1
) na on true
left join lateral (
  select round(avg(ph.porcentaje_dominio), 1) as avance
  from public.progreso_habilidad ph
  join public.habilidades h on h.id = ph.habilidad_id
  where ph.estudiante_id = p.id and h.nombre::text not in ('atajos', 'razonamiento')
) av on true
left join lateral (
  select count(*) as n
  from public.autorizaciones_examen a
  where a.estudiante_id = p.id and a.estado in ('solicitado', 'autorizado')
) sol on true
left join lateral (
  select count(*) as n
  from public.vista_sesiones_sospechosas s
  where s.estudiante_id = p.id and s.sospechosa
) ale on true
where p.rol = 'estudiante';

revoke all on public.vista_estudiantes_admin from anon;
