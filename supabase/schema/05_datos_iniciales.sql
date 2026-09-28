-- Datos que la aplicacion necesita para funcionar: los 4 niveles y sus habilidades.
-- Las habilidades se desbloquean en orden dentro de cada nivel (aprobar el examen final abre la siguiente).

insert into public.niveles (nombre, orden, nota_aprobacion) values
  ('Básico', 1, 80),
  ('Intermedio', 2, 80),
  ('Avanzado', 3, 80),
  ('Experto', 4, 80);

insert into public.habilidades (nivel_id, nombre, orden, nota_aprobacion)
select n.id, x.nombre::public.nombre_habilidad, x.orden, 80
from (values
  (1, 'suma', 1), (1, 'resta', 2), (1, 'tabla_multiplicacion', 3),
  (2, 'multiplicacion', 1), (2, 'division', 2),
  (3, 'potencia', 1), (3, 'raiz', 2), (3, 'operaciones_combinadas', 3),
  (4, 'suma_enteros', 1), (4, 'resta_enteros', 2), (4, 'multiplicacion_enteros', 3), (4, 'division_enteros', 4),
  (4, 'potencia_enteros', 5), (4, 'raiz_enteros', 6), (4, 'ecuaciones', 7), (4, 'combinadas_enteros', 8),
  (4, 'atajos', 9), (4, 'razonamiento', 10)
) as x(nivel_orden, nombre, orden)
join public.niveles n on n.orden = x.nivel_orden;

-- Para volver administrador a una cuenta (despues de registrarse), en el editor SQL de Supabase:
--   update public.perfiles set rol = 'admin' where email = 'correo@ejemplo.com';
