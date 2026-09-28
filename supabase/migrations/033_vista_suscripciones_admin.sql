-- APLICADA en Supabase (migracion 033). Estado de pago mas reciente de cada estudiante, con el estado
-- calculado por fecha (una suscripcion 'activa' cuya fecha_fin ya paso se muestra como vencida sin
-- necesidad de un cron que la actualice).
create view public.vista_suscripciones_admin
with (security_invoker = true) as
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

revoke all on public.vista_suscripciones_admin from anon;
