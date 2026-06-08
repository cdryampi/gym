# [Seguridad/UX] Proteger y clarificar rutas de dashboard administrativo

Labels sugeridas: `security`, `ux`, `dashboard`, `auth`

Prioridad: Alta

## Contexto

Durante la auditoría se accedió al dashboard administrativo desde `/dashboard` con una sesión válida. La interfaz está bien estructurada, pero conviene revisar que la separación entre zona pública, área de socio y administración sea estricta.

## Problema UX / Seguridad

Si un usuario no autorizado llega a rutas internas, debe recibir una redirección o mensaje claro. Las rutas admin no deberían formar parte de la navegación pública ni confundirse con “Mi cuenta”.

## Resultado esperado

El dashboard debe ser accesible solo para usuarios con rol administrativo.

## Propuesta de mejora

- Verificar middleware/guards de autenticación por rol en `/dashboard` y subrutas.
- Redirigir usuarios no autenticados a `/acceso` o login correspondiente.
- Redirigir socios no administradores a `/mi-cuenta`.
- Ocultar enlaces admin en la navegación pública.
- Añadir página de “No autorizado” si procede.

## Criterios de aceptación

- [ ] `/dashboard` valida sesión y rol admin.
- [ ] Un socio sin rol admin no puede ver pantallas administrativas.
- [ ] Un usuario no autenticado es redirigido correctamente.
- [ ] La navegación pública no expone rutas admin.
