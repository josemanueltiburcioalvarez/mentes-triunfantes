-- APLICADA en Supabase (migracion 025). Cierra los huecos encontrados en la auditoria:
--  * un estudiante podia editar su propia sesion (correctos/total/fin/tipo/digito) y aprobar sin responder
--  * un estudiante podia abrir una sesion de practica de un ejercicio bloqueado
--  * un estudiante podia agregar intentos a sesiones ajenas, ya terminadas o en exceso
--  * una sesion con 1 solo intento correcto contaba como 100 %
--  * anon tenia privilegios de tabla (RLS ya lo bloqueaba, esto es defensa en profundidad)

-- 1. Privilegios minimos
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
revoke update on public.sesiones from authenticated;
grant update (fin) on public.sesiones to authenticated;
revoke update, delete on public.intentos from authenticated;

-- 2. Una sesion nueva empieza vacia, con la hora del servidor y, si es practica, sobre un ejercicio desbloqueado
create or replace function public.validar_nueva_sesion()
returns trigger
language plpgsql
security definer
set search_path to 'public'
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
      where estudiante_id = new.estudiante_id
        and habilidad_id = new.habilidad_id
        and digito = new.digito
        and numero_ejercicio = new.numero_ejercicio
        and desbloqueado
    ) then
      raise exception 'Este ejercicio aun no esta desbloqueado';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validar_nueva_sesion_trigger on public.sesiones;
create trigger validar_nueva_sesion_trigger
  before insert on public.sesiones
  for each row execute function public.validar_nueva_sesion();

-- 3. Un intento solo se guarda en una sesion propia, abierta y con cupo
create or replace function public.validar_nuevo_intento()
returns trigger
language plpgsql
security definer
set search_path to 'public'
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

drop trigger if exists validar_nuevo_intento_trigger on public.intentos;
create trigger validar_nuevo_intento_trigger
  before insert on public.intentos
  for each row execute function public.validar_nuevo_intento();

-- 4. Una sesion solo se califica si esta completa (10 practica, 20 examen de habilidad, 10+ evaluacion de nivel)
create or replace function public.procesar_sesion_completada()
returns trigger
language plpgsql
security definer
set search_path to 'public'
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
      where nivel_id = v_habilidad_actual.nivel_id
        and orden = v_habilidad_actual.orden + 1;

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
