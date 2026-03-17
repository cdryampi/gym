# AGENTS.md

Guia operativa para agentes que trabajen en `C:\digitalbitsolutions\gym`.

## Contexto del proyecto

Este repositorio ya no es una landing generica ni un experimento de agencia.
Ahora es la base de producto para un gimnasio local con dos superficies activas:

- web publica comercial en `src/app/(public)`
- backoffice propio en `src/app/(admin)/dashboard`

La base se orienta a crecer mas adelante sin duplicar sistemas:

- sitio publico
- leads
- planes
- horarios
- productos
- reservas
- miembros
- rutinas
- pedidos pickup
- ajustes/CMS

Por ahora esos modulos futuros solo deben estar previstos o documentados, no implementados salvo que una tarea lo pida claramente.

## Objetivo actual

Mantener una base limpia, minima y coherente para:

- web publica del gimnasio
- mini backoffice propio
- backend principal en Supabase
- futura app movil reutilizando el mismo backend

## Limites del MVP actual

En esta fase el alcance real es:

- home publica
- formulario de contacto
- login
- dashboard con resumen, leads y ajustes globales
- esquema base de Supabase para `site_settings` y `leads`

No se deben introducir aun:

- pagos online
- reservas completas
- ecommerce completo
- logica de miembros compleja
- automatizaciones AI/LLM
- i18n
- integraciones pesadas por adelantado

## Filosofia de trabajo

Este proyecto se piensa para un solo desarrollador que quiere iterar rapido sin perder control.

Prioridades:

- soluciones simples y razonables
- buena DX
- cambios pequenos pero solidos
- codigo facil de revisar por Antigravity
- separar claramente web publica, admin y dominio de negocio
- no crear abstracciones sin uso real
- no agregar dependencias pesadas sin justificarlo
- no mantener codigo muerto "por si acaso"

## Stack y herramientas

- `Next.js 16` con App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- `Supabase`
- `react-hook-form` + `zod`
- `Vitest`
- `ESLint`

## Estructura esperada

```txt
src/
  app/
    (public)/          web publica
    (auth)/login/      acceso al panel
    (admin)/dashboard/ backoffice
    api/               endpoints
  components/
    marketing/
    auth/
    admin/
    ui/
  lib/
    data/
    supabase/
    validators/
```

## Reglas para futuras tareas

- No metas complejidad innecesaria.
- No crees abstracciones sin un segundo uso real.
- No reintroduzcas i18n ni AI si no forman parte del objetivo inmediato.
- No agregues dashboards, seeds o demos que no aporten al vertical gym.
- Si una tarea toca dominio, piensa primero si pertenece a web publica, admin o backend.
- Reutiliza `components/ui` antes de crear primitives nuevas.
- Manten `strict` TypeScript limpio.
- Prefiere server components por defecto y `"use client"` solo cuando haga falta.

## Supabase

Supabase es el backend principal previsto para este proyecto.

Variables esperadas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Opcionales para acceso local:

- `ADMIN_USER`
- `ADMIN_PASSWORD`

Si cambias esquema o queries, revisa tambien:

- `src/lib/supabase/database.types.ts`
- `src/lib/supabase/queries.ts`
- `supabase/migrations/`
- `supabase/seed.sql`

## Medusa E-commerce

Para manejar la capa de tienda de manera aislada, utilizamos **Medusa v2**.

- **Ubicación**: El servidor backend vive en `apps/medusa` y provee la API en el puerto `9000`.
- **Conexión a Supabase**: Medusa comparte la base de datos de Supabase. **IMPORTANTE**: Medusa requiere usar el puerto directo `5432` en el `DATABASE_URL` (no uses el puerto del pooler `6543` transaccional).
- **Ejecución Local**: Arranca el servidor con `npm run dev:medusa` desde la raíz.
- **Seeding de Productos**: Ingresa a `apps/medusa` y ejecuta `npm run seed:nova` para generar el perfil de envío, la región de venta y los productos iniciales de manera idempotente. 
- **Integración Front-end**: En `.env.local` de Next.js debes configurar:
  - `COMMERCE_PROVIDER=medusa`
  - `MEDUSA_BACKEND_URL=http://localhost:9000`
  - `MEDUSA_PUBLISHABLE_KEY=pk_...` (Extraída tras ejecutar el seed)
  - `MEDUSA_REGION_ID=reg_...`
- **Reglas del Cliente**: La lógica de fetching `src/lib/commerce/medusa.ts` no debe enviar parámetros deprecados como `currency_code` o `country_code` (Medusa v2 usa el contexto de `region_id`).

## QA y validacion

Antigravity se usa como capa de QA y validacion.
Por eso cada cambio debe quedar:

- ordenado
- verificable
- facil de revisar
- sin residuos del proyecto anterior

## Checklist antes de cerrar trabajo

1. Ejecutar `npm run lint`.
2. Ejecutar `npm run typecheck`.
3. Ejecutar `npm run test`.
4. Ejecutar `npm run build` si se tocaron rutas, auth, metadata o Supabase.
5. Confirmar que no quedan rutas viejas, branding heredado o dependencias muertas.
