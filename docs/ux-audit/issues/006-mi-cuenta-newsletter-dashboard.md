# [UX][Cuenta] Separar claramente “Mi cuenta”, newsletter y dashboard admin

Labels sugeridas: `ux`, `navigation`, `auth`, `dashboard`

Prioridad: Alta

## Contexto

El enlace “Mi cuenta” puede resultar confuso porque no siempre comunica si lleva al login, al área privada de socio, a newsletter o a un flujo relacionado con el dashboard.

## Problema UX

Usuarios finales y personal interno pueden confundirse entre:

- Acceso de socio.
- Área privada del socio.
- Suscripción/newsletter.
- Dashboard administrativo.

Esto afecta la navegación y puede generar sensación de inconsistencia.

## Resultado actual

La navegación no separa claramente cuenta de usuario, captación/newsletter y administración.

## Resultado esperado

Cada tipo de usuario debe entender claramente a dónde va cada enlace.

## Propuesta de mejora

- Usar “Acceder” o “Mi cuenta” exclusivamente para socios/clientes.
- Usar “Únete al club” para newsletter o captación.
- Usar “Admin” o “Dashboard” solo para usuarios autorizados, oculto al público.
- Añadir redirecciones por rol:
  - Usuario no autenticado: login.
  - Socio autenticado: área privada.
  - Admin autenticado: dashboard.

## Criterios de aceptación

- [ ] “Mi cuenta” lleva al flujo de autenticación/área privada del usuario final.
- [ ] Newsletter o captación tiene etiqueta independiente.
- [ ] Dashboard admin no aparece como opción pública.
- [ ] Las rutas protegidas verifican rol antes de mostrar contenido.
