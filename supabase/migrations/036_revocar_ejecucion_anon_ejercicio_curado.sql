-- Por defecto Postgres deja EXECUTE a PUBLIC (incluye "anon"); la funcion ya se protege internamente
-- (auth.uid() is not null), pero el linter de seguridad de Supabase marca esto, asi que se cierra explicito.
revoke execute on function public.obtener_ejercicio_curado(uuid, smallint, uuid[]) from public;
revoke execute on function public.obtener_ejercicio_curado(uuid, smallint, uuid[]) from anon;
grant execute on function public.obtener_ejercicio_curado(uuid, smallint, uuid[]) to authenticated;
