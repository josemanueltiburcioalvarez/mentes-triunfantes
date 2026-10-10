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
| **Modalidad** | Primaria o Secundaria, deducida del grado escolar que el estudiante elige al completar su perfil. Cada una tiene su propio currículo (mismas habilidades, agrupadas distinto en niveles) y su propio examen de ubicación de 20 preguntas (10 fáciles de dígitos 1-2, 5 intermedias de 2-3 y 5 avanzadas de 4-5, de todas las habilidades básicas, combinadas y ecuaciones; solo el resultado, con «No sé») que decide con qué nivel arranca. |
| **Niveles** | Básico, Intermedio, Avanzado y Experto, en las dos modalidades. Se pasa de nivel con una evaluación en vivo supervisada. |
| **Habilidades** | Cada nivel tiene varias (suma, resta, tabla, multiplicación, división, potencia, raíz, operaciones combinadas, números con signo, ecuaciones, sistemas de ecuaciones…). Se desbloquean en orden. |
| **Dígitos** | Cada habilidad tiene 5 grupos de dificultad (en suma y resta, el número de cifras). |
| **Ejercicios** | Cada dígito tiene 3 ejercicios de 10 preguntas. Se aprueban con **80 %** y se desbloquean en secuencia. |
| **Examen final** | 20 preguntas mezcladas de la habilidad (pocas del dígito 1, más de los dígitos 2 a 4), 80 % para aprobar. Se responde escribiendo solo el resultado (sin los casilleros de la práctica) y se puede pasar una pregunta con «No sé» (cuenta como incorrecta). Solo se puede rendir con una autorización del administrador y un enlace de Meet. Desbloquea la siguiente habilidad. |
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
- **Contenido**: ejercicios de **Atajos** y **Razonamiento** que el administrador escribe a mano (enunciado, respuesta y una
  explicación opcional). Se mezclan al azar con los que la aplicación genera sola; no hace falta llenar nada para que la
  habilidad funcione, es solo para enriquecerla con problemas curados.
- **Exámenes**: solicitudes; se autorizan pegando el enlace de Meet.
- **Alertas**: sesiones sospechosas, para marcar como revisadas o descartadas con una nota.
- **Suscripciones**: no hay pasarela de pago. El estudiante ve los planes (1 mes S/ 50; 3, 6 y 12 meses con descuento, ver
  `src/lib/planes.ts`), paga por Yape/Plin y manda el comprobante por WhatsApp; el administrador registra el pago aquí y
  recién entonces se activa. El estado (activa, vencida, cancelada, sin pagos) se calcula por fecha en **hora de Lima**,
  sin necesidad de un cron, y el día de vencimiento cuenta completo. **Sin un plan activo** (nunca pagó, venció o se
  canceló) el estudiante ve el panel con todos los niveles, pero la práctica, las guías, el examen de cada habilidad y la
  evaluación de nivel muestran la pantalla de precios en lugar del contenido. Admin y profesor no necesitan plan.
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
      perfil/              el estudiante corrige su nombre, edad y año escolar
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

- **Modalidad primaria/secundaria**: completa — al entrar por primera vez, el estudiante completa su perfil (nombre,
  edad, año escolar, de ahí se deduce la modalidad) y rinde el examen de ubicación de 20 preguntas, que desbloquea
  su punto de partida según el puntaje. Las dos modalidades tienen sus 4 niveles definidos (Secundaria: Avanzado es
  Ecuaciones, Experto es Sistemas de ecuaciones + Atajos + Razonamiento). El panel de admin muestra y filtra por
  modalidad (lista de estudiantes, ficha y reportes), y el estudiante puede corregir su propio nombre, edad y año
  escolar después desde "Mi perfil" (`/perfil`).
  - Pendiente menor: la ficha de un estudiante (`ficha-estudiante.tsx`) agrupa el progreso por **nombre** de nivel,
    así que "Avanzado"/"Experto" de Primaria y de Secundaria aparecen mezclados bajo el mismo encabezado (no es un
    error de datos — el avance y los reportes ya están bien separados por modalidad — solo una mejora visual pendiente).
- **Panel del estudiante tipo juego**: ya tiene el perfil con anillos, el fondo con luces, el **mapa** por niveles (nodos por
  habilidad, portal de evaluación, selector Mapa/Lista) y una tarjeta de **racha de días** (hora de Lima) y **logros**
  (17 medallas calculadas con el progreso existente, sin tablas nuevas; detalle en `/logros`). Al desbloquear un logro sale un aviso
  «¡Nuevo logro!» una sola vez (tabla `logros_vistos`). Falta, si se quiere: arte ilustrado de fondo.
- Pruebas automáticas.
- Activar **Leaked password protection** en Supabase (Auth → Passwords): queda anotado en la puesta en marcha, pero
  hay que activarlo a mano en cada proyecto nuevo.
