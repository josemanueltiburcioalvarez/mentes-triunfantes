-- APLICADA en Supabase (migracion 028). Valor nuevo del enum de habilidades.
alter type public.nombre_habilidad add value if not exists 'combinadas_enteros';
