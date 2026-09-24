-- APLICADA en Supabase (migracion 026). Las funciones de los triggers nuevos no deben poder llamarse por RPC.
revoke execute on function public.validar_nueva_sesion() from public, anon, authenticated;
revoke execute on function public.validar_nuevo_intento() from public, anon, authenticated;
