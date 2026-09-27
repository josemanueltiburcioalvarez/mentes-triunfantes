-- APLICADA en Supabase (migracion 027). Raiz: digitos 4 (cubica) y 5 (cuarta y quinta) tienen ejercicios
-- faciles de resolver rapido (∛8, ∜16), asi que el tiempo minimo plausible baja (15 s y 20 s).
create or replace function public.umbral_segundos_intento(p_habilidad nombre_habilidad, p_digito integer)
returns numeric
language sql
immutable
set search_path to 'public'
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
    else 3.0 * p_digito + 2.0
  end
$$;
