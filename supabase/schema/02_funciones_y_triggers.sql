-- Funciones auxiliares y triggers. Van antes de las politicas (03) porque estas las usan.

-- ---------------------------------------------------------------- ayudantes de roles y progreso
create or replace function public.rol_actual()
returns public.rol_usuario
language sql stable security definer set search_path to 'public'
as $$ select rol from perfiles where id = auth.uid() $$;

create or replace function public.es_profesor_de(p_estudiante_id uuid)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1 from profesor_estudiante
    where profesor_id = auth.uid() and estudiante_id = p_estudiante_id and activo
  )
$$;

-- true si el estudiante aprobo los 15 ejercicios (5 digitos x 3) de la habilidad
create or replace function public.todos_ejercicios_aprobados(p_estudiante_id uuid, p_habilidad_id uuid)
returns boolean
language sql stable set search_path to 'public'
as $$
  select count(*) filter (where aprobado) = 15
  from progreso_ejercicio
  where estudiante_id = p_estudiante_id and habilidad_id = p_habilidad_id
$$;

-- true si aprobo el examen final de todas las habilidades del nivel
create or replace function public.habilidades_del_nivel_aprobadas(p_estudiante_id uuid, p_nivel_id uuid)
returns boolean
language sql stable set search_path to 'public'
as $$
  select not exists (
    select 1 from habilidades h
    where h.nivel_id = p_nivel_id
      and not exists (
        select 1 from evaluaciones_habilidad e
        where e.estudiante_id = p_estudiante_id and e.habilidad_id = h.id and e.aprobado
      )
  )
$$;

-- Tiempo minimo plausible (segundos) para resolver a mano una respuesta; por debajo se marca "muy rapida".
create or replace function public.umbral_segundos_intento(p_habilidad public.nombre_habilidad, p_digito integer)
returns numeric
language sql immutable set search_path to 'public'
as $$
  select case p_habilidad
    when 'tabla_multiplicacion' then 1.0
    when 'multiplicacion' then 5.0 * p_digito + 3.0
    when 'division' then 6.0 * p_digito + 4.0
    when 'potencia' then 4.0 * p_digito + 3.0
    when 'raiz' then case p_digito when 4 then 15.0 when 5 then 20.0 else 5.0 * p_digito + 5.0 end
    when 'operaciones_combinadas' then 4.0 * p_digito + 8.0
    when 'suma_enteros' then 5.0 * p_digito + 4.0
    when 'resta_enteros' then 5.0 * p_digito + 4.0
    when 'multiplicacion_enteros' then 5.0 * p_digito + 6.0
    when 'division_enteros' then 6.0 * p_digito + 6.0
    when 'potencia_enteros' then 4.0 * p_digito + 6.0
    when 'raiz_enteros' then 5.0 * p_digito + 6.0
    when 'ecuaciones' then 6.0 * p_digito + 6.0
    when 'combinadas_enteros' then 4.0 * p_digito + 10.0
    when 'atajos' then 4.0 * p_digito + 4.0
    when 'razonamiento' then 6.0 * p_digito + 15.0
    when 'sistemas_ecuaciones' then 10.0 * p_digito + 20.0
    else 3.0 * p_digito + 2.0
  end
$$;

-- ---------------------------------------------------------------- alta de usuarios
-- SEGURIDAD: el rol NUNCA se toma de los metadatos del registro; todo usuario nuevo es estudiante.
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql security definer set search_path to 'public'
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
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- Al crearse un estudiante: una fila de progreso por habilidad y ejercicio (solo el primero queda abierto).
create or replace function public.inicializar_progreso_estudiante()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
begin
  if new.rol = 'estudiante' then
    insert into progreso_habilidad (estudiante_id, habilidad_id, desbloqueada)
    select new.id, h.id, (n.orden = 1 and h.orden = 1)
    from habilidades h join niveles n on n.id = h.nivel_id
    on conflict (estudiante_id, habilidad_id) do nothing;

    insert into progreso_ejercicio (estudiante_id, habilidad_id, digito, numero_ejercicio, desbloqueado)
    select new.id, h.id, d.digito, e.numero_ejercicio,
           (n.orden = 1 and h.orden = 1 and d.digito = 1 and e.numero_ejercicio = 1)
    from habilidades h
    join niveles n on n.id = h.nivel_id
    cross join generate_series(1, 5) as d(digito)
    cross join generate_series(1, 3) as e(numero_ejercicio)
    on conflict (estudiante_id, habilidad_id, digito, numero_ejercicio) do nothing;
  end if;
  return new;
end;
$$;
create trigger inicializar_progreso_estudiante_trigger after insert on public.perfiles
  for each row execute function public.inicializar_progreso_estudiante();

-- ---------------------------------------------------------------- modalidad y examen de ubicacion
-- La modalidad se deduce del grado escolar, no se pregunta aparte.
create or replace function public.actualizar_modalidad_perfil()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.modalidad := case
    when new.grado_escolar is null then null
    when new.grado_escolar like 'primaria_%' then 'primaria'
    else 'secundaria'
  end;
  return new;
end;
$$;
create trigger actualizar_modalidad_perfil_trigger before insert or update of grado_escolar on public.perfiles
  for each row execute function public.actualizar_modalidad_perfil();

-- El estudiante no puede escribir directo en progreso_habilidad/progreso_ejercicio (RLS lo restringe
-- a admin), asi que el resultado del examen de ubicacion se aplica con una funcion que valida todo
-- server-side: cuantas preguntas, que modalidad tiene el estudiante, y hasta que nivel existe para
-- esa modalidad (secundaria por ahora solo llega a Intermedio). No fabrica "aprobado": solo desbloquea
-- el acceso a los niveles de abajo y el punto de partida en el nivel donde quedo ubicado.
create or replace function public.aplicar_examen_ubicacion(p_puntaje smallint)
returns table (nivel_orden smallint, nivel_nombre text)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_estudiante uuid := auth.uid();
  v_modalidad public.modalidad_estudiante;
  v_max_orden smallint;
  v_objetivo smallint;
begin
  if v_estudiante is null then
    raise exception 'No autenticado';
  end if;
  if p_puntaje is null or p_puntaje < 0 or p_puntaje > 20 then
    raise exception 'Puntaje invalido';
  end if;

  select modalidad into v_modalidad from perfiles where id = v_estudiante;
  if v_modalidad is null then
    raise exception 'Completa tu perfil (grado escolar) antes de rendir el examen de ubicacion';
  end if;

  select max(orden) into v_max_orden from niveles where modalidad = v_modalidad;

  v_objetivo := case
    when p_puntaje >= 16 then least(4, v_max_orden)
    when p_puntaje >= 11 then least(3, v_max_orden)
    else 1
  end;

  insert into evaluaciones_ubicacion (estudiante_id, modalidad, puntaje, nivel_inicial)
  values (v_estudiante, v_modalidad, p_puntaje, v_objetivo);

  update progreso_habilidad ph
  set desbloqueada = true
  from habilidades h, niveles n
  where ph.habilidad_id = h.id and h.nivel_id = n.id
    and ph.estudiante_id = v_estudiante
    and n.modalidad = v_modalidad
    and n.orden <= v_objetivo;

  update progreso_ejercicio pe
  set desbloqueado = true
  from habilidades h, niveles n
  where pe.habilidad_id = h.id and h.nivel_id = n.id
    and pe.estudiante_id = v_estudiante
    and n.modalidad = v_modalidad
    and n.orden <= v_objetivo
    and pe.digito = 1 and pe.numero_ejercicio = 1;

  return query
    select n.orden, n.nombre from niveles n where n.modalidad = v_modalidad and n.orden = v_objetivo;
end;
$$;

revoke execute on function public.aplicar_examen_ubicacion(smallint) from public;
revoke execute on function public.aplicar_examen_ubicacion(smallint) from anon;
grant execute on function public.aplicar_examen_ubicacion(smallint) to authenticated;

-- Solo un admin puede cambiar el rol o el estado de un perfil.
create or replace function public.proteger_campos_sensibles_perfil()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
begin
  if rol_actual() <> 'admin' then
    if new.rol <> old.rol or new.estado <> old.estado then
      raise exception 'Solo un administrador puede cambiar rol o estado';
    end if;
  end if;
  return new;
end;
$$;
create trigger proteger_perfil_antes_update before update on public.perfiles
  for each row execute function public.proteger_campos_sensibles_perfil();

-- La tabla "ejercicios" solo es para atajos y razonamiento (lo demas se genera en la aplicacion).
create or replace function public.validar_habilidad_ejercicio()
returns trigger
language plpgsql set search_path to 'public'
as $$
declare
  v_nombre public.nombre_habilidad;
begin
  select nombre into v_nombre from habilidades where id = new.habilidad_id;
  if v_nombre not in ('razonamiento', 'atajos') then
    raise exception 'Los ejercicios de tabla solo aplican a razonamiento y atajos (habilidad: %)', v_nombre;
  end if;
  return new;
end;
$$;
create trigger validar_habilidad_ejercicio_trigger before insert or update on public.ejercicios
  for each row execute function public.validar_habilidad_ejercicio();

-- El estudiante no puede leer la tabla "ejercicios" (RLS), asi que pide uno a la vez con esta funcion,
-- que no expone el resto del banco de atajos/razonamiento.
create or replace function public.obtener_ejercicio_curado(
  p_habilidad_id uuid,
  p_dificultad smallint,
  p_excluir uuid[] default '{}'
)
returns table (id uuid, enunciado text, respuesta text, explicacion text)
language sql
security definer
set search_path to 'public'
stable
as $$
  select e.id, e.enunciado, e.respuesta, e.explicacion
  from ejercicios e
  where auth.uid() is not null
    and e.habilidad_id = p_habilidad_id
    and e.dificultad = p_dificultad
    and not (e.id = any (p_excluir))
  order by random()
  limit 1;
$$;

revoke execute on function public.obtener_ejercicio_curado(uuid, smallint, uuid[]) from public;
revoke execute on function public.obtener_ejercicio_curado(uuid, smallint, uuid[]) from anon;
grant execute on function public.obtener_ejercicio_curado(uuid, smallint, uuid[]) to authenticated;

-- ---------------------------------------------------------------- sesiones e intentos
-- Una sesion nueva empieza vacia, con la hora del servidor y, si es practica, sobre un ejercicio desbloqueado.
create or replace function public.validar_nueva_sesion()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
begin
  if auth.uid() is null or rol_actual() = 'admin' then
    return new;
  end if;

  new.total_ejercicios := 0;
  new.correctos := 0;
  new.fin := null;
  new.inicio := now();

  if new.tipo = 'practica' then
    if new.habilidad_id is null or new.digito is null or new.numero_ejercicio is null
       or new.digito not between 1 and 5 or new.numero_ejercicio not between 1 and 3 then
      raise exception 'Sesion de practica incompleta';
    end if;
    if not exists (
      select 1 from progreso_ejercicio
      where estudiante_id = new.estudiante_id and habilidad_id = new.habilidad_id
        and digito = new.digito and numero_ejercicio = new.numero_ejercicio and desbloqueado
    ) then
      raise exception 'Este ejercicio aun no esta desbloqueado';
    end if;
  end if;
  return new;
end;
$$;
create trigger validar_nueva_sesion_trigger before insert on public.sesiones
  for each row execute function public.validar_nueva_sesion();

-- Un examen consume la autorizacion del administrador al comenzar.
create or replace function public.consumir_autorizacion_examen()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
begin
  if new.tipo in ('evaluacion_habilidad', 'evaluacion') then
    update autorizaciones_examen
    set estado = 'usado', usado_at = now()
    where id = (
      select id from autorizaciones_examen
      where estudiante_id = new.estudiante_id
        and estado = 'autorizado'
        and (
          (new.tipo = 'evaluacion_habilidad' and habilidad_id = new.habilidad_id)
          or (new.tipo = 'evaluacion' and nivel_id = new.nivel_id)
        )
      order by autorizado_at desc nulls last
      limit 1
    );
  end if;
  return new;
end;
$$;
create trigger consumir_autorizacion_examen_trigger after insert on public.sesiones
  for each row execute function public.consumir_autorizacion_examen();

-- Un intento solo se guarda en una sesion propia, abierta y con cupo.
create or replace function public.validar_nuevo_intento()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
declare
  s sesiones%rowtype;
begin
  if auth.uid() is null or rol_actual() = 'admin' then
    return new;
  end if;

  select * into s from sesiones where id = new.sesion_id;
  if not found or s.estudiante_id <> new.estudiante_id then
    raise exception 'Sesion invalida';
  end if;
  if s.fin is not null then
    raise exception 'La sesion ya termino';
  end if;
  if s.habilidad_id is not null and s.habilidad_id <> new.habilidad_id then
    raise exception 'El intento no corresponde a la habilidad de la sesion';
  end if;
  if s.tipo = 'practica' and (s.total_ejercicios >= 10 or new.dificultad <> s.digito) then
    raise exception 'Intento fuera de la sesion de practica';
  end if;
  if s.tipo = 'evaluacion_habilidad' and s.total_ejercicios >= 20 then
    raise exception 'La evaluacion ya tiene todas sus preguntas';
  end if;
  if new.segundos < 0 then
    raise exception 'Tiempo invalido';
  end if;
  return new;
end;
$$;
create trigger validar_nuevo_intento_trigger before insert on public.intentos
  for each row execute function public.validar_nuevo_intento();

-- Cada intento suma al contador de la habilidad y de la sesion y actualiza el ultimo acceso.
create or replace function public.procesar_nuevo_intento()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
begin
  update progreso_habilidad
  set total_intentos = total_intentos + 1
  where estudiante_id = new.estudiante_id and habilidad_id = new.habilidad_id;

  update perfiles set fecha_ultimo_acceso = new.created_at where id = new.estudiante_id;

  update sesiones
  set total_ejercicios = total_ejercicios + 1,
      correctos = correctos + case when new.es_correcto then 1 else 0 end
  where id = new.sesion_id;

  return new;
end;
$$;
create trigger procesar_nuevo_intento_trigger after insert on public.intentos
  for each row execute function public.procesar_nuevo_intento();

-- Al cerrar una sesion se califica (solo si esta completa: 10 practica, 20 examen de habilidad, 10+ evaluacion
-- de nivel), se aprueba o no el ejercicio, se desbloquea lo siguiente y se registran los examenes.
create or replace function public.procesar_sesion_completada()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_puntaje numeric;
  v_aprobado boolean;
  v_nota_nivel numeric;
  v_habilidad_actual habilidades%rowtype;
  v_siguiente_habilidad habilidades%rowtype;
  v_total_aprobados int;
begin
  if new.total_ejercicios = 0 then
    return new;
  end if;

  if (new.tipo = 'practica' and new.total_ejercicios < 10)
     or (new.tipo = 'evaluacion_habilidad' and new.total_ejercicios < 20)
     or (new.tipo = 'evaluacion' and new.total_ejercicios < 10) then
    return new;
  end if;

  v_puntaje := round((new.correctos::numeric / new.total_ejercicios) * 100, 2);

  if new.tipo = 'evaluacion' and new.nivel_id is not null then
    select nota_aprobacion into v_nota_nivel from niveles where id = new.nivel_id;
    insert into evaluaciones_nivel (estudiante_id, nivel_id, sesion_id, puntaje, aprobado)
    values (new.estudiante_id, new.nivel_id, new.id, v_puntaje, v_puntaje >= v_nota_nivel);
    return new;
  end if;

  if new.habilidad_id is null then
    return new;
  end if;

  select * into v_habilidad_actual from habilidades where id = new.habilidad_id;
  v_aprobado := v_puntaje >= v_habilidad_actual.nota_aprobacion;

  if new.tipo = 'practica' and new.digito is not null and new.numero_ejercicio is not null then
    insert into progreso_ejercicio (estudiante_id, habilidad_id, digito, numero_ejercicio, aprobado, mejor_puntaje, intentos, ultima_practica)
    values (new.estudiante_id, new.habilidad_id, new.digito, new.numero_ejercicio, v_aprobado, v_puntaje, 1, new.fin)
    on conflict (estudiante_id, habilidad_id, digito, numero_ejercicio)
    do update set
      aprobado = progreso_ejercicio.aprobado or v_aprobado,
      mejor_puntaje = greatest(progreso_ejercicio.mejor_puntaje, v_puntaje),
      intentos = progreso_ejercicio.intentos + 1,
      ultima_practica = new.fin;

    if v_aprobado then
      if new.numero_ejercicio < 3 then
        insert into progreso_ejercicio (estudiante_id, habilidad_id, digito, numero_ejercicio, desbloqueado)
        values (new.estudiante_id, new.habilidad_id, new.digito, new.numero_ejercicio + 1, true)
        on conflict (estudiante_id, habilidad_id, digito, numero_ejercicio)
        do update set desbloqueado = true;
      elsif new.digito < 5 then
        insert into progreso_ejercicio (estudiante_id, habilidad_id, digito, numero_ejercicio, desbloqueado)
        values (new.estudiante_id, new.habilidad_id, new.digito + 1, 1, true)
        on conflict (estudiante_id, habilidad_id, digito, numero_ejercicio)
        do update set desbloqueado = true;
      end if;
    end if;

    select count(*) into v_total_aprobados
    from progreso_ejercicio
    where estudiante_id = new.estudiante_id and habilidad_id = new.habilidad_id and aprobado;

    update progreso_habilidad
    set porcentaje_dominio = round((v_total_aprobados / 15.0) * 100, 2),
        ultima_practica = new.fin
    where estudiante_id = new.estudiante_id and habilidad_id = new.habilidad_id;

  elsif new.tipo = 'evaluacion_habilidad' then
    insert into evaluaciones_habilidad (estudiante_id, habilidad_id, sesion_id, puntaje, aprobado)
    values (new.estudiante_id, new.habilidad_id, new.id, v_puntaje, v_aprobado);

    if v_aprobado then
      update progreso_habilidad
      set porcentaje_dominio = 100, ultima_practica = new.fin
      where estudiante_id = new.estudiante_id and habilidad_id = new.habilidad_id;

      select * into v_siguiente_habilidad
      from habilidades
      where nivel_id = v_habilidad_actual.nivel_id and orden = v_habilidad_actual.orden + 1;

      if found then
        insert into progreso_habilidad (estudiante_id, habilidad_id, desbloqueada)
        values (new.estudiante_id, v_siguiente_habilidad.id, true)
        on conflict (estudiante_id, habilidad_id)
        do update set desbloqueada = true;

        insert into progreso_ejercicio (estudiante_id, habilidad_id, digito, numero_ejercicio, desbloqueado)
        values (new.estudiante_id, v_siguiente_habilidad.id, 1, 1, true)
        on conflict (estudiante_id, habilidad_id, digito, numero_ejercicio)
        do update set desbloqueado = true;
      end if;
    end if;
  end if;

  return new;
end;
$$;
create trigger procesar_sesion_completada_trigger after update on public.sesiones
  for each row when (old.fin is null and new.fin is not null)
  execute function public.procesar_sesion_completada();

-- Aprobar la evaluacion de un nivel abre la primera habilidad del siguiente.
create or replace function public.desbloquear_siguiente_nivel()
returns trigger
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_primera_habilidad_siguiente habilidades%rowtype;
begin
  if new.aprobado then
    select h.* into v_primera_habilidad_siguiente
    from habilidades h
    join niveles n_actual on n_actual.id = new.nivel_id
    join niveles n_siguiente on n_siguiente.orden = n_actual.orden + 1
      and n_siguiente.modalidad = n_actual.modalidad
    where h.nivel_id = n_siguiente.id and h.orden = 1;

    if found then
      insert into progreso_habilidad (estudiante_id, habilidad_id, desbloqueada)
      values (new.estudiante_id, v_primera_habilidad_siguiente.id, true)
      on conflict (estudiante_id, habilidad_id)
      do update set desbloqueada = true;

      insert into progreso_ejercicio (estudiante_id, habilidad_id, digito, numero_ejercicio, desbloqueado)
      values (new.estudiante_id, v_primera_habilidad_siguiente.id, 1, 1, true)
      on conflict (estudiante_id, habilidad_id, digito, numero_ejercicio)
      do update set desbloqueado = true;
    end if;
  end if;
  return new;
end;
$$;
create trigger desbloquear_siguiente_nivel_trigger after insert on public.evaluaciones_nivel
  for each row execute function public.desbloquear_siguiente_nivel();

-- ---------------------------------------------------------------- permisos de ejecucion
-- Las funciones de trigger no deben poder llamarse por la API (RPC).
revoke execute on function public.consumir_autorizacion_examen() from public, anon, authenticated;
revoke execute on function public.desbloquear_siguiente_nivel() from public, anon, authenticated;
revoke execute on function public.inicializar_progreso_estudiante() from public, anon, authenticated;
revoke execute on function public.manejar_nuevo_usuario() from public, anon, authenticated;
revoke execute on function public.procesar_nuevo_intento() from public, anon, authenticated;
revoke execute on function public.procesar_sesion_completada() from public, anon, authenticated;
revoke execute on function public.proteger_campos_sensibles_perfil() from public, anon, authenticated;
revoke execute on function public.validar_nueva_sesion() from public, anon, authenticated;
revoke execute on function public.validar_nuevo_intento() from public, anon, authenticated;
