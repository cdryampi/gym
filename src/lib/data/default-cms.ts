import type { DBCmsDocument } from "@/lib/supabase/database.types";

export const cmsDocumentKeys = [
  "legal-privacy",
  "legal-cookies",
  "legal-terms",
  "legal-withdrawal",
  "legal-notice",
  "system-cookie-banner",
  "system-error-generic",
  "system-error-catalog",
  "system-error-not-found",
  "system-error-access",
] as const;

export type CmsDocumentKey = (typeof cmsDocumentKeys)[number];
export type CmsDocumentKind = "legal" | "system";

export const defaultCmsDocuments: Record<CmsDocumentKey, DBCmsDocument> = {
  "legal-privacy": {
    key: "legal-privacy",
    kind: "legal",
    slug: "privacidad",
    title: "Politica de privacidad",
    summary:
      "Como tratamos tus datos cuando nos escribes, compras o interactuas con el gimnasio.",
    body_markdown: `# Responsable del tratamiento
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
Puedes solicitar acceso, rectificacion, supresion, oposicion o limitacion escribiendo a hola@novaforza.pe.`,
    cta_label: "Contactar con el gimnasio",
    cta_href: "mailto:hola@novaforza.pe",
    seo_title: "Politica de privacidad | Nova Forza",
    seo_description:
      "Consulta como Nova Forza trata los datos personales recogidos desde la web, la tienda y los formularios.",
    is_published: true,
    updated_at: "2026-03-23T00:00:00.000Z",
  },
  "legal-cookies": {
    key: "legal-cookies",
    kind: "legal",
    slug: "cookies",
    title: "Politica de cookies",
    summary:
      "Informacion clara sobre las cookies basicas que usamos para el funcionamiento del sitio.",
    body_markdown: `# Que son las cookies
Las cookies son pequenos archivos que el navegador guarda para recordar informacion tecnica o de preferencia.

# Cookies usadas en este MVP
- Cookies tecnicas necesarias para sesiones, carrito y funcionamiento basico.
- Cookie local de preferencia para recordar tu decision sobre el banner.

# Gestion del consentimiento
Puedes aceptar o rechazar las cookies no esenciales desde el banner. Tambien puedes borrar cookies desde la configuracion de tu navegador.

# Mas informacion
Si tienes dudas sobre el uso de cookies en este sitio, escribe a hola@novaforza.pe.`,
    cta_label: "Volver al inicio",
    cta_href: "/",
    seo_title: "Politica de cookies | Nova Forza",
    seo_description:
      "Revisa que cookies utiliza Nova Forza para el funcionamiento del sitio y como puedes gestionarlas.",
    is_published: true,
    updated_at: "2026-03-23T00:00:00.000Z",
  },
  "legal-terms": {
    key: "legal-terms",
    kind: "legal",
    slug: "terminos",
    title: "Terminos y condiciones",
    summary:
      "Condiciones generales de uso de la web, del catalogo y de la operativa de pedidos pickup.",
    body_markdown: `# Uso del sitio
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
Nova Forza no responde de interrupciones temporales del servicio ajenas a su control razonable.`,
    cta_label: "Ver tienda",
    cta_href: "/tienda",
    seo_title: "Terminos y condiciones | Nova Forza",
    seo_description:
      "Condiciones generales de uso de la web y de la operativa pickup de Nova Forza.",
    is_published: true,
    updated_at: "2026-03-23T00:00:00.000Z",
  },
  "legal-withdrawal": {
    key: "legal-withdrawal",
    kind: "legal",
    slug: "desistimiento",
    title: "Politica de desistimiento",
    summary:
      "Condiciones para cancelaciones, desistimiento y gestion de incidencias en pedidos pickup.",
    body_markdown: `# Cancelaciones
Si necesitas cancelar un pedido, contacta con el gimnasio lo antes posible indicando el numero de referencia.

# Derecho de desistimiento
Cuando la normativa aplicable reconozca derecho de desistimiento, el cliente podra ejercerlo dentro del plazo legal, siempre que el producto no este excluido por su naturaleza o uso.

# Productos excluidos o condicionados
- Productos abiertos, desprecintados o con riesgo higienico pueden no admitir devolucion.
- Suplementos o alimentos manipulados no se aceptaran si su estado ya no garantiza seguridad.

# Como solicitarlo
Escribe a hola@novaforza.pe indicando pedido, motivo y estado del producto.`,
    cta_label: "Escribir al soporte",
    cta_href: "mailto:hola@novaforza.pe",
    seo_title: "Politica de desistimiento | Nova Forza",
    seo_description:
      "Consulta las condiciones de cancelacion y desistimiento aplicables a los pedidos pickup de Nova Forza.",
    is_published: true,
    updated_at: "2026-03-23T00:00:00.000Z",
  },
  "legal-notice": {
    key: "legal-notice",
    kind: "legal",
    slug: "aviso-legal",
    title: "Aviso legal",
    summary:
      "Identificacion del titular del sitio y reglas basicas de uso del contenido publicado.",
    body_markdown: `# Titular del sitio
Nova Forza Gym es el titular de esta web y de los contenidos publicados en ella.

# Propiedad intelectual
Los textos, imagenes, marcas y elementos visuales del sitio no pueden reutilizarse sin autorizacion expresa.

# Uso adecuado
El usuario se compromete a utilizar el sitio de forma licita, sin alterar servicios, formularios o procesos de compra.

# Contacto
Para cuestiones legales o de contenido, escribe a hola@novaforza.pe.`,
    cta_label: "Contactar",
    cta_href: "mailto:hola@novaforza.pe",
    seo_title: "Aviso legal | Nova Forza",
    seo_description:
      "Datos identificativos y condiciones legales basicas de uso del sitio de Nova Forza.",
    is_published: true,
    updated_at: "2026-03-23T00:00:00.000Z",
  },
  "system-cookie-banner": {
    key: "system-cookie-banner",
    kind: "system",
    slug: "banner-cookies",
    title: "Cookies y preferencias del sitio",
    summary:
      "Usamos cookies tecnicas para que la web funcione y una preferencia local para recordar tu decision.",
    body_markdown:
      "Puedes aceptar o rechazar las cookies no esenciales. Si continuas, seguiremos usando solo las necesarias para sesion, carrito y funcionamiento basico.",
    cta_label: "Ver politica de cookies",
    cta_href: "/cookies",
    seo_title: "Banner de cookies | Nova Forza",
    seo_description: "Texto operativo del banner de cookies del sitio de Nova Forza.",
    is_published: true,
    updated_at: "2026-03-23T00:00:00.000Z",
  },
  "system-error-generic": {
    key: "system-error-generic",
    kind: "system",
    slug: "error-general",
    title: "Algo no ha salido como esperabamos",
    summary:
      "La pagina ha encontrado un problema temporal y estamos trabajando para estabilizarla.",
    body_markdown:
      "Puedes reintentar en unos segundos o volver al inicio para seguir navegando sin perder el contexto principal.",
    cta_label: "Volver al inicio",
    cta_href: "/",
    seo_title: "Error general del sitio | Nova Forza",
    seo_description: "Copia generica para incidencias temporales del sitio publico.",
    is_published: true,
    updated_at: "2026-03-23T00:00:00.000Z",
  },
  "system-error-catalog": {
    key: "system-error-catalog",
    kind: "system",
    slug: "error-catalogo",
    title: "No pudimos cargar la tienda",
    summary: "El catalogo no esta disponible en este momento.",
    body_markdown:
      "La tienda funciona con el catalogo operativo conectado. Reintenta en unos instantes o vuelve al inicio mientras el servicio se recupera.",
    cta_label: "Volver al inicio",
    cta_href: "/",
    seo_title: "Error de catalogo | Nova Forza",
    seo_description:
      "Copia generica para el estado de error de la tienda y del catalogo.",
    is_published: true,
    updated_at: "2026-03-23T00:00:00.000Z",
  },
  "system-error-not-found": {
    key: "system-error-not-found",
    kind: "system",
    slug: "error-no-encontrado",
    title: "No encontramos esa pagina",
    summary: "La ruta que buscas ya no existe o nunca estuvo disponible.",
    body_markdown:
      "Vuelve al inicio, revisa la tienda o usa el menu principal para seguir navegando.",
    cta_label: "Ir al inicio",
    cta_href: "/",
    seo_title: "Pagina no encontrada | Nova Forza",
    seo_description: "Copia generica para estados 404 en la web publica.",
    is_published: true,
    updated_at: "2026-03-23T00:00:00.000Z",
  },
  "system-error-access": {
    key: "system-error-access",
    kind: "system",
    slug: "error-acceso",
    title: "Acceso restringido",
    summary:
      "No tienes permisos para ver este contenido o la sesion requerida ya no es valida.",
    body_markdown:
      "Si crees que esto es un error, vuelve a iniciar sesion o contacta con el gimnasio para recibir ayuda.",
    cta_label: "Ir a acceso",
    cta_href: "/acceso",
    seo_title: "Acceso restringido | Nova Forza",
    seo_description:
      "Copia generica para estados de acceso no autorizado o restringido.",
    is_published: true,
    updated_at: "2026-03-23T00:00:00.000Z",
  },
};

export const defaultCmsDocumentList = cmsDocumentKeys.map((key) => defaultCmsDocuments[key]);

export function getDefaultCmsDocument(key: CmsDocumentKey): DBCmsDocument {
  return defaultCmsDocuments[key];
}
