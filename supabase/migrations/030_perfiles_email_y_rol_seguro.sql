-- APLICADA en Supabase (migracion 030).
-- 1. Correo en el perfil (para buscar estudiantes en el panel de administracion)
alter table public.perfiles add column if not exists email text;
update public.perfiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

-- 2. SEGURIDAD: el rol ya no se toma de los metadatos del registro (cualquiera podia registrarse como admin
--    enviando rol=admin). Todo usuario nuevo es estudiante; solo un admin puede cambiarlo despues.
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.perfiles (id, nombre, rol, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    'estudiante',
    new.email
  );
  return new;
end;
$$;

create index if not exists idx_perfiles_nombre on public.perfiles (lower(nombre));
create index if not exists idx_perfiles_email on public.perfiles (lower(email));
