# Product Snapshot

Vista rapida del estado actual del producto para onboarding, QA visual y contexto de trabajo. El objetivo de este documento es responder dos preguntas sin tener que recorrer todo el repo:

- que superficies estan activas hoy
- que familias de componentes y flujos ya existen

## Resumen

Nova Forza es una base de producto para un gimnasio local con dos superficies reales:

- web publica comercial en `src/app/(public)`
- dashboard propio en `src/app/(admin)/dashboard`

La arquitectura actual combina:

- `Next.js 16` + `React 19` para UI publica y admin
- `Supabase` para auth, leads, settings y dominio no-commerce
- `Medusa v2` para catalogo, productos y operacion commerce

## Superficies activas

### Publico

- `/` home comercial con hero, planes, horarios, productos, zonas, equipo, testimonios y contacto
- `/tienda` catalogo de productos
- `/tienda/[slug]` detalle de producto
- `/carrito` carrito y flujo pickup
- `/carrito/procesando/[cartId]` estado intermedio de checkout
- `/carrito/confirmacion/[id]` confirmacion de pedido
- `/mi-cuenta` superficie privada ligera de cuenta del usuario
- `/registro` y `/registro/completado`
- paginas legales: `aviso-legal`, `privacidad`, `cookies`, `terminos`, `desistimiento`

### Admin

- `/login`
- `/dashboard`
- `/dashboard/leads`
- `/dashboard/info`
- `/dashboard/web`
- `/dashboard/cms`
- `/dashboard/advanced`
- `/dashboard/tienda`
- `/dashboard/tienda/productos`
- `/dashboard/tienda/categorias`
- `/dashboard/tienda/pedidos`

## Flujos reales detectados

1. Captacion de leads desde la home hacia Supabase.
2. Login al dashboard para operacion interna.
3. Navegacion de catalogo y detalle de producto desde Medusa.
4. Carrito con pickup y estados de checkout.
5. Cuenta del usuario y consulta de pedidos pickup.
6. Panel propio para ajustes del sitio, leads y estado de tienda.

## Familias de componentes visibles

### Marketing y publico

- `PublicPageShell`, `SiteHeader`, `SiteTopbar`, `SiteFooter`
- `HeroSection`, `PlansSection`, `ScheduleSection`, `ProductsSection`
- `TrainingZonesSection`, `TeamSection`, `TestimonialsSection`, `ContactSection`
- `ProductsGrid`, `ProductCard`, `ProductDetail`, `ProductGallery`, `ProductFilters`

### Admin

- `AdminSurface`, `AdminSection`, `DashboardSidebar`, `DashboardPageHeader`
- `AdminMetricCard`, `DashboardNotice`, `DashboardEmptyState`
- `LeadsTable`, `LeadStatusBadge`, `LeadStatusSelect`
- `GymInfoForm`, `SettingsForm`, `WebSectionForm`, `CmsDocumentsForm`
- `StoreDashboardNav`, `StoreCatalogTable`, `StoreProductsTable`, `StoreCategoriesTable`

### Cart y checkout

- `CartPageClient`, `CartLineItems`, `CartEntry`
- `PayPalCheckoutButton`, `CartProcessingPageClient`
- acciones admin relacionadas a pickup como `ResendPickupRequestEmailButton` y `PickupRequestStatusControl`

### UI base reutilizable

- `button`, `badge`, `card`, `input`, `label`, `table`, `textarea`, `dialog`, `form`

## Huecos o zonas todavia verdes

- `Planes` y `Horarios` existen hoy como secciones de la home, no como rutas publicas propias.
- Hay capas admin presentes como `cms` y `advanced`, pero no forman todavia un CMS amplio ni un modulo cerrado.
- El comercio esta centrado en pickup; no hay una experiencia de ecommerce completa mas alla de ese flujo.
- La cuenta existe como capa de acceso y lectura privada ligera; todavia no es el modulo operativo de miembros.

## Capturas clave

### Home
Ruta: `/`

![Home](images/product-snapshot/01-home.png)

### Tienda
Ruta: `/tienda`

![Tienda](images/product-snapshot/02-tienda.png)

### Login
Ruta: `/login`

![Login](images/product-snapshot/03-login.png)

### Dashboard overview
Ruta: `/dashboard`

![Dashboard overview](images/product-snapshot/04-dashboard-overview.png)

### Dashboard leads
Ruta: `/dashboard/leads`

![Dashboard leads](images/product-snapshot/05-dashboard-leads.png)

### Dashboard info
Ruta: `/dashboard/info`

![Dashboard info](images/product-snapshot/06-dashboard-info.png)

### Dashboard web
Ruta: `/dashboard/web`

![Dashboard web](images/product-snapshot/07-dashboard-web.png)

### Dashboard tienda
Ruta: `/dashboard/tienda`

![Dashboard tienda](images/product-snapshot/08-dashboard-tienda.png)

### Carrito
Ruta: `/carrito`

![Carrito](images/product-snapshot/09-carrito.png)

### Mi cuenta
Ruta: `/mi-cuenta`

![Mi cuenta](images/product-snapshot/10-mi-cuenta.png)
