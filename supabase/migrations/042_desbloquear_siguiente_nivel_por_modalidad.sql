-- Al aprobar la evaluacion de un nivel se abre la primera habilidad del siguiente nivel. Desde que
-- existen dos modalidades hay dos niveles con el mismo "orden", asi que el join solo por orden podia
-- abrir el siguiente nivel de la OTRA modalidad. Se exige la misma modalidad.
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
