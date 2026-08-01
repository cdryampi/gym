# Membership QR Ops

Flujo operativo del QR de membresía para recepción móvil.

## Qué cambia

- El dashboard valida QR solo con cámara en `/dashboard/membresias/recepcion`.
- La validación real vive en la edge function `membership-qr-validate`.
- Los eventos se registran en `public.membership_qr_scan_events`.
- Si falta la migración o la function, la recepción falla con mensaje explícito.

## Bootstrap local

1. Arranca Supabase local:
   - `npx supabase start`
2. Aplica migraciones:
   - `npx supabase db push`
3. Sirve la edge function:
   - `npx supabase functions serve membership-qr-validate`
4. Comprueba el flujo:
   - `npm run supabase:qr:doctor`

## Despliegue

1. Publica la edge function:
   - `npx supabase functions deploy membership-qr-validate`
   - La funcion declara `verify_jwt = false`: la ruta server-side la protege comparando el header `apikey` con la clave secreta inyectada por Supabase.
2. Verifica que el entorno tenga:
   - `NEXT_PUBLIC_SUPABASE_URL` o `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
3. Ejecuta de nuevo:
   - `npm run supabase:qr:doctor`

## Diagnóstico rápido

- Si el escáner abre la cámara pero no valida, revisa el endpoint interno `/api/dashboard/membership-qr/validate`.
- Si el endpoint devuelve error, valida que la function exista y que `SUPABASE_SECRET_KEY` esté configurada.
- Si la function responde con `server_error`, revisa la migración `202604090001_harden_membership_qr_reception.sql`.
- Los intentos quedan trazados en `public.membership_qr_scan_events`.
- Las claves `sb_secret_...` se envian solo mediante `apikey`; nunca como `Authorization: Bearer` porque no son JWT.
