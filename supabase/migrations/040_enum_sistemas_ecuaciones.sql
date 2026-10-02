-- Valor nuevo del enum de habilidades: sistemas de ecuaciones (2 incognitas), para el nivel Experto
-- de Secundaria. En su propia migracion porque Postgres no permite usar un valor de enum nuevo en la
-- misma transaccion en la que se agrega (ver migracion 028/029 para el mismo patron).
alter type public.nombre_habilidad add value if not exists 'sistemas_ecuaciones';
