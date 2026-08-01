# AGENTS.md

Guía operativa para agentes que trabajen en `C:\digitalbitsolutions\gym\apps\mobile`.

## Contexto

Esta carpeta contiene la app mobile de Nova Forza dentro del mismo repo principal.

No es un experimento aislado ni una demo separada. Esta app forma parte del producto y debe
mantener coherencia con:

- web pública en `src/app/(public)`
- dashboard interno en `src/app/(admin)/dashboard`
- backend principal en Supabase
- backend web/API en Next.js

La app mobile vive dentro del monorepo para compartir contratos, dominio y flujo de trabajo,
pero no debe intentar compartir componentes visuales con la web.

## Objetivo actual

Mantener una app mobile:

- implementable de forma realista con Expo
- coherente con el Figma mobile
- segura para auth y operaciones staff
- rápida de iterar con mocks primero
- desacoplada del backend final mientras el dominio `miembros/rutinas` madura

## Stack oficial de mobile

- `Expo` managed workflow
- `Expo Router`
- `React Native`
- `TypeScript`
- `NativeWind`
- `React Query`
- `React Hook Form`
- `Zod`
- `Supabase JS`
- `SecureStore`
- `FlashList`
- `Reanimated`

## Reglas de arquitectura

- Usar una sola app con dos roles:
  - `member`
  - `staff`
- Separar shells por rol en rutas:
  - `app/(auth)`
  - `app/(member)`
  - `app/(staff)`
  - `app/modal`
- No mezclar UX de socio y staff en una sola superficie ambigua.
- La navegación por rol debe estar protegida en cliente y reforzada desde backend.
- Las operaciones sensibles de staff no deben escribirse directo desde el cliente contra tablas críticas.

## Límites actuales del dominio

El dominio real de `miembros / planes / rutinas` todavía no existe como módulo persistente final.

Por eso, en esta fase:

- `auth` es real con Supabase
- los contratos mobile son reales
- los endpoints mobile existen
- muchos estados de `miembro`, `plan`, `rutina` e `historial` pueden seguir mockeados

Esto es intencional. No "inventes" tablas complejas ni admin flows completos sin una tarea explícita.

## Mock-first

La app mobile trabaja con enfoque `mocks primero`.

Reglas:

- Antes de abrir backend nuevo, priorizar pantallas funcionales con fixtures coherentes.
- Los mocks viven en la capa mobile/backend del repo, no hardcodeados caóticamente en componentes.
- Mantener escenarios reutilizables para:
  - socio base
  - socio sin ficha
  - socio sin rutina
  - socio sin historial
  - staff base
  - staff sin miembros
  - staff con miembro sin rutina

El selector mock del cliente existe para revisar la UX sin depender del estado real de la cuenta.

## Auth y seguridad

- Auth mobile con `Supabase Auth`
- Persistencia de sesión con `expo-secure-store`
- Nunca usar `SUPABASE_SECRET_KEY` en cliente
- El cliente mobile solo debe conocer:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_API_BASE_URL`
- El rol `staff` se resuelve desde `public.user_roles` con el valor `trainer`
- No asumir que una cuenta autenticada equivale a `member profile`

## Variables de entorno

La app mobile lee sus variables desde `app.config.ts`.

Mínimas requeridas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_BASE_URL`

Para emulador Android, el backend local normalmente debe apuntar a:

- `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000`

Si se usa dispositivo físico, cambiar por la IP local del host.

## Design system mobile

No usar un framework de componentes pesado.

Preferencias:

- primitives propias en `src/components/ui`
- tipografía display fuerte
- contraste alto
- bordes rectos
- look sobrio, atlético y premium

Tokens base actuales:

- `#FAFAF5`
- `#FFFFFF`
- `#F4F4EF`
- `#E3E3DE`
- `#1A1C19`
- `#5D3F3C`
- `#AE0011`
- `#D71920`
- `#00588F`

## UI rules

- Mantener fidelidad razonable al Figma mobile
- Evitar componentes "enterprise" o kits visuales genéricos
- No introducir rounded excesivo ni estilos blandos
- No convertir la app en una landing o una red social fitness
- Siempre contemplar:
  - loading
  - empty
  - error
  - unauthorized
  - session expired

## Integración con el repo

- Los contratos compartidos viven en `packages/mobile-contracts`
- Los endpoints mobile viven en `src/app/api/mobile`
- La lógica mock y auth mobile vive en `src/lib/mobile`

No dupliques contratos locales si ya existe una forma compartida en `packages/mobile-contracts`.

## Seeds y usuarios demo

Hay documentación para usuarios demo mobile en:

- `docs/mobile-demo-seeds.md`
- `supabase/sql/mobile-demo-users.sql`

Reglas:

- El SQL de demo no crea passwords en `auth.users`
- La creación de usuarios de Auth debe pasar por Supabase/Auth tooling o por Antigravity
- `entrenador@novaforza.com` debe tener el rol persistente `trainer` para probar shell `staff`

## Tests mobile

La app mobile tiene una suite propia en `apps/mobile` con `Jest + jest-expo + React Native Testing Library`.

Reglas:

- Los tests de UI y providers mobile viven en `apps/mobile`.
- Los route handlers y la capa server/mobile API se testean desde la raíz con `Vitest`.
- No mezclar pantallas React Native dentro de la suite raíz.
- Preferir aserciones semánticas y de comportamiento visible.
- Usar snapshots solo pequeños y estables en primitives.
- Reutilizar factories y helpers de `src/test` antes de duplicar setup.

Comandos principales:

- `npm --prefix apps/mobile run test`
- `npm --prefix apps/mobile run test:coverage`
- `npm run test -- src/app/api/mobile`
- `npm run test:mobile`
- `npm run test:mobile:live`
- `npm run test:mobile:all`

Suite live local:

- `npm run test:mobile:live` arranca Supabase local, hace reset, crea usuarios demo de Auth y siembra datos reales del vertical mobile.
- Esa suite depende de Docker + Supabase CLI locales.
- No usa staging manual ni credenciales del `.env.local` de desarrollo.
- Los datos demo por defecto incluyen `entrenador`, `usuario1`, `usuario2` y `usuario3`.

Cuando añadas un test nuevo:

- Si es UI mobile, colócalo cerca de la pantalla/componente o en `src/lib`, `src/hooks`, `src/providers`.
- Si toca backend mobile, añádelo en la raíz junto al route handler o al módulo server-side.
- Si necesita datos comunes, añádelos a `apps/mobile/src/test/factories.ts` o a helpers compartidos.
- Evita crear mocks ad hoc gigantes dentro de cada test.

## Lo que no se debe hacer

- No meter `Tamagui`, `NativeBase`, `GlueStack` o kits pesados sin una razón muy fuerte
- No compartir componentes visuales web/mobile "a la fuerza"
- No usar secretos de servidor en la app
- No abrir escrituras staff directas a Supabase sin capa backend
- No inventar dominio final de rutinas/miembros sin issue explícita
- No asumir que el estado mock ya representa persistencia real

## Checklist antes de cerrar trabajo en mobile

1. Ejecutar `npm --prefix apps/mobile run typecheck`
2. Ejecutar `npm run typecheck` desde la raíz si se tocaron contratos o endpoints
3. Ejecutar tests relevantes si se toca `src/lib/mobile`
4. Confirmar que no se rompió el arranque de Expo
5. Confirmar que las variables requeridas están claras y documentadas
