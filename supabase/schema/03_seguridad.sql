-- Seguridad a nivel de fila (RLS) y privilegios.
-- Tres niveles: el estudiante ve lo suyo; el profesor, lo de sus estudiantes asignados; el admin, todo.

alter table public.perfiles enable row level security;
alter table public.niveles enable row level security;
alter table public.habilidades enable row level security;
alter table public.ejercicios enable row level security;
alter table public.profesor_estudiante enable row level security;
alter table public.sesiones enable row level security;
alter table public.intentos enable row level security;
alter table public.progreso_habilidad enable row level security;
alter table public.progreso_ejercicio enable row level security;
alter table public.evaluaciones_habilidad enable row level security;
alter table public.evaluaciones_nivel enable row level security;
alter table public.autorizaciones_examen enable row level security;
alter table public.suscripciones enable row level security;
alter table public.acciones_admin enable row level security;
alter table public.revisiones_alerta enable row level security;

-- ---------------------------------------------------------------- perfiles
create policy perfiles_select on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or (select rol_actual()) = 'admin'
         or ((select rol_actual()) = 'profesor' and es_profesor_de(id)));
create policy perfiles_update on public.perfiles for update to authenticated
  using (id = (select auth.uid()) or (select rol_actual()) = 'admin')
  with check (id = (select auth.uid()) or (select rol_actual()) = 'admin');

-- ---------------------------------------------------------------- catalogo (niveles, habilidades, ejercicios)
create policy niveles_select on public.niveles for select to authenticated using (true);
create policy niveles_admin_insert on public.niveles for insert to authenticated with check ((select rol_actual()) = 'admin');
create policy niveles_admin_update on public.niveles for update to authenticated
  using ((select rol_actual()) = 'admin') with check ((select rol_actual()) = 'admin');
create policy niveles_admin_delete on public.niveles for delete to authenticated using ((select rol_actual()) = 'admin');

create policy habilidades_select on public.habilidades for select to authenticated using (true);
create policy habilidades_admin_insert on public.habilidades for insert to authenticated with check ((select rol_actual()) = 'admin');
create policy habilidades_admin_update on public.habilidades for update to authenticated
  using ((select rol_actual()) = 'admin') with check ((select rol_actual()) = 'admin');
create policy habilidades_admin_delete on public.habilidades for delete to authenticated using ((select rol_actual()) = 'admin');

create policy ejercicios_select_staff on public.ejercicios for select to authenticated
  using ((select rol_actual()) in ('admin', 'profesor'));
create policy ejercicios_admin_insert on public.ejercicios for insert to authenticated with check ((select rol_actual()) = 'admin');
create policy ejercicios_admin_update on public.ejercicios for update to authenticated
  using ((select rol_actual()) = 'admin') with check ((select rol_actual()) = 'admin');
create policy ejercicios_admin_delete on public.ejercicios for delete to authenticated using ((select rol_actual()) = 'admin');

-- ---------------------------------------------------------------- profesores
create policy profesor_estudiante_select on public.profesor_estudiante for select to authenticated
  using (profesor_id = (select auth.uid()) or estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin');
create policy profesor_estudiante_admin_insert on public.profesor_estudiante for insert to authenticated
  with check ((select rol_actual()) = 'admin');
create policy profesor_estudiante_admin_update on public.profesor_estudiante for update to authenticated
  using ((select rol_actual()) = 'admin') with check ((select rol_actual()) = 'admin');
create policy profesor_estudiante_admin_delete on public.profesor_estudiante for delete to authenticated
  using ((select rol_actual()) = 'admin');

-- ---------------------------------------------------------------- sesiones e intentos
-- Un examen solo se puede iniciar con una autorizacion vigente del administrador.
create policy sesiones_insert on public.sesiones for insert to authenticated
  with check (
    (select rol_actual()) = 'admin'
    or (estudiante_id = (select auth.uid()) and (
      tipo = 'practica'
      or (tipo = 'evaluacion_habilidad' and exists (
        select 1 from autorizaciones_examen a
        where a.estudiante_id = (select auth.uid()) and a.habilidad_id = sesiones.habilidad_id and a.estado = 'autorizado'))
      or (tipo = 'evaluacion' and exists (
        select 1 from autorizaciones_examen a
        where a.estudiante_id = (select auth.uid()) and a.nivel_id = sesiones.nivel_id and a.estado = 'autorizado'))
    ))
  );
create policy sesiones_select on public.sesiones for select to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin'
         or ((select rol_actual()) = 'profesor' and es_profesor_de(estudiante_id)));
create policy sesiones_update on public.sesiones for update to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin')
  with check (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin');

create policy intentos_insert on public.intentos for insert to authenticated
  with check (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin');
create policy intentos_select on public.intentos for select to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin'
         or ((select rol_actual()) = 'profesor' and es_profesor_de(estudiante_id)));

-- ---------------------------------------------------------------- progreso y evaluaciones (solo lectura para el estudiante)
create policy progreso_habilidad_select on public.progreso_habilidad for select to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin'
         or ((select rol_actual()) = 'profesor' and es_profesor_de(estudiante_id)));
create policy progreso_habilidad_admin_insert on public.progreso_habilidad for insert to authenticated
  with check ((select rol_actual()) = 'admin');
create policy progreso_habilidad_admin_update on public.progreso_habilidad for update to authenticated
  using ((select rol_actual()) = 'admin') with check ((select rol_actual()) = 'admin');
create policy progreso_habilidad_admin_delete on public.progreso_habilidad for delete to authenticated
  using ((select rol_actual()) = 'admin');

create policy progreso_ejercicio_select on public.progreso_ejercicio for select to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin'
         or ((select rol_actual()) = 'profesor' and es_profesor_de(estudiante_id)));
create policy progreso_ejercicio_admin_insert on public.progreso_ejercicio for insert to authenticated
  with check ((select rol_actual()) = 'admin');
create policy progreso_ejercicio_admin_update on public.progreso_ejercicio for update to authenticated
  using ((select rol_actual()) = 'admin') with check ((select rol_actual()) = 'admin');
create policy progreso_ejercicio_admin_delete on public.progreso_ejercicio for delete to authenticated
  using ((select rol_actual()) = 'admin');

create policy evaluaciones_habilidad_select on public.evaluaciones_habilidad for select to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin'
         or ((select rol_actual()) = 'profesor' and es_profesor_de(estudiante_id)));
create policy evaluaciones_habilidad_admin_insert on public.evaluaciones_habilidad for insert to authenticated
  with check ((select rol_actual()) = 'admin');

create policy evaluaciones_nivel_select on public.evaluaciones_nivel for select to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin'
         or ((select rol_actual()) = 'profesor' and es_profesor_de(estudiante_id)));
create policy evaluaciones_nivel_admin_insert on public.evaluaciones_nivel for insert to authenticated
  with check ((select rol_actual()) = 'admin');

-- ---------------------------------------------------------------- autorizaciones de examen
-- El estudiante solo puede solicitar (estado 'solicitado', sin enlace) si ya aprobo los 15 ejercicios
-- de la habilidad, o los examenes de todas las habilidades del nivel.
create policy autorizaciones_examen_select on public.autorizaciones_examen for select to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin'
         or ((select rol_actual()) = 'profesor' and es_profesor_de(estudiante_id)));
create policy autorizaciones_examen_insert on public.autorizaciones_examen for insert to authenticated
  with check (
    (select rol_actual()) = 'admin'
    or (estudiante_id = (select auth.uid()) and estado = 'solicitado' and meet_url is null
        and autorizado_por is null and autorizado_at is null and usado_at is null
        and ((habilidad_id is not null and todos_ejercicios_aprobados(estudiante_id, habilidad_id))
             or (nivel_id is not null and habilidades_del_nivel_aprobadas(estudiante_id, nivel_id))))
  );
create policy autorizaciones_examen_admin_update on public.autorizaciones_examen for update to authenticated
  using ((select rol_actual()) = 'admin') with check ((select rol_actual()) = 'admin');
create policy autorizaciones_examen_admin_delete on public.autorizaciones_examen for delete to authenticated
  using ((select rol_actual()) = 'admin');

-- ---------------------------------------------------------------- suscripciones
create policy suscripciones_select on public.suscripciones for select to authenticated
  using (estudiante_id = (select auth.uid()) or (select rol_actual()) = 'admin');
create policy suscripciones_admin_insert on public.suscripciones for insert to authenticated
  with check ((select rol_actual()) = 'admin');
create policy suscripciones_admin_update on public.suscripciones for update to authenticated
  using ((select rol_actual()) = 'admin') with check ((select rol_actual()) = 'admin');
create policy suscripciones_admin_delete on public.suscripciones for delete to authenticated
  using ((select rol_actual()) = 'admin');

-- ---------------------------------------------------------------- registro de acciones y revision de alertas (solo admin)
create policy acciones_admin_select on public.acciones_admin for select to authenticated
  using ((select rol_actual()) = 'admin');
create policy acciones_admin_insert on public.acciones_admin for insert to authenticated
  with check ((select rol_actual()) = 'admin' and admin_id = (select auth.uid()));

create policy revisiones_alerta_select on public.revisiones_alerta for select to authenticated
  using ((select rol_actual()) = 'admin');
create policy revisiones_alerta_insert on public.revisiones_alerta for insert to authenticated
  with check ((select rol_actual()) = 'admin' and admin_id = (select auth.uid()));
create policy revisiones_alerta_update on public.revisiones_alerta for update to authenticated
  using ((select rol_actual()) = 'admin') with check ((select rol_actual()) = 'admin');
create policy revisiones_alerta_delete on public.revisiones_alerta for delete to authenticated
  using ((select rol_actual()) = 'admin');

-- ---------------------------------------------------------------- privilegios minimos
-- Sin sesion (anon) no se toca ninguna tabla. Ademas se quitan permisos que la aplicacion nunca usa.
-- (Supabase ya concede estos privilegios por defecto; se dejan explicitos para no depender de eso.)
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
-- Un estudiante solo puede cerrar su sesion (fin); las notas las calcula la base de datos.
revoke update on public.sesiones from authenticated;
grant update (fin) on public.sesiones to authenticated;
revoke update, delete on public.intentos from authenticated;
revoke update, delete on public.acciones_admin from authenticated;
