# [UX][Tienda] Convertir “Reserva” en carrito persistente con contador

Labels sugeridas: `ux`, `enhancement`, `tienda`, `navigation`

Prioridad: Alta

## Contexto

El botón “RESERVA” en la navegación superior no se comporta siempre como un carrito. En algunos estados lleva al bloque de contacto y en otros abre el overlay de reserva.

## Problema UX

El comportamiento es ambiguo. El usuario espera que “Reserva” abra su carrito/reserva, no que lo desplace a contacto. Además, el contador de productos no es suficientemente visible ni persistente.

## Resultado actual

- “RESERVA” puede funcionar como CTA de contacto.
- No hay un carrito claramente reconocible en todo momento.
- El estado vacío de la reserva no está bien representado.

## Resultado esperado

El usuario debe poder abrir el carrito/reserva en cualquier momento, incluso si está vacío.

## Propuesta de mejora

- Sustituir o complementar “RESERVA” con un icono de carrito/reserva persistente.
- Mostrar contador de productos visible.
- Si la reserva está vacía, abrir un estado vacío con mensaje:
  - “Tu reserva está vacía”
  - “Explora productos para añadirlos a tu reserva”
- Evitar redirecciones inesperadas a contacto.

## Criterios de aceptación

- [ ] El botón/ícono de carrito está visible en toda la tienda.
- [ ] El carrito abre aunque esté vacío.
- [ ] El contador refleja correctamente la cantidad de productos.
- [ ] “Reserva” no redirige inesperadamente a contacto.
