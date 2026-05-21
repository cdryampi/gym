# [UX][Tienda] Añadir ordenación y filtros avanzados al catálogo

Labels sugeridas: `ux`, `enhancement`, `tienda`, `catalogo`

Prioridad: Media

## Contexto

El catálogo de tienda permite buscar y filtrar por algunas categorías, pero no ofrece ordenación ni filtros avanzados.

## Problema UX

Cuando el catálogo crezca, los usuarios necesitarán formas más rápidas de encontrar productos relevantes. Actualmente no se puede ordenar por precio, novedad, disponibilidad o popularidad.

## Resultado actual

Filtros básicos por categoría/estado, sin ordenación ni filtros por precio.

## Resultado esperado

El catálogo debe permitir al usuario ajustar la vista según su intención de compra.

## Propuesta de mejora

Añadir controles para:

- Ordenar por:
  - Precio: menor a mayor.
  - Precio: mayor a menor.
  - Novedades.
  - Más populares o destacados.
- Filtrar por:
  - Rango de precio.
  - Disponibilidad.
  - Categoría.
  - Marca o tipo de producto si aplica.
- Mostrar filtros activos de forma clara y fácil de quitar.

## Criterios de aceptación

- [ ] El usuario puede ordenar productos por precio.
- [ ] El usuario puede filtrar por disponibilidad.
- [ ] Los filtros activos son visibles.
- [ ] Existe acción clara para limpiar filtros.
- [ ] La URL conserva filtros/búsqueda para compartir o volver atrás.
