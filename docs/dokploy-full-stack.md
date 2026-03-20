# Deploy completo en Dokploy

## Objetivo

Desplegar todo el proyecto fuera de Vercel, en el mismo VPS con Dokploy:

- `https://gym.yampi.eu` -> app `Next.js`
- `https://api.gym.yampi.eu` -> backend `Medusa`
- `Supabase` -> base de datos remota

## Archivos preparados

- [Dockerfile](/C:/digitalbitsolutions/gym/Dockerfile)
- [.dockerignore](/C:/digitalbitsolutions/gym/.dockerignore)
- [apps/medusa/Dockerfile](/C:/digitalbitsolutions/gym/apps/medusa/Dockerfile)
- [apps/medusa/.dockerignore](/C:/digitalbitsolutions/gym/apps/medusa/.dockerignore)
- [docker-compose.dokploy.yml](/C:/digitalbitsolutions/gym/docker-compose.dokploy.yml)

## Opcion recomendada en Dokploy

Usa dos aplicaciones separadas o importa el compose de referencia:

- servicio `web`
- servicio `medusa`
- servicio `redis`

Aunque esten en el mismo VPS, manten `web` y `medusa` como contenedores separados.

Importante en Dokploy:

- no publiques `3000`, `9000` ni `6379` en el host si usas dominios gestionados por Dokploy
- el compose de referencia usa `expose`, no `ports`
- el enrutado publico debe hacerlo el proxy de Dokploy hacia `web:3000` y `medusa:9000`

## Dominios

- `gym.yampi.eu` para `web`
- `api.gym.yampi.eu` para `medusa`

## Variables minimas del servicio web

```env
NODE_ENV=production
PORT=3000

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

ADMIN_ALLOWED_EMAILS=...
ADMIN_USER=...
ADMIN_PASSWORD=...

COMMERCE_PROVIDER=medusa
STORE_ADMIN_PROVIDER=medusa

COMMERCE_CURRENCY_CODE=PEN
COMMERCE_LOCALE=es-PE
NEXT_PUBLIC_COMMERCE_CURRENCY_CODE=PEN
NEXT_PUBLIC_COMMERCE_LOCALE=es-PE

NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.gym.yampi.eu
MEDUSA_BACKEND_URL=https://api.gym.yampi.eu
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
MEDUSA_PUBLISHABLE_KEY=pk_...
MEDUSA_ADMIN_API_KEY=sk_...
MEDUSA_REGION_ID=reg_...
MEDUSA_REGION_NAME=Peru
MEDUSA_COUNTRY_CODE=PE
```

## Variables minimas del servicio Medusa

```env
NODE_ENV=production
PORT=9000
DATABASE_URL=postgresql://...
MEDUSA_DB_INSECURE_SSL=true
REDIS_URL=redis://redis:6379

STORE_CORS=https://gym.yampi.eu
ADMIN_CORS=https://gym.yampi.eu,https://api.gym.yampi.eu
AUTH_CORS=https://gym.yampi.eu,https://api.gym.yampi.eu

JWT_SECRET=pon-un-secreto-largo
COOKIE_SECRET=pon-otro-secreto-largo

COMMERCE_CURRENCY_CODE=PEN
MEDUSA_REGION_NAME=Peru
MEDUSA_COUNTRY_CODE=PE
```

Si usas imagenes con Supabase Storage:

```env
S3_URL=https://<project-ref>.supabase.co/storage/v1/s3
S3_BUCKET=medusa-media
S3_REGION=eu-central-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

## Notas operativas

- `DATABASE_URL` de Medusa debe usar la conexion directa de Supabase por `5432`
- el servicio `web` apunta a `https://api.gym.yampi.eu`, no a `localhost`
- si cambias dominios, actualiza `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` y las variables `NEXT_PUBLIC_MEDUSA_*`

## Verificacion

Comprueba:

1. `https://api.gym.yampi.eu/health`
2. `https://gym.yampi.eu`
3. `https://gym.yampi.eu/tienda`
4. CRUD de tienda desde el dashboard propio
