# Medusa en Dokploy para `gym.yampi.eu`

## Topologia recomendada

Para este proyecto, la separacion correcta es:

- `https://nuovaforzagym.com` -> frontend `Next.js` en Vercel
- `https://gym.yampi.eu` -> backend `Medusa` en tu VPS con Docker/Dokploy

`gym.yampi.eu` queda reservado para Medusa. No lo uses para servir `Next.js` ni como reverse proxy mixto.

## Archivos preparados

- [apps/medusa/Dockerfile](/C:/digitalbitsolutions/gym/apps/medusa/Dockerfile)
- [apps/medusa/.dockerignore](/C:/digitalbitsolutions/gym/apps/medusa/.dockerignore)
- [docker-compose.dokploy.yml](/C:/digitalbitsolutions/gym/docker-compose.dokploy.yml)

## Configuracion de Dokploy

1. Crea una aplicacion Docker apuntando a `apps/medusa`, o importa el compose de referencia con `medusa + redis`.
2. Usa el `Dockerfile` incluido para `medusa`.
3. Usa el puerto interno `9000`, pero no lo publiques manualmente en el host si Dokploy va a poner el dominio.
4. Asigna el dominio `gym.yampi.eu` al servicio `medusa`.
5. Manten `redis` solo en red interna; no expongas `6379`.
6. Activa HTTPS en Dokploy/Traefik.

## Variables de entorno de Medusa

Minimas:

```env
NODE_ENV=production
PORT=9000
DATABASE_URL=postgresql://...
MEDUSA_DB_INSECURE_SSL=true
REDIS_URL=redis://redis:6379
STORE_CORS=https://nuovaforzagym.com,http://localhost:3000,http://localhost:3001
ADMIN_CORS=https://nuovaforzagym.com,http://localhost:3000,http://localhost:3001
AUTH_CORS=https://nuovaforzagym.com,http://localhost:3000,http://localhost:3001
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
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://gym.yampi.eu
MEDUSA_BACKEND_URL=https://gym.yampi.eu
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
MEDUSA_PUBLISHABLE_KEY=pk_...
MEDUSA_ADMIN_API_KEY=sk_...
MEDUSA_REGION_ID=reg_...
```

Manten tambien la configuracion de moneda/region del proyecto:

```env
COMMERCE_CURRENCY_CODE=PEN
COMMERCE_LOCALE=es-PE
NEXT_PUBLIC_COMMERCE_CURRENCY_CODE=PEN
NEXT_PUBLIC_COMMERCE_LOCALE=es-PE
MEDUSA_REGION_NAME=Peru
MEDUSA_COUNTRY_CODE=PE
```

## DNS recomendado

- `nuovaforzagym.com` -> Vercel
- `gym.yampi.eu` -> IP publica de tu VPS / Dokploy (`medusa`)

## Nota sobre previews de Vercel

- Manten previews activas en Vercel.
- No abras CORS wildcard para `*.vercel.app` por defecto.
- Si en el futuro aparece un flujo browser -> Medusa que realmente necesite preview cross-origin, usa un dominio estable de staging antes que una lista dinamica de previews.

## Verificacion despues del deploy

Comprueba:

1. `https://gym.yampi.eu/health`
2. `https://nuovaforzagym.com`
3. `https://nuovaforzagym.com/tienda`
4. login del dashboard y CRUD de producto
# Healthcheck

El contenedor expone `GET /health`. La respuesta saludable es HTTP 200 con
`{ "status": "healthy", "service": "gym-medusa", "timestamp": "..." }` y no incluye
credenciales ni detalles de infraestructura. `docker-compose.dokploy.yml` usa este endpoint
como healthcheck; un despliegue no se considera listo hasta que responda 200.
Si la consulta minima a PostgreSQL falla, responde 503 con `status=unhealthy` sin revelar el error.
