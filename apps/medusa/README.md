# Nova Forza Commerce Backend

Backend de comercio de **Nova Forza** basado en **Medusa v2**.

## Rol en la arquitectura

- `apps/medusa`: dominio commerce puro
- `src/app/(public)/tienda`: storefront principal en Next.js
- `Supabase`: Postgres para Medusa mediante `DATABASE_URL` directa, no via SDK frontend

## Alcance de esta fase

- catalogo de productos
- categorias base
- precios
- inventario simple
- base para carrito y checkout posteriores

Queda fuera por ahora:

- pagos
- checkout completo
- promociones
- clientes complejos
- backoffice custom del gym

## Variables de entorno

Duplica `apps/medusa/.env.template` a `apps/medusa/.env` y completa:

```env
DATABASE_URL=postgresql://...
STORE_CORS=http://localhost:3000,http://localhost:3001
ADMIN_CORS=http://localhost:7001,http://localhost:9000
AUTH_CORS=http://localhost:7001,http://localhost:9000
JWT_SECRET=change-me
COOKIE_SECRET=change-me
```

`DATABASE_URL` debe ser una **conexion PostgreSQL directa de Supabase**, no el cliente JS ni un pooler transaccional pensado para sesiones cortas.

## Desarrollo local

```bash
npm --prefix apps/medusa install
npm run dev:medusa
```

Medusa queda disponible por defecto en `http://localhost:9000`.

## Seed Nova Forza

El script `seed:nova` crea una base minima alineada con la tienda actual:

- canal de venta `Nova Forza Storefront`
- region `Espana`
- stock location `Nova Forza Club`
- categorias `Suplementos`, `Accesorios`, `Merchandising`
- productos iniciales con metadata pensada para el storefront actual

Ejecucion:

```bash
npm run medusa:seed:nova
```

Al terminar, Medusa deja dos datos clave en logs:

- `region.id`
- `publishable api key`

Ambos se reutilizan en el storefront Next.js.

## Nota sobre Supabase

La recomendacion operativa para una sola persona es:

- usar **Supabase como proveedor PostgreSQL**
- dejar que **Medusa sea propietario de sus tablas commerce**
- evitar mezclar tablas custom del gym con tablas internas de Medusa sin una frontera clara

Si quieres compartir el mismo proyecto de Supabase con otras tablas propias, hazlo solo cuando tengas validada una separacion limpia en staging. Si no, usa otro proyecto de Supabase para Medusa y mantienes igualmente el stack alineado.
