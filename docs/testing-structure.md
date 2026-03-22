# Testing Structure

La suite se organiza por dominio para que sea más fácil aislar fallos y relanzar solo la zona tocada.

## Carpetas principales

- `src/components/cart/__tests__`
  - tests de UI y estado cliente del carrito
- `src/lib/cart/__tests__`
  - mapeos, bridge y helpers de Medusa/cart
- `src/lib/data/__tests__`
  - lecturas server-side para dashboard y storefront
- `src/lib/email/__tests__`
  - emails transaccionales y plantillas
- `apps/medusa/src/**/__tests__`
  - tests unitarios del backend Medusa

## Comandos rápidos

- `npm run test`
  - ejecuta toda la suite Vitest de Next
- `npm run test:cart`
  - ejecuta la zona completa de carrito y pickup, incluyendo el unit test de Medusa
- `npm run test:admin`
  - ejecuta dashboard/backoffice
- `npm run test:marketing`
  - ejecuta storefront comercial
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
npm run test:scope -- src/components/cart
npm run test:scope -- apps/medusa/src/api/admin/gym/pickup-requests
```

El runner hace esto:

- si le pasas una carpeta, busca tests recursivamente dentro de esa zona
- si le pasas un fichero fuente, intenta resolver sus tests vecinos o dentro de `__tests__`
- si la ruta pertenece a `apps/medusa`, usa Jest con el entorno correcto incluso en Windows

## Regla práctica

Cuando toques una función o fichero:

1. lanza `npm run test:scope -- <ruta-afectada>`
2. si cambia una frontera de dominio, lanza el grupo completo correspondiente
3. antes de cerrar, vuelve a `npm run test`
