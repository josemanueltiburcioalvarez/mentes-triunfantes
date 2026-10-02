-- Mentes Triunfantes · esquema de la base de datos (Supabase / Postgres 17)
-- Estado actual tras la migracion 032. Se aplica en orden: 01, 02, 03, 04, 05.
-- Las migraciones incrementales estan en supabase/migrations (desde la 025); este esquema permite
-- reconstruir la base completa en un proyecto nuevo.

-- ---------------------------------------------------------------- tipos
create type public.rol_usuario as enum ('estudiante', 'profesor', 'admin');
create type public.estado_usuario as enum ('activo', 'inactivo', 'suspendido');
create type public.estado_suscripcion as enum ('pendiente', 'activa', 'vencida', 'cancelada');
create type public.estado_autorizacion_examen as enum ('solicitado', 'autorizado', 'usado', 'cancelado');
create type public.tipo_sesion as enum ('practica', 'evaluacion', 'evaluacion_habilidad');
create type public.nombre_habilidad as enum (
  'suma', 'resta', 'tabla_multiplicacion', 'multiplicacion', 'division', 'potencia', 'raiz',
  'operaciones_combinadas', 'atajos', 'razonamiento',
  'suma_enteros', 'resta_enteros', 'multiplicacion_enteros', 'division_enteros',
  'potencia_enteros', 'raiz_enteros', 'ecuaciones', 'combinadas_enteros'
);
-- Primaria (el curriculo original) y Secundaria (un segundo curriculo, por ahora solo con Basico e
-- Intermedio) agrupan las mismas habilidades en niveles distintos. Se deduce del grado escolar.
create type public.modalidad_estudiante as enum ('primaria', 'secundaria');

-- ---------------------------------------------------------------- tablas
create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol public.rol_usuario not null default 'estudiante',
  -- 'primaria_1'..'primaria_6', 'secundaria_1'..'secundaria_5'; de aqui se deduce "modalidad"
  grado_escolar text check (
    grado_escolar is null or grado_escolar in (
      'primaria_1', 'primaria_2', 'primaria_3', 'primaria_4', 'primaria_5', 'primaria_6',
      'secundaria_1', 'secundaria_2', 'secundaria_3', 'secundaria_4', 'secundaria_5'
    )
  ),
  modalidad public.modalidad_estudiante,
  edad smallint check (edad between 3 and 25),
  estado public.estado_usuario not null default 'activo',
  fecha_ultimo_acceso timestamptz,
  created_at timestamptz not null default now(),
  email text
);

create table public.niveles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  orden smallint not null check (orden between 1 and 4),
  modalidad public.modalidad_estudiante not null,
  nota_aprobacion numeric(5,2) not null default 80.00 check (nota_aprobacion between 0 and 100),
  unique (modalidad, orden)
);

create table public.habilidades (
  id uuid primary key default gen_random_uuid(),
  nivel_id uuid not null references public.niveles(id) on delete cascade,
  nombre public.nombre_habilidad not null,
  orden smallint not null,
  nota_aprobacion numeric(5,2) not null default 80.00 check (nota_aprobacion between 0 and 100),
  unique (nivel_id, nombre)
);

create table public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  habilidad_id uuid not null references public.habilidades(id) on delete cascade,
  dificultad smallint not null check (dificultad between 1 and 10),
  enunciado text not null,
  respuesta text not null,
  explicacion text,
  created_at timestamptz not null default now()
);

create table public.profesor_estudiante (
  id uuid primary key default gen_random_uuid(),
  profesor_id uuid not null references public.perfiles(id) on delete cascade,
  estudiante_id uuid not null references public.perfiles(id) on delete cascade,
  activo boolean not null default true,
  fecha_asignacion timestamptz not null default now(),
  unique (profesor_id, estudiante_id)
);

create table public.sesiones (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.perfiles(id) on delete cascade,
  habilidad_id uuid references public.habilidades(id) on delete cascade,
  inicio timestamptz not null default now(),
  fin timestamptz,
  total_ejercicios integer not null default 0,
  correctos integer not null default 0,
  tipo public.tipo_sesion not null default 'practica',
  digito smallint check (digito between 1 and 5),
  numero_ejercicio smallint check (numero_ejercicio between 1 and 3),
  nivel_id uuid references public.niveles(id) on delete cascade,
  constraint sesiones_habilidad_o_nivel check (habilidad_id is not null or nivel_id is not null)
);

create table public.intentos (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones(id) on delete cascade,
  estudiante_id uuid not null references public.perfiles(id) on delete cascade,
  habilidad_id uuid not null references public.habilidades(id) on delete cascade,
  dificultad smallint not null check (dificultad between 1 and 10), -- guarda el "digito" (1 a 5)
  enunciado text not null,
  respuesta_correcta text not null,
  respuesta_dada text,
  es_correcto boolean not null,
  segundos numeric(6,2) not null check (segundos >= 0),
  created_at timestamptz not null default now(),
  pasos jsonb
);

create table public.progreso_habilidad (
  estudiante_id uuid not null references public.perfiles(id) on delete cascade,
  habilidad_id uuid not null references public.habilidades(id) on delete cascade,
  porcentaje_dominio numeric(5,2) not null default 0 check (porcentaje_dominio between 0 and 100),
  desbloqueada boolean not null default false,
  total_intentos integer not null default 0,
  ultima_practica timestamptz,
  primary key (estudiante_id, habilidad_id)
);

create table public.progreso_ejercicio (
  estudiante_id uuid not null references public.perfiles(id) on delete cascade,
  habilidad_id uuid not null references public.habilidades(id) on delete cascade,
  digito smallint not null check (digito between 1 and 5),
  numero_ejercicio smallint not null check (numero_ejercicio between 1 and 3),
  desbloqueado boolean not null default false,
  aprobado boolean not null default false,
  mejor_puntaje numeric(5,2) not null default 0 check (mejor_puntaje between 0 and 100),
  intentos smallint not null default 0,
  ultima_practica timestamptz,
  primary key (estudiante_id, habilidad_id, digito, numero_ejercicio)
);

create table public.evaluaciones_habilidad (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.perfiles(id) on delete cascade,
  habilidad_id uuid not null references public.habilidades(id) on delete cascade,
  sesion_id uuid references public.sesiones(id) on delete set null,
  puntaje numeric(5,2) not null check (puntaje between 0 and 100),
  aprobado boolean not null,
  created_at timestamptz not null default now()
);

create table public.evaluaciones_nivel (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.perfiles(id) on delete cascade,
  nivel_id uuid not null references public.niveles(id) on delete cascade,
  sesion_id uuid references public.sesiones(id) on delete set null,
  puntaje numeric(5,2) not null check (puntaje between 0 and 100),
  aprobado boolean not null,
  created_at timestamptz not null default now()
);

create table public.autorizaciones_examen (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.perfiles(id) on delete cascade,
  habilidad_id uuid references public.habilidades(id) on delete cascade,
  estado public.estado_autorizacion_examen not null default 'solicitado',
  meet_url text check (meet_url is null or meet_url ~ '^https://'),
  autorizado_por uuid references public.perfiles(id) on delete set null,
  autorizado_at timestamptz,
  usado_at timestamptz,
  created_at timestamptz not null default now(),
  nivel_id uuid references public.niveles(id) on delete cascade,
  constraint autorizaciones_examen_habilidad_xor_nivel check ((habilidad_id is not null) <> (nivel_id is not null))
);

create table public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.perfiles(id) on delete cascade,
  estado public.estado_suscripcion not null default 'pendiente',
  fecha_inicio date not null,
  fecha_fin date not null,
  monto numeric(10,2) not null default 50.00,
  metodo_pago text,
  referencia_pago text,
  created_at timestamptz not null default now()
);

create table public.acciones_admin (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.perfiles(id) on delete set null,
  estudiante_id uuid references public.perfiles(id) on delete set null,
  tipo text not null,
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.revisiones_alerta (
  sesion_id uuid primary key references public.sesiones(id) on delete cascade,
  estado text not null check (estado in ('revisada', 'descartada')),
  nota text,
  admin_id uuid references public.perfiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Examen de ubicacion: se rinde una sola vez (unique en estudiante_id), al completar el perfil.
-- El puntaje decide hasta que nivel se desbloquea de entrada (ver aplicar_examen_ubicacion en 02).
create table public.evaluaciones_ubicacion (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null unique references public.perfiles(id) on delete cascade,
  modalidad public.modalidad_estudiante not null,
  puntaje smallint not null check (puntaje between 0 and 20),
  nivel_inicial smallint not null check (nivel_inicial between 1 and 4),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- indices
create index idx_perfiles_email on public.perfiles (lower(email));
create index idx_perfiles_nombre on public.perfiles (lower(nombre));
create index idx_habilidades_nivel on public.habilidades (nivel_id);
create index idx_ejercicios_habilidad on public.ejercicios (habilidad_id);
create index idx_profesor_estudiante_profesor on public.profesor_estudiante (profesor_id);
create index idx_profesor_estudiante_estudiante on public.profesor_estudiante (estudiante_id);
create index idx_sesiones_estudiante on public.sesiones (estudiante_id);
create index idx_sesiones_habilidad on public.sesiones (habilidad_id);
create index idx_sesiones_nivel on public.sesiones (nivel_id);
create index idx_intentos_sesion on public.intentos (sesion_id);
create index idx_intentos_habilidad on public.intentos (habilidad_id);
create index idx_intentos_estudiante_habilidad_fecha on public.intentos (estudiante_id, habilidad_id, created_at desc);
create index idx_progreso_habilidad_habilidad on public.progreso_habilidad (habilidad_id);
create index idx_progreso_ejercicio_estudiante on public.progreso_ejercicio (estudiante_id);
create index idx_progreso_ejercicio_habilidad on public.progreso_ejercicio (habilidad_id);
create index idx_evaluaciones_habilidad_estudiante on public.evaluaciones_habilidad (estudiante_id);
create index idx_evaluaciones_habilidad_habilidad on public.evaluaciones_habilidad (habilidad_id);
create index idx_evaluaciones_habilidad_sesion on public.evaluaciones_habilidad (sesion_id);
create index idx_evaluaciones_nivel_estudiante on public.evaluaciones_nivel (estudiante_id);
create index idx_evaluaciones_nivel_nivel on public.evaluaciones_nivel (nivel_id);
create index idx_evaluaciones_nivel_sesion on public.evaluaciones_nivel (sesion_id);
create index idx_autorizaciones_examen_habilidad on public.autorizaciones_examen (habilidad_id);
create index idx_autorizaciones_examen_nivel on public.autorizaciones_examen (nivel_id);
create index idx_autorizaciones_examen_autorizado_por on public.autorizaciones_examen (autorizado_por);
-- una sola solicitud abierta por estudiante y examen
create unique index uq_autorizacion_examen_habilidad_abierta on public.autorizaciones_examen (estudiante_id, habilidad_id)
  where habilidad_id is not null and estado in ('solicitado', 'autorizado');
create unique index uq_autorizacion_examen_nivel_abierta on public.autorizaciones_examen (estudiante_id, nivel_id)
  where nivel_id is not null and estado in ('solicitado', 'autorizado');
create index idx_suscripciones_estudiante on public.suscripciones (estudiante_id);
create index idx_acciones_admin_fecha on public.acciones_admin (created_at desc);
create index idx_acciones_admin_estudiante on public.acciones_admin (estudiante_id);
create index idx_acciones_admin_admin on public.acciones_admin (admin_id);
create index idx_revisiones_alerta_admin on public.revisiones_alerta (admin_id);
