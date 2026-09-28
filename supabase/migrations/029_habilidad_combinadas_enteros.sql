-- APLICADA en Supabase (migracion 029). Experto: operaciones combinadas con signos pasa a ser la
-- habilidad 8; atajos y razonamiento se corren a 9 y 10. Filas de progreso para los estudiantes
-- existentes y tiempo minimo plausible por respuesta (4 * digito + 10 segundos).
update habilidades set orden = 10
  where nombre = 'razonamiento' and nivel_id = (select id from niveles where nombre = 'Experto');
update habilidades set orden = 9
  where nombre = 'atajos' and nivel_id = (select id from niveles where nombre = 'Experto');

insert into habilidades (nivel_id, nombre, orden, nota_aprobacion)
select id, 'combinadas_enteros', 8, 80 from niveles where nombre = 'Experto';

insert into progreso_habilidad (estudiante_id, habilidad_id, desbloqueada)
select p.id, h.id, false
from perfiles p cross join habilidades h
where p.rol = 'estudiante' and h.nombre = 'combinadas_enteros'
on conflict (estudiante_id, habilidad_id) do nothing;

insert into progreso_ejercicio (estudiante_id, habilidad_id, digito, numero_ejercicio, desbloqueado)
select p.id, h.id, d.digito, e.numero_ejercicio, false
from perfiles p
cross join habilidades h
cross join generate_series(1, 5) as d(digito)
cross join generate_series(1, 3) as e(numero_ejercicio)
where p.rol = 'estudiante' and h.nombre = 'combinadas_enteros'
on conflict (estudiante_id, habilidad_id, digito, numero_ejercicio) do nothing;

-- umbral_segundos_intento: se agrega  when 'combinadas_enteros' then 4.0 * p_digito + 10.0
-- (definicion completa en la migracion 027 mas esa linea).
