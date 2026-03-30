# Core Smoke Checklist

Checklist corta para validar el core real del producto despues de cambios relevantes.

## Precondiciones

1. Arranca Next.js: `npm run dev`
2. Arranca Medusa: `npm run dev:medusa` o `npm run dev:backend`
3. Configura `.env.local` con Supabase, Medusa y PayPal segun el entorno local
4. Ten al menos:
   - un producto visible en `/tienda`
   - login admin local o acceso valido al dashboard
   - una cuenta de usuario o flujo de registro funcional

## Smoke del core

### 1. Home publica

Ruta: `/`

Verifica:

- la home carga sin error
- header, topbar y footer renderizan
- las secciones principales aparecen
- el formulario de contacto esta visible

### 2. Contacto y leads

Ruta: `/`

Verifica:

- se puede enviar el formulario de contacto
- no aparece error inesperado en UI
- el lead queda visible en `/dashboard/leads`

### 3. Login admin

Ruta: `/login`

Verifica:

- el acceso completa sin error
- redirige a `/dashboard`

### 4. Dashboard overview

Ruta: `/dashboard`

Verifica:

- carga resumen sin estados rotos
- sidebar y shell admin renderizan correctamente
- los accesos a leads, info, web y tienda estan visibles

### 5. Dashboard leads

Ruta: `/dashboard/leads`

Verifica:

- el listado carga
- los estados de lead renderizan
- el lead enviado en el paso anterior aparece o existe feedback claro si el entorno esta vacio

### 6. Dashboard info y web

Rutas:

- `/dashboard/info`
- `/dashboard/web`

Verifica:

- los formularios cargan
- se pueden editar campos sin errores de render
- la accion de guardar muestra feedback coherente

### 7. Tienda publica

Ruta: `/tienda`

Verifica:

- el catalogo carga desde Medusa
- no hay fallback silencioso a datos locales
- se puede entrar al detalle de un producto

### 8. Carrito

Ruta: `/carrito`

Verifica:

- se puede anadir un producto desde `/tienda`
- el carrito muestra lineas y total
- el copy de pickup aparece donde corresponde

### 9. Checkout pickup

Rutas:

- `/carrito`
- `/carrito/procesando/[cartId]`
- `/carrito/confirmacion/[id]`

Verifica:

- se puede preparar el pago
- el flujo no termina con totales a `0`
- la confirmacion muestra `requestNumber`
- el pedido queda visible en `/dashboard/tienda/pedidos`

Nota:

- para una validacion completa del flujo PayPal usa tambien `docs/paypal-sandbox-smoke.md`

### 10. Mi cuenta

Ruta: `/mi-cuenta`

Verifica:

- la pagina carga para el usuario autenticado
- se ve una cuenta basica coherente y acciones de sesion
- se ve el historial pickup o un empty state coherente
- no se presenta `mi-cuenta` como modulo de miembros
- no hay errores al volver desde checkout o confirmacion

### 11. Dashboard tienda

Rutas:

- `/dashboard/tienda`
- `/dashboard/tienda/pedidos`

Verifica:

- el dashboard de tienda carga
- el pedido pickup aparece con estado, email y pago
- el detalle `/dashboard/tienda/pedidos/[id]` abre sin error

## Resultado esperado

La smoke se considera correcta cuando:

- marketing, admin, tienda, carrito, pickup y mi-cuenta cargan
- el lead de prueba llega al dashboard
- el catalogo responde desde Medusa
- el pedido pickup queda reflejado en dashboard y confirmacion

## Uso recomendado

- despues de cambios en rutas, auth, tienda, checkout, dashboard o settings
- antes de cerrar trabajo de hardening del core
- como base minima antes de ampliar modulos nuevos
