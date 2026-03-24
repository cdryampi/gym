create table if not exists public.cms_documents (
  key text primary key,
  kind text not null check (kind in ('legal', 'system')),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  body_markdown text not null default '',
  cta_label text,
  cta_href text,
  seo_title text not null default '',
  seo_description text not null default '',
  is_published boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.cms_documents enable row level security;

drop policy if exists "cms_documents public read" on public.cms_documents;
create policy "cms_documents public read"
on public.cms_documents
for select
using (is_published = true);

drop policy if exists "cms_documents auth manage" on public.cms_documents;
create policy "cms_documents auth manage"
on public.cms_documents
for all
to authenticated
using (true)
with check (true);

insert into public.cms_documents (
  key,
  kind,
  slug,
  title,
  summary,
  body_markdown,
  cta_label,
  cta_href,
  seo_title,
  seo_description,
  is_published,
  updated_at
)
values
  (
    'legal-privacy',
    'legal',
    'privacidad',
    'Politica de privacidad',
    'Como tratamos tus datos cuando nos escribes, compras o interactuas con el gimnasio.',
    '# Responsable del tratamiento
Nova Forza Gym es responsable del tratamiento de los datos personales recogidos desde esta web.

# Que datos tratamos
- Datos de contacto que facilitas en formularios o procesos de compra.
- Datos operativos relacionados con pedidos pickup y atencion comercial.
- Datos tecnicos basicos para seguridad y funcionamiento del sitio.

# Para que usamos tus datos
- Responder consultas y gestionar altas de interes comercial.
- Preparar pedidos, pagos y recogidas en el club.
- Cumplir obligaciones legales, fiscales y de atencion al cliente.

# Conservacion
Conservamos los datos el tiempo necesario para la relacion comercial o mientras exista una obligacion legal aplicable.

# Derechos
Puedes solicitar acceso, rectificacion, supresion, oposicion o limitacion escribiendo a hola@novaforza.pe.',
    'Contactar con el gimnasio',
    'mailto:hola@novaforza.pe',
    'Politica de privacidad | Nova Forza',
    'Consulta como Nova Forza trata los datos personales recogidos desde la web, la tienda y los formularios.',
    true,
    timezone('utc', now())
  ),
  (
    'legal-cookies',
    'legal',
    'cookies',
    'Politica de cookies',
    'Informacion clara sobre las cookies basicas que usamos para el funcionamiento del sitio.',
    '# Que son las cookies
Las cookies son pequenos archivos que el navegador guarda para recordar informacion tecnica o de preferencia.

# Cookies usadas en este MVP
- Cookies tecnicas necesarias para sesiones, carrito y funcionamiento basico.
- Cookie local de preferencia para recordar tu decision sobre el banner.

# Gestion del consentimiento
Puedes aceptar o rechazar las cookies no esenciales desde el banner. Tambien puedes borrar cookies desde la configuracion de tu navegador.

# Mas informacion
Si tienes dudas sobre el uso de cookies en este sitio, escribe a hola@novaforza.pe.',
    'Volver al inicio',
    '/',
    'Politica de cookies | Nova Forza',
    'Revisa que cookies utiliza Nova Forza para el funcionamiento del sitio y como puedes gestionarlas.',
    true,
    timezone('utc', now())
  ),
  (
    'legal-terms',
    'legal',
    'terminos',
    'Terminos y condiciones',
    'Condiciones generales de uso de la web, del catalogo y de la operativa de pedidos pickup.',
    '# Uso del sitio
Esta web ofrece informacion comercial del gimnasio y un mini ecommerce con recogida local.

# Precios y catalogo
Los precios visibles se muestran en la moneda configurada por la tienda. En el checkout PayPal puede mostrarse un importe estimado en USD para el cobro.

# Pedidos pickup
- Los productos se recogen en el club.
- El usuario debe facilitar un email valido para recibir confirmaciones.
- Nova Forza puede contactar al cliente si necesita validar stock o recogida.

# Disponibilidad
La disponibilidad puede cambiar entre la navegacion y la confirmacion final del pedido.

# Responsabilidad
Nova Forza no responde de interrupciones temporales del servicio ajenas a su control razonable.',
    'Ver tienda',
    '/tienda',
    'Terminos y condiciones | Nova Forza',
    'Condiciones generales de uso de la web y de la operativa pickup de Nova Forza.',
    true,
    timezone('utc', now())
  ),
  (
    'legal-withdrawal',
    'legal',
    'desistimiento',
    'Politica de desistimiento',
    'Condiciones para cancelaciones, desistimiento y gestion de incidencias en pedidos pickup.',
    '# Cancelaciones
Si necesitas cancelar un pedido, contacta con el gimnasio lo antes posible indicando el numero de referencia.

# Derecho de desistimiento
Cuando la normativa aplicable reconozca derecho de desistimiento, el cliente podra ejercerlo dentro del plazo legal, siempre que el producto no este excluido por su naturaleza o uso.

# Productos excluidos o condicionados
- Productos abiertos, desprecintados o con riesgo higienico pueden no admitir devolucion.
- Suplementos o alimentos manipulados no se aceptaran si su estado ya no garantiza seguridad.

# Como solicitarlo
Escribe a hola@novaforza.pe indicando pedido, motivo y estado del producto.',
    'Escribir al soporte',
    'mailto:hola@novaforza.pe',
    'Politica de desistimiento | Nova Forza',
    'Consulta las condiciones de cancelacion y desistimiento aplicables a los pedidos pickup de Nova Forza.',
    true,
    timezone('utc', now())
  ),
  (
    'legal-notice',
    'legal',
    'aviso-legal',
    'Aviso legal',
    'Identificacion del titular del sitio y reglas basicas de uso del contenido publicado.',
    '# Titular del sitio
Nova Forza Gym es el titular de esta web y de los contenidos publicados en ella.

# Propiedad intelectual
Los textos, imagenes, marcas y elementos visuales del sitio no pueden reutilizarse sin autorizacion expresa.

# Uso adecuado
El usuario se compromete a utilizar el sitio de forma licita, sin alterar servicios, formularios o procesos de compra.

# Contacto
Para cuestiones legales o de contenido, escribe a hola@novaforza.pe.',
    'Contactar',
    'mailto:hola@novaforza.pe',
    'Aviso legal | Nova Forza',
    'Datos identificativos y condiciones legales basicas de uso del sitio de Nova Forza.',
    true,
    timezone('utc', now())
  ),
  (
    'system-cookie-banner',
    'system',
    'banner-cookies',
    'Cookies y preferencias del sitio',
    'Usamos cookies tecnicas para que la web funcione y una preferencia local para recordar tu decision.',
    'Puedes aceptar o rechazar las cookies no esenciales. Si continuas, seguiremos usando solo las necesarias para sesion, carrito y funcionamiento basico.',
    'Ver politica de cookies',
    '/cookies',
    'Banner de cookies | Nova Forza',
    'Texto operativo del banner de cookies del sitio de Nova Forza.',
    true,
    timezone('utc', now())
  ),
  (
    'system-error-generic',
    'system',
    'error-general',
    'Algo no ha salido como esperabamos',
    'La pagina ha encontrado un problema temporal y estamos trabajando para estabilizarla.',
    'Puedes reintentar en unos segundos o volver al inicio para seguir navegando sin perder el contexto principal.',
    'Volver al inicio',
    '/',
    'Error general del sitio | Nova Forza',
    'Copia generica para incidencias temporales del sitio publico.',
    true,
    timezone('utc', now())
  ),
  (
    'system-error-catalog',
    'system',
    'error-catalogo',
    'No pudimos cargar la tienda',
    'El catalogo no esta disponible en este momento.',
    'La tienda funciona con el catalogo operativo conectado. Reintenta en unos instantes o vuelve al inicio mientras el servicio se recupera.',
    'Volver al inicio',
    '/',
    'Error de catalogo | Nova Forza',
    'Copia generica para el estado de error de la tienda y del catalogo.',
    true,
    timezone('utc', now())
  ),
  (
    'system-error-not-found',
    'system',
    'error-no-encontrado',
    'No encontramos esa pagina',
    'La ruta que buscas ya no existe o nunca estuvo disponible.',
    'Vuelve al inicio, revisa la tienda o usa el menu principal para seguir navegando.',
    'Ir al inicio',
    '/',
    'Pagina no encontrada | Nova Forza',
    'Copia generica para estados 404 en la web publica.',
    true,
    timezone('utc', now())
  ),
  (
    'system-error-access',
    'system',
    'error-acceso',
    'Acceso restringido',
    'No tienes permisos para ver este contenido o la sesion requerida ya no es valida.',
    'Si crees que esto es un error, vuelve a iniciar sesion o contacta con el gimnasio para recibir ayuda.',
    'Ir a acceso',
    '/acceso',
    'Acceso restringido | Nova Forza',
    'Copia generica para estados de acceso no autorizado o restringido.',
    true,
    timezone('utc', now())
  )
on conflict (key) do update set
  kind = excluded.kind,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  body_markdown = excluded.body_markdown,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  is_published = excluded.is_published,
  updated_at = excluded.updated_at;
