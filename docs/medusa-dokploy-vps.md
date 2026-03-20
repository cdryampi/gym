# Medusa en Dokploy para `gym.yampi.eu`

## Topologia recomendada

Para este proyecto, la separacion correcta es:

- `https://gym.yampi.eu` -> storefront `Next.js` en Dokploy
- `https://api.gym.yampi.eu` -> backend `Medusa` en tu VPS con Docker/Dokploy

No intentes usar `gym.yampi.eu` para ambos al mismo tiempo. La web y la API deben vivir en hosts separados aunque compartan el mismo VPS.

## Archivos preparados

- [Dockerfile](/C:/digitalbitsolutions/gym/apps/medusa/Dockerfile)
- [.dockerignore](/C:/digitalbitsolutions/gym/apps/medusa/.dockerignore)

## Configuracion de Dokploy

1. Crea una aplicacion Docker apuntando a `apps/medusa`.
2. Usa el `Dockerfile` incluido.
3. Usa el puerto interno `9000`, pero no lo publiques manualmente en el host si Dokploy va a poner el dominio.
4. Asigna el dominio `api.gym.yampi.eu`.
5. Activa HTTPS en Dokploy/Traefik.

## Variables de entorno de Medusa

Minimas:

```env
NODE_ENV=production
PORT=9000
DATABASE_URL=postgresql://...
MEDUSA_DB_INSECURE_SSL=true
STORE_CORS=https://gym.yampi.eu
ADMIN_CORS=https://gym.yampi.eu,https://api.gym.yampi.eu
AUTH_CORS=https://gym.yampi.eu,https://api.gym.yampi.eu
JWT_SECRET=pon-un-secreto-largo
COOKIE_SECRET=pon-otro-secreto-largo
```

Opcionales para imagenes con Supabase Storage:

```env
S3_URL=https://<project-ref>.supabase.co/storage/v1/s3
S3_BUCKET=medusa-media
S3_REGION=eu-central-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

## Variables de entorno de la web

La web publica debe apuntar al backend Medusa:

```env
COMMERCE_PROVIDER=medusa
STORE_ADMIN_PROVIDER=medusa
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.gym.yampi.eu
MEDUSA_BACKEND_URL=https://api.gym.yampi.eu
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
MEDUSA_PUBLISHABLE_KEY=pk_...
MEDUSA_ADMIN_API_KEY=sk_...
MEDUSA_REGION_ID=reg_...
```

Mantén tambien la configuracion de moneda/region del proyecto:

```env
COMMERCE_CURRENCY_CODE=PEN
COMMERCE_LOCALE=es-PE
NEXT_PUBLIC_COMMERCE_CURRENCY_CODE=PEN
NEXT_PUBLIC_COMMERCE_LOCALE=es-PE
MEDUSA_REGION_NAME=Peru
MEDUSA_COUNTRY_CODE=PE
```

## DNS recomendado

- `gym.yampi.eu` -> tu servicio `web` en Dokploy
- `api.gym.yampi.eu` -> IP publica de tu VPS

## Verificacion despues del deploy

Comprueba:

1. `https://api.gym.yampi.eu/health`
2. `https://gym.yampi.eu/tienda`
3. login del dashboard y CRUD de producto
