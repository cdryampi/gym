# [UX][Tienda] Mejorar feedback al añadir productos a la reserva

Labels sugeridas: `ux`, `enhancement`, `tienda`, `frontend`

Prioridad: Alta

## Contexto

En la ficha de producto, al pulsar “Añadir a la reserva”, el botón pasa a estado “Procesando…” durante varios segundos. No hay confirmación clara e inmediata de que el producto fue añadido.

## Problema UX

El usuario puede pensar que la acción quedó congelada o falló. La confirmación solo se percibe si abre el carrito/reserva o si observa el contador, que no es suficientemente evidente.

## Pasos para reproducir

1. Ir a `/tienda`.
2. Abrir un producto.
3. Pulsar “Añadir a la reserva”.
4. Observar el estado “Procesando…”.
5. Comprobar que no aparece una confirmación visible clara.

## Resultado actual

El usuario no recibe feedback de éxito claro tras añadir el producto.

## Resultado esperado

Tras añadir un producto, la interfaz debe confirmar inmediatamente la acción y actualizar el carrito.

## Propuesta de mejora

- Mostrar un toast o alerta de éxito: “Producto añadido a tu reserva”.
- Actualizar el contador del carrito de forma visible.
- Cambiar temporalmente el botón a “Añadido” o “Ver reserva”.
- Ofrecer acciones rápidas:
  - “Seguir comprando”
  - “Ver reserva”
- Evitar que el estado “Procesando…” dure más de lo necesario.

## Criterios de aceptación

- [ ] Al añadir producto aparece confirmación visual clara.
- [ ] El contador de reserva se actualiza inmediatamente.
- [ ] El botón no queda bloqueado indefinidamente en “Procesando…”.
- [ ] El usuario puede abrir la reserva desde la confirmación.
