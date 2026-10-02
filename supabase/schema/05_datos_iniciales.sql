-- Datos que la aplicacion necesita para funcionar: los niveles y sus habilidades, por modalidad.
-- Las habilidades se desbloquean en orden dentro de cada nivel (aprobar el examen final abre la siguiente).

insert into public.niveles (nombre, orden, modalidad, nota_aprobacion) values
  ('Básico', 1, 'primaria', 80),
  ('Intermedio', 2, 'primaria', 80),
  ('Avanzado', 3, 'primaria', 80),
  ('Experto', 4, 'primaria', 80),
  ('Básico', 1, 'secundaria', 80),
  ('Intermedio', 2, 'secundaria', 80),
  ('Avanzado', 3, 'secundaria', 80),
  ('Experto', 4, 'secundaria', 80);

insert into public.habilidades (nivel_id, nombre, orden, nota_aprobacion)
select n.id, x.nombre::public.nombre_habilidad, x.orden, 80
from (values
  ('primaria', 1, 'suma', 1), ('primaria', 1, 'resta', 2), ('primaria', 1, 'tabla_multiplicacion', 3),
  ('primaria', 2, 'multiplicacion', 1), ('primaria', 2, 'division', 2),
  ('primaria', 3, 'potencia', 1), ('primaria', 3, 'raiz', 2), ('primaria', 3, 'operaciones_combinadas', 3),
  ('primaria', 4, 'suma_enteros', 1), ('primaria', 4, 'resta_enteros', 2), ('primaria', 4, 'multiplicacion_enteros', 3),
  ('primaria', 4, 'division_enteros', 4), ('primaria', 4, 'potencia_enteros', 5), ('primaria', 4, 'raiz_enteros', 6),
  ('primaria', 4, 'ecuaciones', 7), ('primaria', 4, 'combinadas_enteros', 8),
  ('primaria', 4, 'atajos', 9), ('primaria', 4, 'razonamiento', 10),
  -- secundaria: Basico son todas las operaciones basicas juntas (en primaria van repartidas en 2 niveles)
  ('secundaria', 1, 'suma', 1), ('secundaria', 1, 'resta', 2), ('secundaria', 1, 'tabla_multiplicacion', 3),
  ('secundaria', 1, 'multiplicacion', 4), ('secundaria', 1, 'division', 5), ('secundaria', 1, 'potencia', 6),
  ('secundaria', 1, 'raiz', 7),
  -- secundaria: Intermedio es combinadas + numeros con signo + combinadas con signo
  ('secundaria', 2, 'operaciones_combinadas', 1), ('secundaria', 2, 'suma_enteros', 2), ('secundaria', 2, 'resta_enteros', 3),
  ('secundaria', 2, 'multiplicacion_enteros', 4), ('secundaria', 2, 'division_enteros', 5), ('secundaria', 2, 'potencia_enteros', 6),
  ('secundaria', 2, 'raiz_enteros', 7), ('secundaria', 2, 'combinadas_enteros', 8),
  -- secundaria: Avanzado es ecuaciones (mismo generador que primaria)
  ('secundaria', 3, 'ecuaciones', 1),
  -- secundaria: Experto es sistemas de ecuaciones (2 incognitas) + atajos + razonamiento, igual que
  -- en primaria (ahi tambien son el "cierre" del ultimo nivel)
  ('secundaria', 4, 'sistemas_ecuaciones', 1), ('secundaria', 4, 'atajos', 2), ('secundaria', 4, 'razonamiento', 3)
) as x(modalidad, nivel_orden, nombre, orden)
join public.niveles n on n.orden = x.nivel_orden and n.modalidad = x.modalidad::public.modalidad_estudiante;

-- Para volver administrador a una cuenta (despues de registrarse), en el editor SQL de Supabase:
--   update public.perfiles set rol = 'admin' where email = 'correo@ejemplo.com';
