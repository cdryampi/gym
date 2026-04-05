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

## Limites del core actual

En esta fase el alcance real ya incluye:

- home publica y paginas legales
- formulario de contacto y leads
- login
- dashboard con resumen, leads, info, web, CMS ligero y tienda
- tienda publica y detalle de producto
- carrito y checkout pickup
- registro y mi-cuenta
- Supabase para auth, settings, leads y dominio propio
- Medusa para catalogo operativo y pedidos pickup vinculados

No se deben introducir aun:

- reservas completas
- logica de miembros compleja
- rutinas o backoffice de miembros completo
- ecommerce completo fuera del flujo de tienda y pickup ya acotado
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
- `Medusa v2`
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
- Si tocas `src/lib/supabase/queries.ts`, los nuevos tests van en `src/lib/supabase/__tests__/`.
- Si tocas logica de dominio que consulta Supabase, el test se queda junto al modulo de dominio.

## Debug y logs locales

- No crees ficheros de debug sueltos en la raiz ni dentro de `apps/medusa` u otras carpetas de codigo.
- Usa `debug/README.md` como referencia rapida antes de guardar artefactos temporales.
- Guarda salidas de depuracion funcional en `debug/medusa/` o en una subcarpeta equivalente dentro de `debug/`.
- Guarda sys logs, volcados de consola o logs de procesos en `debug/sys-logs/`.
- No enlaces esos artefactos desde codigo de produccion.
- Si el artefacto era solo para una sesion puntual, eliminalo al terminar.

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

Para la capa de tienda usamos **Medusa v2**, pero el proyecto **no usa el admin nativo de Medusa**
como panel principal.

La regla actual es:

- el dashboard oficial es `src/app/(admin)/dashboard`
- Medusa es la fuente operativa de verdad para categorias y productos
- Supabase sigue siendo backend principal del gym y capa de soporte/enlace durante la migracion

### Runtime y base de datos

- El servidor vive en `apps/medusa` y expone API en `http://localhost:9000`.
- Arranca Medusa con `npm run dev:medusa` desde la raiz.
- Medusa comparte PostgreSQL en Supabase.
- **Importante**: Medusa debe usar conexion directa `5432` en `DATABASE_URL`, no el pooler `6543`.

### Variables de entorno relevantes

Storefront:

- `COMMERCE_PROVIDER=medusa`
- `COMMERCE_CURRENCY_CODE`
- `COMMERCE_LOCALE`
- `NEXT_PUBLIC_COMMERCE_CURRENCY_CODE`
- `NEXT_PUBLIC_COMMERCE_LOCALE`
- `MEDUSA_BACKEND_URL`
- `MEDUSA_PUBLISHABLE_KEY`
- `MEDUSA_REGION_ID`
- `MEDUSA_REGION_NAME`
- `MEDUSA_COUNTRY_CODE`

Dashboard tienda:

- `STORE_ADMIN_PROVIDER=medusa`
- `MEDUSA_ADMIN_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Configuracion recomendada en esta fase:

- storefront con `COMMERCE_PROVIDER=medusa`
- dashboard tienda con `STORE_ADMIN_PROVIDER=medusa`
- moneda/region definidas por entorno, no hardcodeadas en codigo

Defaults actuales del proyecto:

- `COMMERCE_CURRENCY_CODE=PEN`
- `COMMERCE_LOCALE=es-PE`
- `MEDUSA_REGION_NAME=Peru`
- `MEDUSA_COUNTRY_CODE=PE`

### Integracion real con el dashboard

La gestion de tienda del panel propio pasa por una capa repositorio:

- `src/lib/data/store-admin.ts`
- `src/lib/data/store-admin/repository.ts`
- `src/lib/data/store-admin/medusa-repository.ts`
- `src/app/(admin)/dashboard/tienda/actions.ts`

Reglas:

- el dashboard lee y escribe catalogo en Medusa Admin API
- la persistencia de IDs puente en Supabase es obligatoria para considerar valida la operacion
- no meter fallback silencioso en admin cuando Medusa falle
- el dashboard propio sigue siendo la unica UI de gestion del proyecto
- si falta `MEDUSA_ADMIN_API_KEY` o `SUPABASE_SERVICE_ROLE_KEY`, la escritura debe bloquearse
- no escribir catalogo operativo directamente en tablas legacy de Supabase

### Mapping y metadata

El storefront mantiene su propio DTO UI, por lo que el adapter de Medusa usa `metadata` para
campos no nativos:

- `pickup_*`
- `highlights`
- `benefits`
- `usage_steps`
- `specifications`
- `cta_label`
- `order`
- `featured`
- `stock_status`
- `discount_label`
- `compare_price`
- `storefront_images`

Si tocas ese mapping, revisa tambien:

- `src/lib/commerce/medusa.ts`
- `src/lib/data/store.ts`
- `src/lib/data/store-admin/medusa-repository.ts`

### Lo peculiar de este proyecto

Esta integracion no sigue el flujo habitual de un proyecto Medusa "puro". Las reglas importantes son:

- no se usa el admin nativo de Medusa como herramienta de negocio
- no se usa Supabase como proveedor runtime alternativo del catalogo
- no se usan datos locales como fallback de tienda en runtime
- Medusa es el catalogo operativo
- Supabase es la base principal del proyecto y la capa obligatoria para IDs puente
- los datos locales solo se admiten para seed, fixtures o tests

En otras palabras:

- `src/app/(admin)/dashboard` manda la operacion
- `src/lib/data/store-admin/medusa-repository.ts` manda el CRUD commerce
- `src/lib/commerce/medusa.ts` manda la lectura de storefront
- `products` y `store_categories` en Supabase no son fuente de verdad del runtime

## Workflow actual del proyecto

Este es el flujo correcto despues del cambio de integracion:

1. El equipo gestiona la tienda desde el **dashboard propio**, no desde el admin de Medusa.
2. El dashboard usa `StoreAdminRepository` para resolver proveedor.
3. Con `STORE_ADMIN_PROVIDER=medusa`, el CRUD de categorias y productos va a Medusa Admin API.
4. El adapter actualiza en Supabase solo los IDs de enlace:
   - `store_categories.medusa_category_id`
   - `products.medusa_product_id`
5. El storefront `/tienda` y `/tienda/[slug]` lee catalogo desde Medusa con `COMMERCE_PROVIDER=medusa`.
6. Si Medusa falla, se muestra error explicito; no se cae a Supabase legacy ni a mock local.
7. Los datos locales del catalogo quedan reservados para seed/tests, no para servir la tienda.
8. Supabase sigue siendo backend principal para:
   - auth
   - leads
   - settings
   - dominio no-commerce
   - persistencia de IDs puente y soporte de sync/migracion

### Workflow de cambios en tienda

Si una tarea toca tienda, este es el orden mental correcto:

1. Decidir si el cambio es de storefront, dashboard propio o backend Medusa.
2. Mantener la frontera: UI en Next.js, catalogo en Medusa, soporte en Supabase.
3. Si el cambio escribe catalogo:
   - escribir en Medusa
   - persistir IDs/enlaces necesarios en Supabase
   - no introducir escrituras operativas paralelas en tablas legacy
4. Si el cambio lee catalogo:
   - leer desde Medusa
   - no leer `products` o `store_categories` como runtime de la tienda
5. Si el cambio afecta mapping o payloads:
   - revisar metadata custom
   - revisar sales channel
   - revisar region/currency por entorno
6. Si el cambio afecta bootstrap o datos iniciales:
   - tocar seed/sync/fixtures
   - no reintroducir fallback runtime local

### Workflow de sincronizacion

Si existe catalogo legacy en Supabase, el flujo correcto es:

1. Ejecutar sync inicial `Supabase -> Medusa`
2. Verificar que Medusa recibe categorias y productos
3. Persistir IDs puente en Supabase
4. Cambiar lectura admin a `STORE_ADMIN_PROVIDER=medusa`
5. Cambiar escritura operativa a Medusa
6. Mantener Supabase solo como soporte/reporting o enlace, no como fuente de verdad del catalogo

Comando:

```bash
npm run sync:store:medusa
```

### Issues abiertas y contexto obligatorio

Antes de tocar la integracion de tienda, recuerda siempre:

- no se trabaja con el admin/dashboard nativo de Medusa como panel del negocio
- el unico panel operativo del proyecto es `src/app/(admin)/dashboard`
- Supabase sigue siendo la base de datos principal del proyecto
- Medusa comparte ese PostgreSQL de Supabase y opera la capa commerce desde ahi
- cualquier cambio de catalogo debe contemplar tambien la persistencia de enlaces en Supabase:
  - `store_categories.medusa_category_id`
  - `products.medusa_product_id`
- no meter dependencias nuevas que empujen al equipo a usar el admin de Medusa
- no olvidar que auth, leads, settings y el resto del dominio gym siguen en Supabase
- no asumir EUR/Espana ni hardcodear moneda/region; usar variables de entorno
- no volver a meter `mock`, `supabase` o `auto` como proveedores runtime de commerce
- si cambias sync, CRUD o mapping de tienda, revisa tambien el impacto en:
  - `src/lib/data/store-admin/medusa-repository.ts`
  - `src/lib/commerce/medusa.ts`
  - `src/lib/commerce/currency.ts`
  - `src/lib/supabase/queries.ts`
  - `supabase/migrations/`

Documento de referencia rapida:

- `docs/medusa-dashboard-issues.md`

Ese script:

- lee `store_categories` y `products` desde Supabase con `SUPABASE_SERVICE_ROLE_KEY`
- hace upsert en Medusa por `slug` / `handle`
- escribe de vuelta solo `medusa_category_id` y `medusa_product_id`

### Regla de oro para agentes

Si una tarea toca tienda, piensa siempre en esta frontera:

- UI dashboard en Next.js
- catalogo operativo en Medusa
- datos de soporte en Supabase

No vuelvas a mezclar el catalogo operativo del dashboard con queries directas a `products` o
`store_categories` salvo que la tarea consista precisamente en migracion, soporte o retirada del fallback.

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
