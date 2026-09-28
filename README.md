# Mentes Triunfantes

Aplicación web para practicar cálculo mental **a mano** por niveles: el estudiante resuelve operaciones en vertical,
paso a paso, y un administrador autoriza y supervisa (por Google Meet) los exámenes.

Construida con **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind 4** y **Supabase** (Postgres + Auth).

> Este proyecto usa una versión de Next.js con cambios respecto a lo habitual (por ejemplo `proxy.ts` en lugar de
> `middleware.ts` y `params`/`searchParams` asíncronos). Antes de tocar código de Next lee `node_modules/next/dist/docs/`
> (ver `AGENTS.md`).

## Cómo funciona

| Concepto | Detalle |
|---|---|
| **Niveles** | Básico, Intermedio, Avanzado y Experto. Se pasa de nivel con una evaluación en vivo supervisada. |
| **Habilidades** | Cada nivel tiene varias (suma, resta, tabla, multiplicación, división, potencia, raíz, operaciones combinadas, números con signo, ecuaciones…). Se desbloquean en orden. |
| **Dígitos** | Cada habilidad tiene 5 grupos de dificultad (en suma y resta, el número de cifras). |
| **Ejercicios** | Cada dígito tiene 3 ejercicios de 10 preguntas. Se aprueban con **80 %** y se desbloquean en secuencia. |
| **Examen final** | 20 preguntas mezcladas de la habilidad, 80 % para aprobar. Solo se puede rendir con una autorización del administrador y un enlace de Meet. Desbloquea la siguiente habilidad. |
| **Evaluación de nivel** | Preguntas de todas las habilidades del nivel (unas 30 como máximo), también autorizada por el administrador. Abre el siguiente nivel. |

Los ejercicios **se generan en la aplicación** (`src/lib/ejercicios/`), no se guardan en la base de datos.

### Trabajo manual, no con calculadora

- **Operaciones en vertical** con una casilla por cifra: llevadas, prestadas (la cifra nueva arriba: 4 → 14), productos parciales,
  productos y restas de la división. Todo se **verifica**: el resultado solo cuenta si el procedimiento está bien.
- **Guías paso a paso** antes de practicar (`/guia/[habilidad]/[n]`).
- **Detección de sesiones sospechosas**: respuestas más rápidas de lo posible a mano o llevadas resueltas sin escribirlas
  (vista `vista_sesiones_sospechosas`). El administrador las revisa o descarta.
- **Exámenes supervisados en vivo** por Meet: la protección real; la aplicación por sí sola no puede impedir el uso de calculadora.

## Requisitos

- Node.js 20 o superior
- Un proyecto de [Supabase](https://supabase.com)

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y completa las dos variables
npm run dev                  # http://localhost:3000
```

Variables de entorno (`.env.local`):

| Variable | Dónde se obtiene |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (clave `anon` / publishable) |

### Base de datos

El esquema completo está en `supabase/schema/`. En un proyecto de Supabase **nuevo**, ejecuta los archivos en orden
desde el editor SQL:

1. `01_tipos_y_tablas.sql`: tipos, tablas e índices.
2. `02_funciones_y_triggers.sql`: reglas de negocio (calificar sesiones, desbloquear, validaciones).
3. `03_seguridad.sql`: seguridad por fila (RLS) y privilegios.
4. `04_vistas.sql`: vistas del panel y los reportes.
5. `05_datos_iniciales.sql`: los 4 niveles y sus habilidades.

`supabase/migrations/` guarda las migraciones incrementales aplicadas desde la 025 (cambios ya incluidos en `schema/`).
Si cambias la base de datos, agrega una migración nueva y actualiza el archivo correspondiente de `schema/`.

En Supabase → Authentication:

- Puedes desactivar **Confirm email** si no quieres verificar correos al registrarse.
- Activa **Leaked password protection** (Auth → Passwords).

### Crear el primer administrador

Todos los registros nuevos son **estudiantes** (por seguridad, el rol no se puede elegir al registrarse). Regístrate en
`/login` y luego, en el editor SQL de Supabase:

```sql
update public.perfiles set rol = 'admin' where email = 'tu-correo@ejemplo.com';
```

## Panel de administración (`/admin`)

- **Resumen**: cifras del día y quién necesita atención.
- **Estudiantes**: buscador por nombre o correo, filtros (nivel, estado, actividad, alertas, examen pendiente), orden y
  paginación; **ficha** de cada estudiante con su progreso, exámenes, sesiones, cambio de estado y apertura de habilidades.
- **Profesores**: promueve una cuenta ya registrada a profesor (escribiendo su correo) y le asigna estudiantes. Un
  profesor entra con su propia cuenta a `/profesor` y ve, en modo solo lectura, el progreso de sus estudiantes asignados
  (el resto de la base de datos no es visible para él: lo hace cumplir la seguridad por fila).
- **Exámenes**: solicitudes; se autorizan pegando el enlace de Meet.
- **Alertas**: sesiones sospechosas, para marcar como revisadas o descartadas con una nota.
- **Reportes**: rendimiento por habilidad, actividad de 30 días, exportación a Excel (CSV) e informe imprimible por estudiante.
- **Registro**: quién hizo qué en el panel.

## Estructura del código

```
src/
  app/
    (app)/                 páginas con sesión iniciada
      dashboard/           panel del estudiante
      practicar/           mapa de la habilidad, práctica y examen final
      nivel/[orden]/       evaluación de nivel
      guia/                guías paso a paso
      admin/               panel de administración
    login/
  components/
    vertical-*.tsx         operaciones en vertical (suma/resta, multiplicación, división, potencia, raíz)
    entero-*.tsx           números con signo por etapas
    ecuacion-pasos.tsx     ecuaciones por operaciones inversas
    combinadas-paso.tsx    operaciones combinadas (elegir la operación y su resultado)
    pregunta.tsx           elige el componente según el ejercicio
    admin/                 piezas del panel
  lib/
    ejercicios/            generadores de ejercicios por habilidad y dígito
    guias/                 contenido de las guías
    supabase/              clientes y tipos de la base de datos
  proxy.ts                 protege las rutas (redirige a /login)
supabase/
  schema/                  esquema completo
  migrations/              migraciones incrementales
```

Para **agregar una habilidad nueva**: valor en el enum `nombre_habilidad` + fila en `habilidades` + filas de progreso
para los estudiantes existentes (ver la migración 029 como ejemplo), un generador en `lib/ejercicios/generador.ts`
(y su componente en `components/pregunta.tsx` si necesita uno propio), sus guías en `lib/guias/catalogo.ts`, el tiempo
mínimo en `umbral_segundos_intento` y el tipo en `lib/supabase/database.types.ts`.

## Comandos

```bash
npm run dev      # desarrollo
npm run build    # compilación de producción
npm run lint     # ESLint
npx tsc --noEmit # comprobación de tipos
```

## Seguridad: qué se controla y qué no

- Cada tabla tiene seguridad por fila: el estudiante ve lo suyo, el profesor lo de sus estudiantes y el administrador todo.
- Un estudiante no puede editar su progreso, abrir ejercicios bloqueados, llenar sesiones ajenas ni volverse administrador;
  las notas las calcula la base de datos al cerrar una sesión completa.
- **Limitación conocida:** los ejercicios y su corrección se calculan en el navegador. Un estudiante muy técnico podría
  falsificar respuestas una por una. Los exámenes supervisados en vivo son la protección real. Cerrarla del todo exigiría
  generar y corregir los ejercicios en el servidor.

## Pendiente

- Contenido de **Atajos** y **Razonamiento** (sin él no se puede solicitar la evaluación del nivel Experto).
- Pantalla de suscripciones/pagos; la base de datos ya la soporta (tabla `suscripciones`, vista `vista_ingresos`).
- Pruebas automáticas.
