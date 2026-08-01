# Runbook de reconciliacion Store + Pickup

Guia corta para incidencias del core commerce entre Next.js, Medusa y Supabase.

## Objetivo

Resolver incidencias de catalogo, carrito, checkout pickup y dashboard sin romper la frontera del proyecto:

- Next.js renderiza storefront, mi-cuenta y dashboard
- Medusa opera catalogo, carrito, orden y pickup
- Supabase mantiene auth, settings, leads y los enlaces puente del proyecto

## Regla de oro

Antes de tocar datos o reiniciar servicios, confirma siempre cual es la fuente de verdad:

- catalogo operativo: Medusa
- carrito y orden: Medusa
- pickup request: Medusa
- auth y sesion del socio: Supabase
- enlaces `medusa_category_id` y `medusa_product_id`: Supabase

No metas cambios operativos directos en tablas legacy de `products` o `store_categories` para "arreglar" runtime. Si hay desalineacion de catalogo, la correccion pasa por Medusa y, si hace falta, por el sync puntual desde Supabase.

## Servicios que deben estar vivos

1. Next.js en `http://localhost:3000`
2. Medusa en `http://localhost:9000`
3. PostgreSQL de Supabase accesible desde ambos runtimes
4. Redis disponible para Medusa en desarrollo

Comandos base:

```bash
npm run dev
npm run dev:medusa
```

Si cambias rutas o middlewares custom de Medusa, reinicia Medusa antes de seguir. Next por si solo no recoge esos cambios.

## Variables que mas rompen el flujo

### Storefront y carrito

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- `COMMERCE_PROVIDER=medusa`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Dashboard tienda y pickup

- `MEDUSA_BACKEND_URL`
- `MEDUSA_ADMIN_API_KEY`
- `SUPABASE_SECRET_KEY`
- `STORE_ADMIN_PROVIDER=medusa`

### Checkout PayPal

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `PAYPAL_ENVIRONMENT`

### Email pickup

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`

### Medusa runtime

- `DATABASE_URL` con conexion directa `5432`, no pooler `6543`

## Orden de diagnostico

1. Confirma si el fallo nace en storefront, dashboard o backend Medusa.
2. Revisa si falta alguna variable de entorno obligatoria.
3. Comprueba que Medusa responde antes de asumir un fallo de Next.
4. Solo despues revisa enlaces en Supabase o reconciliacion de pickup.
5. Si el incidente afecta checkout real, evita reintentos agresivos que puedan duplicar aprobaciones o emails.

## Escenario 1: `/tienda` no carga o el catalogo sale vacio

Sintomas habituales:

- error visible en storefront
- no aparecen productos en `/tienda`
- el detalle `/tienda/[slug]` no encuentra el producto

Comprobaciones:

1. Verifica `NEXT_PUBLIC_MEDUSA_BACKEND_URL` y `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.
2. Confirma que Medusa este levantado en `http://localhost:9000`.
3. Revisa que `COMMERCE_PROVIDER=medusa`.
4. Si el dashboard si ve productos pero storefront no, revisa CORS y publishable key.

Recuperacion:

1. Reinicia Medusa si acabas de tocar config o region.
2. Si el problema es desalineacion del catalogo legacy, ejecuta:

```bash
npm run sync:store:medusa
```

3. Verifica despues `/tienda` y `/dashboard/tienda`.

## Escenario 2: el dashboard de tienda no deja guardar categorias o productos

Sintomas habituales:

- warnings sobre `MEDUSA_ADMIN_API_KEY`
- warnings sobre `SUPABASE_SECRET_KEY`
- el dashboard carga pero no escribe cambios reales

Comprobaciones:

1. Revisa `MEDUSA_ADMIN_API_KEY` y `MEDUSA_BACKEND_URL`.
2. Revisa `SUPABASE_SECRET_KEY`.
3. Confirma que no estas intentando operar con `STORE_ADMIN_PROVIDER` distinto de `medusa`.

Recuperacion:

1. Corrige env y reinicia Next si era un problema de variables.
2. Repite la operacion desde `src/app/(admin)/dashboard/tienda`.
3. Si Medusa guarda pero Supabase no persiste el puente, trata la incidencia como fallo y no cierres la tarea hasta que ambos lados queden alineados.

Referencias utiles:

- `src/lib/data/store-admin.ts`
- `src/lib/data/store-admin/medusa-repository.ts`
- `src/app/(admin)/dashboard/tienda/actions.ts`

## Escenario 3: `/api/cart/member` falla o el socio pierde el carrito

Sintomas habituales:

- `POST /api/cart/member` devuelve `500`
- el carrito desaparece al iniciar sesion
- hay cookie `gym_cart_id` rota o inexistente

Comprobaciones:

1. Confirma que la sesion de Supabase es valida.
2. Revisa que Medusa tenga disponibles las rutas `/admin/gym/carts/attach` y `/admin/gym/carts/active`.
3. Si acabas de anadir o cambiar middlewares custom en `apps/medusa/src/api`, reinicia Medusa.

Recuperacion:

1. Refresca `/carrito` con la sesion del socio activa.
2. Si la cookie estaba rota, el bridge debe degradar a estado limpio o recuperar el draft activo del socio.
3. Si la recuperacion responde `cart: null`, valida en Medusa si realmente existe un carrito activo para ese customer antes de tocar datos.

Referencias utiles:

- `src/app/api/cart/member/route.ts`
- `src/lib/cart/member-bridge.ts`
- `src/components/cart/CartProvider.tsx`
- `apps/medusa/src/api/admin/gym/carts/active/route.ts`

## Escenario 4: el checkout se queda en `/carrito/procesando/[cartId]`

Sintomas habituales:

- el usuario vuelve de PayPal pero no aterriza en confirmacion
- la pantalla de procesando dura demasiado
- queda mensaje de revision manual

Comprobaciones:

1. Revisa credenciales PayPal del mismo entorno sandbox o production en cliente y servidor.
2. Verifica que el carrito no haya terminado con total `0`.
3. Consulta si existe orden Medusa asociada al `cartId`.
4. Revisa la smoke especializada:

- `docs/paypal-sandbox-smoke.md`

Recuperacion:

1. Evita relanzar el pago sin comprobar primero si la orden ya existe.
2. Si hay orden pero no se ha proyectado a pickup, pasa al escenario 5.
3. Si no hay orden, revisa session init y completion en Medusa antes de reintentar.

## Escenario 5: la orden existe pero no aparece en pickup

Sintomas habituales:

- hay confirmacion parcial o timeline roto
- `/dashboard/tienda/pedidos` no muestra el pedido esperado
- `/mi-cuenta` no refleja el historial nuevo

Comprobaciones:

1. Revisa si la orden Medusa existe para el `cartId`.
2. Abre `/dashboard/tienda/pedidos` y comprueba el warning de reconciliacion.
3. Si el dashboard permite sync manual, usa la accion solo una vez y vuelve a cargar.

Recuperacion:

1. Ejecuta la reconciliacion desde el dashboard o desde la ruta Medusa correspondiente.
2. Si sigue sin proyectarse, revisa el bridge de `sync-order` y los datos minimos del pedido.
3. Revalida despues en:
   - `/dashboard/tienda/pedidos`
   - `/dashboard/tienda/pedidos/[id]`
   - `/mi-cuenta`

Referencias utiles:

- `src/lib/data/pickup-requests.ts`
- `src/app/(admin)/dashboard/tienda/pedidos/page.tsx`
- `src/app/(admin)/dashboard/tienda/actions.ts`
- `apps/medusa/src/api/admin/gym/pickup-requests/sync-order`

## Escenario 6: el pedido aparece pero el email falla

Sintomas habituales:

- `email_status=failed`
- errores SMTP en el timeline
- el pedido existe pero la notificacion no salio

Comprobaciones:

1. Revisa la configuracion SMTP.
2. Verifica remitente valido en `SMTP_FROM_EMAIL`.
3. Confirma si el fallo es de proveedor externo y no de creacion del pickup request.

Recuperacion:

1. No recrees el pedido pickup por un fallo de email.
2. Corrige la configuracion de envio.
3. Usa la accion de reintento desde el dashboard cuando el proveedor ya este sano.

Referencias utiles:

- `src/lib/email/pickup-request.ts`
- `src/app/(admin)/dashboard/tienda/actions.ts`
- `docs/smtp-gmail-setup.md`

## Comprobacion final despues de recuperar

1. `/tienda` carga catalogo real
2. `/carrito` muestra lineas y total coherentes
3. `/carrito/procesando/[cartId]` resuelve a confirmacion o deja estado claro
4. `/dashboard/tienda/pedidos` refleja timeline, pago y email
5. `/mi-cuenta` refleja el historial pickup del socio

Si el incidente fue relevante, remata con la smoke corta:

- `docs/core-smoke-checklist.md`

Y si toco checkout PayPal real:

- `docs/paypal-sandbox-smoke.md`
