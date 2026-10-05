-- Los examenes ahora permiten pasar una pregunta sin responder (pasos.modo = saltada). Esas respuestas son
-- rapidas por definicion, asi que no deben contar como "respuestas mas rapidas de lo posible".
create or replace view public.vista_sesiones_sospechosas with (security_invoker = true) as
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
    -- una pregunta saltada ("No sé" en un examen) es rapida por definicion: no cuenta como sospechosa
    count(i.id) filter (where i.segundos < umbral_segundos_intento(hi.nombre, i.dificultad::integer) and coalesce(i.pasos ->> 'modo', '') <> 'saltada') as respuestas_rapidas,
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
