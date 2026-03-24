# PayPal Sandbox Smoke (Peru)

Guia rapida para validar el checkout pickup-first con buyer sandbox de Peru.

## Perfil de prueba

El proyecto expone un perfil por defecto en:

- `src/lib/paypal/test-profile.ts`
- `src/lib/env.ts#getPaymentTestProfileEnv`

Variables opcionales en `.env.local`:

- `PAYMENT_TEST_EMAIL`
- `PAYMENT_TEST_FIRST_NAME`
- `PAYMENT_TEST_LAST_NAME`
- `PAYMENT_TEST_PHONE`
- `PAYMENT_TEST_COUNTRY_CODE`
- `PAYMENT_TEST_STATE`
- `PAYMENT_TEST_CITY`
- `PAYMENT_TEST_ADDRESS_1`
- `PAYMENT_TEST_ADDRESS_2`
- `PAYMENT_TEST_POSTAL_CODE`
- `PAYMENT_TEST_DOCUMENT_TYPE`
- `PAYMENT_TEST_DOCUMENT_NUMBER`
- `PAYMENT_TEST_CARD_BRAND`
- `PAYMENT_TEST_CARD_NUMBER`
- `PAYMENT_TEST_CARD_EXPIRY`
- `PAYMENT_TEST_CARD_CVV`

Defaults esperados:

- `PAYMENT_TEST_COUNTRY_CODE=PE`
- locale commerce `es-PE`
- currency commerce `PEN`

## Pre-checks

1. Arranca Next.js: `npm run dev`
2. Arranca Medusa: `npm run dev:medusa`
3. Verifica que el producto del carrito tenga `paypal_price_usd` configurado en Medusa.
4. Verifica que el shipping option de pickup exista y tenga precio `0`.
5. Verifica que `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `NEXT_PUBLIC_PAYPAL_CLIENT_ID` apunten al mismo entorno sandbox.
6. Verifica que `RESEND_API_KEY` este presente si quieres comprobar envio real de email.

## Flujo smoke

1. Entra a `/tienda` y anade un producto pickup.
2. Abre `/carrito`.
3. Comprueba:
   - total visible en `PEN`
   - importe PayPal en `USD`
   - copy de recogida local
4. Pulsa `Preparar pago con PayPal`.
5. Completa la aprobacion con buyer sandbox Peru.
6. Si usas tarjeta sandbox, rellena los datos del perfil de prueba de `.env.local`.
7. Espera la confirmacion y valida:
   - pantalla de confirmacion sin totales a `0`
   - `requestNumber`
   - `paypalOrderId`
   - `emailStatus`

## Comprobaciones posteriores

En dashboard:

1. Abre `/dashboard/tienda/pedidos`
2. Verifica que el pedido pickup existe
3. Verifica:
   - lineas
   - subtotal/total `PEN`
   - `charged_total` en `USD`
   - `payment_status`
   - `paypal_order_id`
   - `email_status`

En base o logs:

1. Verifica trazas `PayPal Checkout Trace`
2. Revisa duraciones de:
   - `retrieve_cart`
   - `attach_customer`
   - `shipping_auto`
   - `payment_session_init`
   - `complete_cart`
   - `recovery_polling`
   - `sync_order`
   - `email_send`

## Resultado esperado

- El checkout termina con `pickup_request` proyectada
- El dashboard muestra lineas y totales correctos
- El email al cliente queda como `sent`
- Si el email interno falla, el pedido sigue quedando operativo
