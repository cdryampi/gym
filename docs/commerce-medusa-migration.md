# Migracion Commerce a Medusa

## Objetivo de esta fase

El storefront de Nova Forza mantiene su UI y sus rutas actuales, pero la fuente principal del
catalogo pasa a ser Medusa Store API.

Esta fase cubre:

- `/tienda`
- `/tienda/[slug]`
- capa de datos del storefront
- mapeo de productos Medusa hacia el contrato UI del proyecto
- tests de frontend y data layer

Fuera de alcance por ahora:

- carrito
- checkout
- pagos
- customers
- fulfillment

## Estructura actual de la integracion

### Capa Medusa

- `src/lib/medusa/config.ts`
- `src/lib/medusa/sdk.ts`
- `src/lib/medusa/products.ts`

Responsabilidades:

- leer variables de entorno
- inicializar `@medusajs/js-sdk`
- listar productos desde Store API
- resolver un producto por `handle`

### Capa commerce del storefront

- `src/lib/commerce/catalog.ts`
- `src/lib/commerce/medusa.ts`
- `src/lib/commerce/mock.ts`
- `src/lib/commerce/supabase.ts`

Responsabilidades:

- decidir la fuente activa (`medusa`, `supabase`, `mock`)
- mapear el shape de Medusa al contrato `Product` del frontend
- exponer helpers para catalogo y detalle sin contaminar la UI con objetos crudos

## Variables de entorno del storefront

Preferidas para el frontend:

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

Variables complementarias soportadas en servidor:

- `MEDUSA_BACKEND_URL`
- `MEDUSA_PUBLISHABLE_KEY`
- `MEDUSA_REGION_ID`
- `MEDUSA_COUNTRY_CODE`
- `MEDUSA_DEFAULT_CURRENCY_CODE`
- `COMMERCE_PROVIDER=auto|medusa|supabase|mock`

Recomendacion para esta fase:

```env
COMMERCE_PROVIDER=medusa
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxxx
MEDUSA_REGION_ID=reg_xxxxxxxxx
MEDUSA_COUNTRY_CODE=es
MEDUSA_DEFAULT_CURRENCY_CODE=eur
```

## Requisito de CORS en Medusa

El backend Medusa debe permitir el storefront de Next.js en `storeCors`.

Ejemplo local:

- `http://localhost:3000`

Sin esto, el SDK del storefront no podra consumir Store API correctamente.

## Como se resuelve el catalogo

1. `/tienda` usa `getCommerceCatalog()`.
2. Si Medusa esta disponible, la fuente activa es Medusa.
3. Si Medusa falla, la capa commerce puede caer a Supabase legacy o mock con warning visible.
4. Los filtros del storefront siguen siendo pragmaticos y se aplican sobre el contrato UI del
   proyecto, no sobre respuestas crudas del backend.

## Como se resuelve el detalle

1. `/tienda/[slug]` usa `getCommerceProductBySlug(slug)`.
2. Para Medusa, el slug del storefront corresponde al `handle` del producto.
3. La ficha puede mostrar:
   - imagenes
   - precio
   - descripcion
   - metadata de tienda
   - opciones / variantes en modo lectura

## Tests

Los tests no dependen del backend real.

Enfoque:

- mock de la capa `src/lib/medusa/products.ts`
- tests del mapper Medusa en `src/lib/commerce/medusa.test.ts`
- tests de UI para `ProductCard` y `ProductDetail`

Esto permite validar el storefront aunque Medusa no este levantado.

## Pendiente para la siguiente fase

- cart con `sdk.store.cart`
- seleccion real de variantes
- line items
- persistencia de cart
- CTA funcional de reserva o compra
- webhooks / invalidacion de cache

## Riesgos y deuda tecnica

- el filtro `featured` sigue dependiendo de metadata custom en Medusa
- la categoria visual del storefront se deduce de categorias/colecciones/metadata
- si el catalogo crece mucho, convendra mover parte del filtrado al backend en vez de traer todo
- la ruta de detalle todavia combina producto individual + catalogo para relacionados

## Siguiente paso recomendado

Conectar la seleccion de variantes y el primer `cart.create` de Medusa, manteniendo el flujo de
pickup-first y sin entrar aun en checkout completo.
