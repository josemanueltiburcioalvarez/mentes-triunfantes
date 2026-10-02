-- Avanzado y Experto de Secundaria (quedaban pendientes, ver README). Avanzado es Ecuaciones (ya
-- existe, mismo generador/componente que Primaria). Experto es Sistemas de ecuaciones (habilidad
-- nueva, 2x2 por eliminacion) + Atajos + Razonamiento, igual que en Primaria (ahi tambien son el
-- "cierre" del ultimo nivel).

insert into public.niveles (nombre, orden, modalidad) values
  ('Avanzado', 3, 'secundaria'),
  ('Experto', 4, 'secundaria');

insert into public.habilidades (nivel_id, nombre, orden)
select n.id, x.nombre, x.orden
from public.niveles n, (values
  ('ecuaciones'::public.nombre_habilidad, 1)
) as x(nombre, orden)
where n.modalidad = 'secundaria' and n.orden = 3;

insert into public.habilidades (nivel_id, nombre, orden)
select n.id, x.nombre, x.orden
from public.niveles n, (values
  ('sistemas_ecuaciones'::public.nombre_habilidad, 1),
  ('atajos', 2),
  ('razonamiento', 3)
) as x(nombre, orden)
where n.modalidad = 'secundaria' and n.orden = 4;

-- progreso para TODOS los estudiantes ya existentes (no solo los de secundaria: si algun dia cambian
-- de modalidad, como ahora pueden hacer solos desde "Mi perfil", sus filas ya deben existir; mismo
-- patron que la migracion 037).
insert into public.progreso_habilidad (estudiante_id, habilidad_id)
select p.id, h.id
from public.perfiles p
cross join public.habilidades h
join public.niveles n on n.id = h.nivel_id
where p.rol = 'estudiante' and n.modalidad = 'secundaria' and n.orden in (3, 4)
on conflict (estudiante_id, habilidad_id) do nothing;

insert into public.progreso_ejercicio (estudiante_id, habilidad_id, digito, numero_ejercicio)
select p.id, h.id, d.digito, e.numero_ejercicio
from public.perfiles p
cross join public.habilidades h
join public.niveles n on n.id = h.nivel_id
cross join generate_series(1, 5) as d(digito)
cross join generate_series(1, 3) as e(numero_ejercicio)
where p.rol = 'estudiante' and n.modalidad = 'secundaria' and n.orden in (3, 4)
on conflict (estudiante_id, habilidad_id, digito, numero_ejercicio) do nothing;

-- tiempo minimo plausible por respuesta: sistemas de ecuaciones encadena varias cuentas (igualar,
-- eliminar, resolver x, sustituir, dividir) mas la comprobacion, asi que el umbral es mas alto que
-- el de "ecuaciones".
create or replace function public.umbral_segundos_intento(p_habilidad public.nombre_habilidad, p_digito integer)
returns numeric
language sql immutable set search_path to 'public'
as $$
  select case p_habilidad
    when 'tabla_multiplicacion' then 1.0
    when 'multiplicacion' then 5.0 * p_digito + 3.0
    when 'division' then 6.0 * p_digito + 4.0
    when 'potencia' then 4.0 * p_digito + 3.0
    when 'raiz' then case p_digito when 4 then 15.0 when 5 then 20.0 else 5.0 * p_digito + 5.0 end
    when 'operaciones_combinadas' then 4.0 * p_digito + 8.0
    when 'suma_enteros' then 5.0 * p_digito + 4.0
    when 'resta_enteros' then 5.0 * p_digito + 4.0
    when 'multiplicacion_enteros' then 5.0 * p_digito + 6.0
    when 'division_enteros' then 6.0 * p_digito + 6.0
    when 'potencia_enteros' then 4.0 * p_digito + 6.0
    when 'raiz_enteros' then 5.0 * p_digito + 6.0
    when 'ecuaciones' then 6.0 * p_digito + 6.0
    when 'combinadas_enteros' then 4.0 * p_digito + 10.0
    when 'atajos' then 4.0 * p_digito + 4.0
    when 'razonamiento' then 6.0 * p_digito + 15.0
    when 'sistemas_ecuaciones' then 10.0 * p_digito + 20.0
    else 3.0 * p_digito + 2.0
  end
$$;
