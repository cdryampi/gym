# Nova Forza

Base de producto para el gimnasio **Nova Forza** con dos superficies activas:

- web publica en `src/app/(public)`
- backoffice interno en `src/app/(admin)/dashboard`

La capa commerce entra ahora en una migracion progresiva hacia **Medusa + Next.js**, manteniendo **Supabase** como infraestructura PostgreSQL cuando encaja.

## Arquitectura actual

- `Next.js 16` y `React 19` para storefront y panel interno
- `Supabase` para auth, leads, ajustes globales y resto de dominio propio
- `apps/medusa` como backend de comercio separado

Mas detalle en [docs/commerce-medusa-migration.md](/C:/digitalbitsolutions/gym/docs/commerce-medusa-migration.md).

## Frontera de responsabilidades

### Next.js + Supabase propio

- marketing
- contenido
- login
- dashboard
- leads
- ajustes del sitio
- modulos del gimnasio no-commerce

### Medusa

- productos
- categorias
- precios
- inventario base
- futura base para carrito y checkout

## Desarrollo local

### Storefront y panel

```bash
npm install
npm run dev
```

### Backend commerce

```bash
npm --prefix apps/medusa install
npm run dev:medusa
```

## Variables de entorno

Completa `.env.local` a partir de `.env.example`.

### Propias del proyecto actual

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ALLOWED_EMAILS`
- `ADMIN_USER`
- `ADMIN_PASSWORD`

### Nuevas para commerce

- `COMMERCE_PROVIDER=auto|medusa|supabase|mock`
- `MEDUSA_BACKEND_URL`
- `MEDUSA_PUBLISHABLE_KEY`
- `MEDUSA_REGION_ID`
- `MEDUSA_COUNTRY_CODE`
- `MEDUSA_DEFAULT_CURRENCY_CODE`

`COMMERCE_PROVIDER=auto` usa este orden:

1. Medusa
2. Supabase `products` legacy
3. mock local

## Supabase y Medusa

Medusa debe conectarse a PostgreSQL por `DATABASE_URL` directa. No usa el cliente JS de Supabase para resolver comercio.

La recomendacion operativa mas segura es:

- usar **Supabase Postgres** para Medusa
- mantener **Medusa** como propietario de sus tablas
- evitar mezclar tablas internas de Medusa con el dominio del gym sin una frontera clara

## Seeds de comercio

La app Medusa incluye un seed inicial de Nova Forza:

```bash
npm run medusa:seed:nova
```

Ese seed deja la base para catalogo, categorias, stock simple y la publishable key del storefront.

## QA

Antes de cerrar cambios relevantes:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
