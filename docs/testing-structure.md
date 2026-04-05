# Testing Structure

La suite se organiza por dominio para que sea facil aislar fallos y relanzar solo la zona tocada. Usar Supabase como infraestructura no obliga a sacar un test de su modulo de negocio.

## Carpetas principales

- `src/components/cart/__tests__`
  - tests de UI y estado cliente del carrito
- `src/lib/cart/__tests__`
  - mapeos, bridge y helpers de Medusa/cart
- `src/lib/data/__tests__`
  - lecturas server-side para dashboard y storefront
- `src/lib/supabase/__tests__`
  - adapter de Supabase, normalizacion, snapshots, mapeos, guardas y errores del cliente
- `src/lib/email/__tests__`
  - emails transaccionales y plantillas
- `apps/medusa/src/**/__tests__`
  - tests unitarios del backend Medusa

## Regla para Supabase

- si el test prueba `src/lib/supabase/queries.ts` o la capa adapter de Supabase, va en `src/lib/supabase/__tests__`
- si el test prueba logica de dominio que consulta Supabase, se queda junto al modulo, por ejemplo `src/lib/data/leads.test.ts` o `src/lib/data/gym-management.test.ts`

Ejemplos:

- `src/lib/supabase/__tests__/queries.normalizers.test.ts` prueba normalizacion y payloads del adapter
- `src/lib/data/gym-management.test.ts` prueba flujos de negocio mobile aunque use un cliente fake de Supabase

## Comandos rapidos

- `npm run test`
  - ejecuta toda la suite Vitest de Next
- `npm run test:cart`
  - ejecuta la zona completa de carrito y pickup, incluyendo el unit test de Medusa
- `npm run test:admin`
  - ejecuta dashboard/backoffice y la capa compartida de `queries.ts` usada por admin
- `npm run test:marketing`
  - ejecuta storefront comercial
- `npm run test:supabase`
  - ejecuta la suite propia de `src/lib/supabase`
- `npm run test:medusa`
  - ejecuta los unit tests dentro de `apps/medusa/src`

## Runner por ruta

Usa este comando cuando una IA o un cambio toque un fichero o carpeta concreta:

```bash
npm run test:scope -- <ruta>
```

Ejemplos:

```bash
npm run test:scope -- src/lib/cart/medusa.ts
npm run test:scope -- src/lib/supabase/queries.ts
npm run test:scope -- src/components/cart
npm run test:scope -- apps/medusa/src/api/admin/gym/pickup-requests
```

El runner hace esto:

- si le pasas una carpeta, busca tests recursivamente dentro de esa zona
- si le pasas un fichero fuente, intenta resolver sus tests vecinos o dentro de `__tests__`, incluyendo patrones como `queries.*.test.ts`
- si la ruta pertenece a `apps/medusa`, usa Jest con el entorno correcto incluso en Windows

## Regla practica

Cuando toques una funcion o fichero:

1. lanza `npm run test:scope -- <ruta-afectada>`
2. si cambia una frontera de dominio, lanza el grupo completo correspondiente
3. antes de cerrar, vuelve a `npm run test`
