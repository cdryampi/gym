# [Accesibilidad][Tienda] Mejorar contraste y legibilidad de textos secundarios

Labels sugeridas: `accessibility`, `ux`, `frontend`, `tienda`

Prioridad: Media

## Contexto

En varias partes de la tienda se usan textos grises claros sobre fondos claros o etiquetas pequeñas con contraste limitado.

Ejemplos observados:

- Placeholder del buscador.
- Etiquetas como “Disponible”, “Premium” o tags.
- Descripciones de producto en tarjetas.
- Textos secundarios del catálogo.

## Problema UX / Accesibilidad

El bajo contraste dificulta la lectura, especialmente para usuarios con baja visión, pantallas con brillo reducido o dispositivos móviles.

## Resultado actual

Algunos textos secundarios y etiquetas no tienen suficiente contraste visual.

## Resultado esperado

Los textos esenciales deben cumplir contraste mínimo WCAG AA y ser legibles en desktop y móvil.

## Propuesta de mejora

- Revisar la paleta de grises usada en textos secundarios.
- Aumentar contraste de etiquetas y placeholders.
- Usar tamaño mínimo recomendado para texto normal.
- Añadir estados focus visibles para elementos interactivos.
- Revisar contraste de botones secundarios y bordes.

## Criterios de aceptación

- [ ] Textos esenciales cumplen contraste WCAG AA.
- [ ] Placeholders y etiquetas son legibles.
- [ ] Los estados hover/focus son visibles.
- [ ] La lectura en móvil no depende de textos demasiado pequeños.
