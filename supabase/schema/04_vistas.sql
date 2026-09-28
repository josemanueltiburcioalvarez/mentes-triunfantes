-- Vistas. Todas usan security_invoker: respetan la seguridad por fila de quien consulta.

create view public.vista_resumen_estudiante with (security_invoker = true) as
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
  join niveles n on n.id = h.nivel_id
  left join lateral (
    select n2.nombre
    from progreso_habilidad ph2
      join habilidades h2 on h2.id = ph2.habilidad_id
      join niveles n2 on n2.id = h2.nivel_id
    where ph2.estudiante_id = p.id and ph2.desbloqueada
    order by n2.orden desc
    limit 1
  ) nivel_actual on true
  left join lateral (
    select count(distinct i.created_at::date) as dias_activos
    from intentos i
    where i.estudiante_id = p.id
  ) actividad on true
where p.rol = 'estudiante';

create view public.vista_resumen_profesor with (security_invoker = true) as
select prof.id as profesor_id,
  prof.nombre as profesor_nombre,
  count(distinct pe.estudiante_id) filter (where pe.activo) as estudiantes_activos,
  round(avg(ph.porcentaje_dominio), 2) as progreso_promedio,
  max(ph.ultima_practica) as ultima_actividad_estudiantes
from perfiles prof
  join profesor_estudiante pe on pe.profesor_id = prof.id
  left join progreso_habilidad ph on ph.estudiante_id = pe.estudiante_id
where prof.rol = 'profesor'
group by prof.id, prof.nombre;

create view public.vista_ingresos with (security_invoker = true) as
select
  count(*) filter (where estado = 'activa' and fecha_fin >= current_date) as activas,
  count(*) filter (where estado = 'vencida' or (estado = 'activa' and fecha_fin < current_date)) as vencidas,
  count(*) filter (where estado = 'activa' and fecha_fin >= current_date and fecha_fin <= current_date + interval '7 days') as por_vencer_7_dias,
  coalesce(sum(monto) filter (where estado = 'activa' and fecha_fin >= current_date), 0::numeric) as ingreso_mensual_total
from suscripciones;

create view public.vista_retencion with (security_invoker = true) as
select p.id as estudiante_id,
  p.nombre,
  p.grado_escolar,
  pmax.ultima_practica,
  case when pmax.ultima_practica is null then null::integer else current_date - pmax.ultima_practica::date end as dias_sin_practicar,
  (pmax.ultima_practica is null or pmax.ultima_practica < now() - interval '7 days') as inactivo_7_dias,
  (pmax.ultima_practica is null or pmax.ultima_practica < now() - interval '15 days') as inactivo_15_dias,
  (pmax.ultima_practica is null or pmax.ultima_practica < now() - interval '30 days') as inactivo_30_dias
from perfiles p
  left join lateral (
    select max(progreso_habilidad.ultima_practica) as ultima_practica
    from progreso_habilidad
    where progreso_habilidad.estudiante_id = p.id
  ) pmax on true
where p.rol = 'estudiante';

-- Sesiones con respuestas mas rapidas de lo posible a mano, o con llevadas resueltas sin escribir ninguna.
-- Solo la ven el admin y los profesores; revision_* dice si el admin ya la reviso o descarto.
create view public.vista_sesiones_sospechosas with (security_invoker = true) as
with base as (
  select s.id as sesion_id,
    s.estudiante_id,
    p.nombre as estudiante_nombre,
    hs.nombre as habilidad_nombre,
    s.tipo,
    s.inicio,
    s.fin,
    count(i.id) as total_intentos,
    count(i.id) filter (where i.es_correcto) as correctos,
    round(avg(i.segundos), 2) as segundos_promedio,
    count(i.id) filter (where i.segundos < umbral_segundos_intento(hi.nombre, i.dificultad::integer)) as respuestas_rapidas,
    count(i.id) filter (where (i.pasos ->> 'requeria_marcas')::boolean) as requerian_marcas,
    count(i.id) filter (where (i.pasos ->> 'requeria_marcas')::boolean and not (i.pasos ->> 'uso_marcas')::boolean) as sin_marcas,
    n.nombre as nivel_nombre
  from sesiones s
    join perfiles p on p.id = s.estudiante_id
    join intentos i on i.sesion_id = s.id
    join habilidades hi on hi.id = i.habilidad_id
    left join habilidades hs on hs.id = s.habilidad_id
    left join niveles n on n.id = s.nivel_id
  where (select rol_actual()) = any (array['admin'::rol_usuario, 'profesor'::rol_usuario])
    and (s.digito is not null or s.tipo <> 'practica'::tipo_sesion)
  group by s.id, s.estudiante_id, p.nombre, hs.nombre, s.tipo, s.inicio, s.fin, n.nombre
)
select b.sesion_id, b.estudiante_id, b.estudiante_nombre, b.habilidad_nombre, b.tipo, b.inicio, b.fin,
  b.total_intentos, b.correctos, b.segundos_promedio, b.respuestas_rapidas, b.requerian_marcas, b.sin_marcas,
  b.nivel_nombre,
  (b.total_intentos >= 5 and (
    (b.respuestas_rapidas::numeric / b.total_intentos::numeric) >= 0.3
    or (b.requerian_marcas >= 3 and (b.sin_marcas::numeric / b.requerian_marcas::numeric) >= 0.7)
  )) as sospechosa,
  r.estado as revision_estado,
  r.nota as revision_nota,
  r.created_at as revision_fecha
from base b
  left join public.revisiones_alerta r on r.sesion_id = b.sesion_id;

-- Una fila por estudiante para el listado del panel de administracion.
create view public.vista_estudiantes_admin with (security_invoker = true) as
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
  where s.estudiante_id = p.id and s.sospechosa and s.revision_estado is null
) ale on true
where p.rol = 'estudiante';

-- Rendimiento por habilidad (reportes del panel).
create view public.vista_reporte_habilidades with (security_invoker = true) as
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
  coalesce(ex.aprobados, 0) as examenes_aprobados
from public.habilidades h
join public.niveles n on n.id = h.nivel_id
left join lateral (
  select count(*) as n, round(avg(ph.porcentaje_dominio), 1) as dominio
  from public.progreso_habilidad ph
  join public.perfiles p on p.id = ph.estudiante_id and p.rol = 'estudiante'
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

-- Actividad por dia (hora de Lima).
create view public.vista_actividad_diaria with (security_invoker = true) as
select
  (i.created_at at time zone 'America/Lima')::date as dia,
  count(distinct i.estudiante_id) as estudiantes_activos,
  count(distinct i.sesion_id) as sesiones,
  count(*) as respuestas,
  count(*) filter (where i.es_correcto) as correctas
from public.intentos i
group by 1;

-- Estado de pago mas reciente de cada estudiante, con el estado calculado por fecha (una suscripcion
-- 'activa' cuya fecha_fin ya paso se muestra como vencida sin necesidad de un cron que la actualice).
create view public.vista_suscripciones_admin with (security_invoker = true) as
select
  p.id as estudiante_id,
  p.nombre,
  p.email,
  ultima.id as suscripcion_id,
  ultima.estado as estado_registrado,
  ultima.fecha_inicio,
  ultima.fecha_fin,
  ultima.monto,
  ultima.metodo_pago,
  ultima.referencia_pago,
  ultima.created_at as fecha_pago,
  case
    when ultima.id is null then 'sin_pagos'
    when ultima.estado = 'cancelada' then 'cancelada'
    when ultima.fecha_fin < current_date then 'vencida'
    else 'activa'
  end as estado_actual,
  case when ultima.fecha_fin is not null then (ultima.fecha_fin - current_date) end as dias_restantes
from public.perfiles p
left join lateral (
  select *
  from public.suscripciones s
  where s.estudiante_id = p.id
  order by s.fecha_fin desc, s.created_at desc
  limit 1
) ultima on true
where p.rol = 'estudiante';

revoke all on all tables in schema public from anon;
