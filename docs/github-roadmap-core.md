# Hoja de Ruta del Core

Roadmap operativo para cerrar el core real del producto antes de abrir modulos grandes nuevos.

## Principios

- Priorizar lo que ya esta encendido en produccion de desarrollo: marketing, dashboard, tienda, carrito, pickup y mi-cuenta.
- No abrir modulos grandes nuevos sin discovery previo.
- Mantener la frontera del proyecto:
  - Next.js para UI publica y backoffice
  - Medusa para catalogo operativo y commerce
  - Supabase para auth, settings, leads y soporte del dominio gym

## Fase 0 — Rebaseline del producto y hardening

Epic: [#12 Baseline del producto real](https://github.com/cdryampi/gym/issues/12)

- [#18](https://github.com/cdryampi/gym/issues/18) Actualizar README, AGENTS y docs operativas para reflejar el producto real ya implementado.
- [#19](https://github.com/cdryampi/gym/issues/19) Auditar restos legacy o ambiguos del repo y limpiar contradicciones.
- [#20](https://github.com/cdryampi/gym/issues/20) Definir smoke checklist del core para QA recurrente.

## Fase 1 — Marketing operable

Epic: [#13 Contenido comercial editable](https://github.com/cdryampi/gym/issues/13)

- [#21](https://github.com/cdryampi/gym/issues/21) Mover Planes desde contenido estatico de home a fuente editable.
- [#22](https://github.com/cdryampi/gym/issues/22) Mover Horarios desde contenido estatico de home a fuente editable.
- [#23](https://github.com/cdryampi/gym/issues/23) Crear rutas publicas `/planes` y `/horarios` reutilizando la misma fuente de verdad.
- [#24](https://github.com/cdryampi/gym/issues/24) Abrir una segunda ola de CMS comercial para secciones estaticas de alto valor.

## Fase 2 — Leads v2

Epic: [#14 Leads v2](https://github.com/cdryampi/gym/issues/14)

- [#25](https://github.com/cdryampi/gym/issues/25) Anadir busqueda, filtros y orden operativa en `/dashboard/leads`.
- [#26](https://github.com/cdryampi/gym/issues/26) Crear vista de detalle o expansion por lead.
- [#27](https://github.com/cdryampi/gym/issues/27) Persistir seguimiento comercial minimo en Supabase.
- [#28](https://github.com/cdryampi/gym/issues/28) Anadir exportacion simple para operacion local.

## Fase 3 — Store + pickup hardening

Epic: [#15 Store + pickup hardening](https://github.com/cdryampi/gym/issues/15)

- [#29](https://github.com/cdryampi/gym/issues/29) Mejorar `/dashboard/tienda/pedidos` con filtros, timeline y acciones mas claras.
- [#30](https://github.com/cdryampi/gym/issues/30) Crear detalle privado de pedido en `/mi-cuenta/pedidos/[id]`.
- [#31](https://github.com/cdryampi/gym/issues/31) Endurecer el bridge miembro-carrito-pickup.
- [#32](https://github.com/cdryampi/gym/issues/32) Documentar runbook de reconciliacion entre Next, Medusa y Supabase.
- [#33](https://github.com/cdryampi/gym/issues/33) Revisar UX del checkout pickup para estados de error y seguimiento.

## Fase 4 — Mi cuenta v2

Epic: [#16 Mi cuenta v2](https://github.com/cdryampi/gym/issues/16)

- [#34](https://github.com/cdryampi/gym/issues/34) Anadir ajustes basicos de cuenta del socio.
- [#35](https://github.com/cdryampi/gym/issues/35) Separar claramente auth del socio vs. modulo de miembros del gimnasio.
- [#36](https://github.com/cdryampi/gym/issues/36) Definir backlog corto de mejoras de mi-cuenta que sigan siendo core.

## Fase 5 — Backlog de expansion

Epic: [#17 Backlog de expansion](https://github.com/cdryampi/gym/issues/17)

- [#37](https://github.com/cdryampi/gym/issues/37) Discovery del modulo Reservas. Referencia local: `docs/reservas-discovery.md`.
- [#38](https://github.com/cdryampi/gym/issues/38) Discovery del modulo Miembros operativo. Referencia local: `docs/miembros-operativo-discovery.md`.
- [#39](https://github.com/cdryampi/gym/issues/39) Discovery del modulo Rutinas.
- [#40](https://github.com/cdryampi/gym/issues/40) Revaluar si Planes debe seguir siendo solo contenido comercial o pasar a entidad de negocio.

## Etiquetas recomendadas

- `epic`
- `product`
- `ops`
- `tech-debt`
- `qa`
- `discovery`

## Regla para issues de tienda

Todo issue de tienda debe recordar explicitamente esta frontera:

- UI dashboard y storefront en Next.js
- catalogo operativo en Medusa
- soporte y enlaces en Supabase
