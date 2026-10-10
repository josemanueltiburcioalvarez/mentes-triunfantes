-- Los logros se calculan con el progreso (no se guardan), pero para avisar "¡Nuevo logro!" una sola vez hace falta
-- recordar cuales ya vio cada estudiante. Una fila por logro visto; el id es el del catalogo (src/lib/logros.ts).
create table public.logros_vistos (
  estudiante_id uuid not null references public.perfiles(id) on delete cascade,
  logro_id text not null check (char_length(logro_id) between 1 and 60),
  created_at timestamptz not null default now(),
  primary key (estudiante_id, logro_id)
);

alter table public.logros_vistos enable row level security;

create policy logros_vistos_select on public.logros_vistos for select to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin'
         or ((select rol_actual()) = 'profesor' and es_profesor_de(estudiante_id)));

-- el estudiante solo anota lo suyo; no se edita ni se borra (lo borra la cascada si se elimina la cuenta)
create policy logros_vistos_insert on public.logros_vistos for insert to authenticated
  with check (estudiante_id = (select auth.uid()));
