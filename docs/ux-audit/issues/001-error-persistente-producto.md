# [UX][Tienda] Ocultar mensaje de error persistente en la ficha de producto

Labels sugeridas: `ux`, `bug`, `tienda`, `frontend`

Prioridad: Alta

## Contexto

En la página de producto de la tienda aparece un mensaje de error visible por defecto:

> “No pudimos añadir este producto. No autenticado. Inicia sesión con tu cuenta del dashboard.”

Este mensaje se muestra aunque el usuario todavía no haya intentado añadir el producto a la reserva.

## Problema UX

El usuario interpreta que la tienda o el producto ya están fallando antes de interactuar. Esto reduce confianza, genera fricción y puede bloquear la intención de compra/reserva.

## Pasos para reproducir

1. Ir a `/tienda`.
2. Abrir un producto, por ejemplo `/tienda/creatina-monohidratada-300g`.
3. Hacer scroll hasta el bloque de selección de talla/cantidad.
4. Ver que el mensaje de error aparece sin haber pulsado “Añadir a la reserva”.

## Resultado actual

El error aparece por defecto en la ficha de producto.

## Resultado esperado

El error debe estar oculto inicialmente y mostrarse solo si ocurre un fallo real tras intentar añadir el producto.

## Propuesta de mejora

- Inicializar el estado de error como `null` o `undefined`.
- Renderizar la alerta solo si existe un error activo.
- Limpiar el error cuando el usuario cambia cantidad, talla o vuelve a intentar añadir.
- Mostrar mensajes más accionables según el caso:
  - “No pudimos añadir el producto. Inténtalo otra vez.”
  - “Tu sesión ha caducado. Inicia sesión para continuar.”

## Criterios de aceptación

- [ ] La ficha de producto no muestra ningún error al cargar.
- [ ] El error solo aparece tras una acción fallida.
- [ ] El error desaparece al reintentar o modificar la selección.
- [ ] El mensaje diferencia entre fallo de red, sesión expirada y producto no disponible.
