# Medusa E-commerce Backend - Nova Forza

Este documento describe la integración de **Medusa** (v2) como backend para el comercio electrónico del gimnasio Nova Forza, separando las responsabilidades de e-commerce del resto del sitio web institucional.

## Arquitectura

El ecosistema ahora consta de 3 capas principales:

1. **Next.js (Storefront & Web Institucional)**
   - Sitio público (`src/app/(public)`) y Backoffice Institucional (`src/app/(admin)`).
   - Abstracción de catálogo (`src/lib/commerce/catalog.ts`) que ahora lee de Medusa como fuente principal.
2. **Medusa Backend** (`apps/medusa`)
   - Aplicación separada en el monorepo orientada exclusivamente a gestionar productos, categorías, envíos y checkout.
   - Panel de administración Medusa accesible en `http://localhost:9000/app`.
3. **Database (Supabase Postgres)**
   - Medusa se conecta directamente a la instancia PostgreSQL de Supabase.
   - Las tablas de Medusa (prefijos nativos de Medusa) conviven en el mismo esquema/base de datos que las tablas institucionales, pero la lógica de la aplicación las mantiene estrictamente aisladas.

## Notas sobre la Integración en Next.js

1. **Caché**: Next.js App Router (v14/15) por defecto guarda en caché las llamadas nativas `fetch()`. En `src/lib/commerce/medusa.ts` la llamada activa `revalidate: 0` para desarrollo, a fines de tener información en vivo. Ajustar según convenga en producción.
2. **Query Params**: En Medusa v2 los endpoints no procesan monedas dinámicas vía query (`currency_code`), la moneda se detecta implícitamente a través del `region_id`.
3. **Imágenes**: Como las imágenes actualmente están alojadas en el dominio local o en dominios externos sin CDN de Medusa, Next.js tiene configurados los `remotePatterns` necesarios.
   - `/tienda/[slug]`: Renderiza la vista detallada consultando por el `handle`.
   - **Precios e Inventario**: Los precios se asumen en la región española predeterminada (EUR) para mantener simplicidad y no arrastrar lógicas multimoneda innecesarias; lo mismo aplica para el stock en la ubicación `Nova Forza Club`.

### Almacenamiento de Imágenes (Supabase Storage)

Medusa ahora utiliza el módulo `@medusajs/file-s3` para almacenar los archivos físicos directamente en el bucket `medusa-media` de Supabase Storage.

1. **Configuración en `.env` (Medusa)**:
   Asegúrate de tener definidas estas credenciales emitidas desde `Project Settings > Storage > S3 API` en Supabase:
   - `S3_URL` (Ej: `https://[ID].supabase.co/storage/v1/s3`)
   - `S3_REGION` (Ej: `eu-west-1`)
   - `S3_BUCKET` (Ej: `medusa-media`)
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`

2. **Carga de Archivos**:
   Cualquier producto subido desde `http://localhost:9000/app` guardará automáticamente su copia dentro de Supabase Storage y registrará su URL pública.

3. **Seeding Automatizado**:
   El catálogo de `seed-nova-forza.ts` inyecta dinámicamente el prefijo de ruta (e.g. `https://[ID].supabase.co/storage/v1/object/public/medusa-media/...`) concatenándolo con los nombres referenciales de nuestros productos iniciales. Para que el SDK de Medusa renderice la imagen, simplemente sube los archivos físicos al bucket manualmente (o vía UI) usando el nombre designado (ej: `product-1.png`).

## Configuración y Variables de Entorno

### Frontend Next.js (`.env.local`)
Requiere definir a Medusa como proveedor y las credenciales de la región y tienda:
```env
COMMERCE_PROVIDER=medusa
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxxxxxxxxx
MEDUSA_REGION_ID=reg_xxxxxxxxxxxxxxxxxxxx
```

### Backend Medusa (`apps/medusa/.env`)
La conexión a base de datos debe apuntar a Supabase.
- **Importante**: Para migraciones (ej. `npx medusa db:migrate`), usar el puerto `5432` directo. Para desarrollo (`npm run dev:medusa`), también se puede usar `5432` pero si ocurren errores de `KnexTimeoutError` por límite de conexiones (60), asegúrate de apagar correctamente la instancia anterior antes de reiniciar. No se recomienda usar el pooler transaccional `6543` localmente porque Medusa v2 no soporta conexiones stateless en ese formato.

```env
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
REDIS_URL=redis://localhost:6379 # Opcional si se usa Redis real, por defecto el framework inyecta un mock si no está.
```

## Seed de Datos

Si necesitas poblar la base de datos de Medusa desde cero con los productos y categorías oficiales del gimnasio, ejecuta desde `apps/medusa`:

```bash
npm run seed:nova
```
Este script es **idempotente**. Se encarga de:
- Crear el perfil de envío.
- Crear la región de venta y asociar el canal de ventas.
- Crear categorías de productos (Suplementos, Accesorios, Merchandising) si no existen.
- Crear los productos (con sus respectivas tallas, variantes, IDs y precios).
- Mostrar en la terminal la **Publishable API Key** y **Region ID** correctas que debes copiar a tu `.env.local` en Next.js.

## Notas sobre la Integración en Next.js

1. **Caché**: Next.js App Router (v14/15) por defecto guarda en caché las llamadas nativas `fetch()`. En `src/lib/commerce/medusa.ts` la llamada activa `revalidate: 0` para desarrollo, a fines de tener información en vivo. Ajustar según convenga en producción.
2. **Query Params**: En Medusa v2 los endpoints no procesan monedas dinámicas vía query (`currency_code`), la moneda se detecta implícitamente a través del `region_id`.
3. **Imágenes**: Como las imágenes actualmente están alojadas en el dominio local o en dominios externos sin CDN de Medusa, Next.js tiene configurados los `remotePatterns` necesarios.

## Checklist Antes de Producir (Deploy)

- [ ] **Desplegar Servidor de Medusa**: Subir este servidor a Render, Railway o Fly.io con sus propias variables de entorno de BD conectadas a Supabase.
- [ ] **Configurar Redis**: Agregar e instalar una base de datos Redis en la nube (ej. Upstash) ya que el modo en memoria de Medusa solo sirve para desarrollo.
- [ ] **CORS**: Asegurar que `STORE_CORS` (ej. `https://novaforza.es`) y `ADMIN_CORS` apuntan a los dominios públicos correctos.

## Pasos para Levantar Localmente

Para iniciar el flujo completo de e-commerce:

1. Levantar ambos proyectos en terminales separadas:
```bash
# Terminal 1: Backend de E-commerce
cd apps/medusa
npm run dev

# Terminal 2: Storefront Institucional
cd root_project
npm run dev
```
2. Ir a `http://localhost:3000/tienda` para visualizar la tienda unida.
3. Ir a `http://localhost:9000/app` para gestionar productos internamente en la tienda Medusa.
