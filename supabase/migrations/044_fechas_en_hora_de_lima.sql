-- Las fechas de suscripcion y de dias sin practicar usaban current_date (UTC): en Lima el dia cambiaba a las 7 pm
-- y un plan que vence "hoy" aparecia vencido por la tarde. Ahora todo usa la fecha de Lima (hoy_lima).
-- Fecha de hoy en Peru. La base corre en UTC y alli el dia cambia a las 7 pm de Lima, asi que current_date
-- haria vencer un plan (o contar un dia sin practicar) casi medio dia antes de lo que corresponde.
create or replace function public.hoy_lima()
returns date
language sql stable set search_path to 'public'
as $$ select (now() at time zone 'America/Lima')::date $$;

create or replace view public.vista_ingresos with (security_invoker = true) as
select
  count(*) filter (where estado = 'activa' and fecha_fin >= public.hoy_lima()) as activas,
  count(*) filter (where estado = 'vencida' or (estado = 'activa' and fecha_fin < public.hoy_lima())) as vencidas,
  count(*) filter (where estado = 'activa' and fecha_fin >= public.hoy_lima() and fecha_fin <= public.hoy_lima() + interval '7 days') as por_vencer_7_dias,
  coalesce(sum(monto) filter (where estado = 'activa' and fecha_fin >= public.hoy_lima()), 0::numeric) as ingreso_mensual_total
from suscripciones;

create or replace view public.vista_retencion with (security_invoker = true) as
select p.id as estudiante_id,
  p.nombre,
  p.grado_escolar,
  pmax.ultima_practica,
  case when pmax.ultima_practica is null then null::integer else public.hoy_lima() - (pmax.ultima_practica at time zone 'America/Lima')::date end as dias_sin_practicar,
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

create or replace view public.vista_suscripciones_admin with (security_invoker = true) as
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
    when ultima.fecha_fin < public.hoy_lima() then 'vencida'
    else 'activa'
  end as estado_actual,
  case when ultima.fecha_fin is not null then (ultima.fecha_fin - public.hoy_lima()) end as dias_restantes
from public.perfiles p
left join lateral (
  select *
  from public.suscripciones s
  where s.estudiante_id = p.id
  order by s.fecha_fin desc, s.created_at desc
  limit 1
) ultima on true
where p.rol = 'estudiante';
