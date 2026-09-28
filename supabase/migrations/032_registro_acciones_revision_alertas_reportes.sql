-- APLICADA en Supabase (migracion 032).
-- Registro de acciones del admin, revision de alertas y vistas de reportes.

-- 1. Registro de acciones del administrador
create table public.acciones_admin (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.perfiles(id) on delete set null,
  estudiante_id uuid references public.perfiles(id) on delete set null,
  tipo text not null,
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index idx_acciones_admin_fecha on public.acciones_admin (created_at desc);
create index idx_acciones_admin_estudiante on public.acciones_admin (estudiante_id);
create index idx_acciones_admin_admin on public.acciones_admin (admin_id);
alter table public.acciones_admin enable row level security;
create policy acciones_admin_select on public.acciones_admin for select to authenticated
  using ((select rol_actual()) = 'admin');
create policy acciones_admin_insert on public.acciones_admin for insert to authenticated
  with check ((select rol_actual()) = 'admin' and admin_id = (select auth.uid()));
revoke all on public.acciones_admin from anon;
revoke update, delete, truncate, references, trigger on public.acciones_admin from authenticated;

-- 2. Revision de sesiones sospechosas (revisada o descartada, con nota)
create table public.revisiones_alerta (
  sesion_id uuid primary key references public.sesiones(id) on delete cascade,
  estado text not null check (estado in ('revisada', 'descartada')),
  nota text,
  admin_id uuid references public.perfiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_revisiones_alerta_admin on public.revisiones_alerta (admin_id);
alter table public.revisiones_alerta enable row level security;
create policy revisiones_alerta_select on public.revisiones_alerta for select to authenticated
  using ((select rol_actual()) = 'admin');
create policy revisiones_alerta_insert on public.revisiones_alerta for insert to authenticated
  with check ((select rol_actual()) = 'admin' and admin_id = (select auth.uid()));
create policy revisiones_alerta_update on public.revisiones_alerta for update to authenticated
  using ((select rol_actual()) = 'admin') with check ((select rol_actual()) = 'admin');
create policy revisiones_alerta_delete on public.revisiones_alerta for delete to authenticated
  using ((select rol_actual()) = 'admin');
revoke all on public.revisiones_alerta from anon;
revoke truncate, references, trigger on public.revisiones_alerta from authenticated;

-- 3. vista_sesiones_sospechosas: agrega revision_estado, revision_nota y revision_fecha
--    (definicion completa aplicada; ver la base de datos con pg_get_viewdef)
-- 4. vista_estudiantes_admin: solo cuentan las alertas sin revisar (s.revision_estado is null)
-- 5. vista_reporte_habilidades: rendimiento por habilidad (dominio, % correctas, tiempo, examenes)
-- 6. vista_actividad_diaria: respuestas, sesiones y estudiantes activos por dia (hora de Lima)
