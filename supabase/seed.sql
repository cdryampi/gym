insert into public.site_settings (
  id,
  site_name,
  site_tagline,
  hero_badge,
  hero_title,
  hero_description,
  hero_primary_cta,
  hero_secondary_cta,
  hero_video_url,
  topbar_enabled,
  topbar_variant,
  topbar_text,
  topbar_cta_label,
  topbar_cta_url,
  topbar_expires_at,
  hero_highlight_one,
  hero_highlight_two,
  hero_highlight_three,
  contact_email,
  notification_email,
  transactional_from_email,
  contact_phone,
  whatsapp_url,
  address,
  opening_hours,
  seo_title,
  seo_description,
  seo_keywords,
  seo_canonical_url,
  seo_og_image_url,
  footer_text,
  updated_at
)
values (
  1,
  'Nova Forza',
  'Fuerza, disciplina y progreso real para quienes entrenan en serio.',
  'Entrenamiento premium en Lima',
  'El poder de tu progreso comienza aqui',
  'Entrenamiento de fuerza de elite con asesoria personalizada en un ambiente disenado para resultados reales en Lima.',
  'Reserva tu prueba',
  'Ver planes',
  '/video/video.mp4',
  true,
  'promotion',
  'Matricula gratis por tiempo limitado para nuevos socios.',
  'Reserva tu prueba',
  '#contacto',
  timezone('utc', now()) + interval '30 day',
  'Planes claros para empezar, progresar y sostener resultados.',
  'Entrenadores que corrigen, acompanan y hacen seguimiento real.',
  'Sala premium local con horarios amplios y recogida en tienda.',
  'hola@novaforza.pe',
  'pedidos@novaforza.pe',
  'pedidos@novaforza.pe',
  '+51 987 654 321',
  'https://wa.me/51987654321',
  'Av. Progreso 245, zona comercial local',
  'Lunes a viernes de 6:00 a 22:00. Sabados de 8:00 a 14:00.',
  'Nova Forza | Gimnasio premium de fuerza y progreso real',
  'Web comercial de Nova Forza: planes claros, horarios amplios, asesoria cercana y una experiencia premium para entrenar con seriedad.',
  array['gimnasio premium', 'fuerza', 'planes de gimnasio', 'entrenamiento personalizado', 'nova forza'],
  'https://novaforza.pe',
  null,
  'Nova Forza es un gimnasio local orientado a fuerza, progreso real y una experiencia seria y cercana.',
  timezone('utc', now())
)
on conflict (id) do update set
  site_name = excluded.site_name,
  site_tagline = excluded.site_tagline,
  hero_badge = excluded.hero_badge,
  hero_title = excluded.hero_title,
  hero_description = excluded.hero_description,
  hero_primary_cta = excluded.hero_primary_cta,
  hero_secondary_cta = excluded.hero_secondary_cta,
  hero_video_url = excluded.hero_video_url,
  topbar_enabled = excluded.topbar_enabled,
  topbar_variant = excluded.topbar_variant,
  topbar_text = excluded.topbar_text,
  topbar_cta_label = excluded.topbar_cta_label,
  topbar_cta_url = excluded.topbar_cta_url,
  topbar_expires_at = excluded.topbar_expires_at,
  hero_highlight_one = excluded.hero_highlight_one,
  hero_highlight_two = excluded.hero_highlight_two,
  hero_highlight_three = excluded.hero_highlight_three,
  contact_email = excluded.contact_email,
  notification_email = excluded.notification_email,
  transactional_from_email = excluded.transactional_from_email,
  contact_phone = excluded.contact_phone,
  whatsapp_url = excluded.whatsapp_url,
  address = excluded.address,
  opening_hours = excluded.opening_hours,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  seo_keywords = excluded.seo_keywords,
  seo_canonical_url = excluded.seo_canonical_url,
  seo_og_image_url = excluded.seo_og_image_url,
  footer_text = excluded.footer_text,
  updated_at = excluded.updated_at;

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

insert into public.leads (name, email, phone, message, source, status, metadata)
values
  (
    'Lucia Romero',
    'lucia@example.com',
    '+51 999 112 233',
    'Quiero reservar una prueba y saber que plan me conviene si busco bajar grasa.',
    'seed',
    'new'::public.lead_status,
    '{"demo": true, "interest": "prueba"}'::jsonb
  ),
  (
    'Diego Flores',
    'diego@example.com',
    '+51 988 445 566',
    'Me interesa el plan Progreso para entrenar fuerza antes de ir a trabajar.',
    'seed',
    'contacted'::public.lead_status,
    '{"demo": true, "interest": "plan progreso"}'::jsonb
  ),
  (
    'Paola Rivas',
    'paola@example.com',
    null,
    'Ya hice la visita guiada y quiero volver para cerrar mi inscripcion este fin de semana.',
    'seed',
    'closed'::public.lead_status,
    '{"demo": true, "interest": "inscripcion"}'::jsonb
  );

insert into public.products (
  slug,
  name,
  category,
  short_description,
  description,
  price,
  compare_price,
  discount_label,
  currency,
  stock_status,
  featured,
  pickup_only,
  pickup_note,
  pickup_summary,
  pickup_eta,
  images,
  tags,
  highlights,
  benefits,
  usage_steps,
  specifications,
  eyebrow,
  cta_label,
  "order",
  active
)
values
  (
    'creatina-monohidratada-300g',
    'Creatina Monohidratada 300 g',
    'suplementos',
    'Soporte diario para fuerza, potencia y mejor recuperacion entre sesiones exigentes.',
    'Creatina monohidratada micronizada, facil de disolver y pensada para quien entrena con constancia. Una opcion simple y efectiva para acompanar fases de fuerza, hipertrofia o rendimiento general sin formulas innecesarias.',
    99.90,
    null,
    null,
    'PEN',
    'in_stock',
    true,
    true,
    'Recogida rapida en recepcion durante el horario del club.',
    'Recogida en Nova Forza Gym',
    'Tu bote estara listo en recepcion en menos de 24 horas laborables.',
    array['/images/products/nova-creatina.png'],
    array['Fuerza', 'Recuperacion', 'Uso diario'],
    array['300 g de creatina monohidratada micronizada.', 'Formato comodo para ciclos largos o mantenimiento.', 'Facil de combinar con tu rutina postentrenamiento.'],
    array['Mejora la potencia en esfuerzos repetidos.', 'Ayuda a sostener fases de fuerza e hipertrofia.', 'Formato simple y facil de integrar a diario.'],
    array['Mezcla una toma diaria con agua o batido.', 'Tomala de forma constante para notar mejores resultados.'],
    jsonb_build_array(
      jsonb_build_object('label', 'Peso neto', 'value', '300 g'),
      jsonb_build_object('label', 'Servicios', 'value', '60 aprox.'),
      jsonb_build_object('label', 'Formato', 'value', 'Monohidratada micronizada')
    ),
    'Base de rendimiento',
    'Disponible en tienda',
    1,
    true
  ),
  (
    'whey-protein-isolate-2kg',
    'Nova Forza Isolate Whey Protein',
    'suplementos',
    'Proteina aislada de digestion ligera para cubrir la ingesta diaria sin complicaciones.',
    'Maximiza tu recuperacion con nuestra formula de rapida absorcion. Disenada para atletas que buscan pureza absoluta: 25 g de proteina, 0 g de azucar y un perfil completo de aminoacidos para alimentar tu fuerza.',
    189.90,
    219.90,
    'Ahorra 15%',
    'PEN',
    'low_stock',
    true,
    true,
    'Ultimas unidades disponibles esta semana en el mostrador de Nova Forza.',
    'Recogida en Nova Forza Gym',
    'Tu producto estara listo en recepcion en menos de 24 horas laborables. Presenta tu email de confirmacion.',
    array['/images/products/nova-whey.png'],
    array['Recuperacion', 'Proteina', 'Postentreno'],
    array['25 g de proteina por servicio.', '0 g de azucar y digestion comoda.', 'Perfil premium para volumen o definicion.'],
    array['Sintesis muscular acelerada.', 'Pureza del 90% de proteina aislada.', 'Facil digestion sin hinchazon.'],
    array['Mezcla un servicio (30 g) con 250 ml de agua o leche fria.', 'Agitar durante 30 segundos. Consumir preferiblemente despues del entrenamiento o entre comidas para mantener el anabolismo.'],
    jsonb_build_array(
      jsonb_build_object('label', 'Peso neto', 'value', '2 kg / 4.4 lbs'),
      jsonb_build_object('label', 'Servicios', 'value', '66 aprox.'),
      jsonb_build_object('label', 'Origen', 'value', 'Suiza')
    ),
    'Suplemento de elite',
    'Reservar para recogida',
    2,
    true
  ),
  (
    'shaker-premium-nova-forza',
    'Shaker Premium Nova Forza',
    'accesorios',
    'Shaker robusto de 700 ml con cierre seguro y diseno limpio para el dia a dia.',
    'Un basico bien resuelto para llevar proteina, creatina o bebida isotonica sin fugas ni piezas incomodas. Tiene cuerpo solido, tapa firme y una presencia alineada con la estetica de Nova Forza.',
    59.90,
    null,
    null,
    'PEN',
    'in_stock',
    false,
    true,
    'Disponible para recogida inmediata en el club.',
    null,
    null,
    array['/images/products/nova-shaker.png'],
    array['Hidratacion', 'Entreno', 'Nova Forza'],
    array['Capacidad de 700 ml.', 'Cierre seguro para mochila o taquilla.', 'Acabado limpio y facil de lavar.'],
    array[]::text[],
    array[]::text[],
    '[]'::jsonb,
    null,
    'Disponible en tienda',
    3,
    true
  ),
  (
    'straps-de-levantamiento-pro',
    'Straps de Levantamiento Pro',
    'accesorios',
    'Agarre extra para series pesadas de peso muerto, remos y tirones controlados.',
    'Straps disenados para entrenamientos serios donde el agarre limita antes que la espalda o la cadena posterior. Construccion resistente, ajuste comodo y una sensacion firme para cargas altas.',
    64.90,
    null,
    null,
    'PEN',
    'in_stock',
    true,
    true,
    'Recogelos en recepcion y pruebalo el mismo dia en sala.',
    'Recogida en Nova Forza Gym',
    'Tu par de straps estara listo en recepcion en menos de 24h.',
    array['/images/products/nova-straps.png'],
    array['Fuerza', 'Powerlifting', 'Agarre'],
    array['Tejido resistente con tacto firme.', 'Pensados para tirones pesados y trabajo de espalda.', 'Faciles de guardar en mochila o cinturon.'],
    array[]::text[],
    array[]::text[],
    '[]'::jsonb,
    null,
    'Reservar en local',
    4,
    true
  ),
  (
    'guantes-entrenamiento-nova',
    'Guantes de Entrenamiento Nova',
    'accesorios',
    'Proteccion y agarre superior con materiales transpirables y refuerzo en palma.',
    'Guantes tecnicos para sesiones de alto volumen. Protegen la mano sin sacrificar la movilidad ni el tacto con la barra. Ajuste ergonomico y durabilidad industrial.',
    19.90,
    null,
    null,
    'EUR',
    'in_stock',
    false,
    true,
    'Disponibles en varias tallas en el club.',
    'Recogida en Nova Forza Gym',
    'Puebatelos y llevatelos hoy mismo.',
    array['/images/products/nova-guantes.png'],
    array['Proteccion', 'Entreno', 'Accesorios'],
    array['Material transpirable de alta calidad.', 'Refuerzo acolchado en zonas de mayor presion.', 'Cierre de velcro ajustable.'],
    array[]::text[],
    array[]::text[],
    '[]'::jsonb,
    null,
    'Disponible en tienda',
    5,
    true
  ),
  (
    'polo-tecnico-nova-forza',
    'Polo Tecnico Nova Forza',
    'merchandising',
    'Prenda ligera de corte deportivo con identidad limpia y presencia premium.',
    'Polo tecnico desarrollado para entrenar, moverse por el club o llevar fuera del gimnasio sin caer en una estetica de merch generica. Patronaje comodo, tejido ligero y grafica sobria.',
    120.00,
    null,
    null,
    'PEN',
    'in_stock',
    true,
    true,
    'Disponible en varias tallas.',
    'Recogida en Nova Forza Gym',
    'Recogida inmediata según stock.',
    array['/images/products/nova-polo.png'],
    array['Merch', 'Nova Forza', 'Performance'],
    array['Tejido tecnico ligero.', 'Corte limpio para entreno o uso casual.', 'Disponible en tallas S, M, L y XL.'],
    array[]::text[],
    array[]::text[],
    '[]'::jsonb,
    null,
    'Reservar en local',
    6,
    true
  ),
  (
    'botella-termica-nova',
    'Botella Termica Nova',
    'accesorios',
    'Mantiene la temperatura durante todo el entreno con un diseño industrial elegante.',
    'Botella de acero inoxidable con doble pared. Resistente, sobria y diseñada para durar años. El complemento perfecto para mantenerte hidratado con estilo.',
    22.50,
    null,
    null,
    'EUR',
    'in_stock',
    false,
    true,
    'Recogida en el club.',
    'Recogida en Nova Forza Gym',
    null,
    array['/images/products/nova-botella.png'],
    array['Hidratacion', 'Premium', 'Accesorios'],
    array['Acero inoxidable de grado alimenticio.', 'Aislamiento térmico de larga duración.', 'Acabado negro mate anti-deslizante.'],
    array[]::text[],
    array[]::text[],
    '[]'::jsonb,
    null,
    'Disponible en tienda',
    7,
    true
  ),
  (
    'banda-elastica-tela-nova',
    'Banda Elastica de Tela Nova',
    'accesorios',
    'Resistencia premium sin deslizamientos, ideal para glúteo y pierna.',
    'Banda de resistencia fabricada en tela técnica de alta durabilidad. A diferencia del látex, no se enrolla ni pellizca. Nivel de resistencia medio-alto.',
    49.90,
    null,
    null,
    'PEN',
    'in_stock',
    false,
    true,
    'Ideal para sala.',
    'Recogida en Nova Forza Gym',
    null,
    array['/images/products/nova-banda.png'],
    array['Entrenamiento', 'Pierna', 'Accesorios'],
    array['Tejido suave que no irrita la piel.', 'Agarre interno de silicona antideslizante.', 'Lavable y extremadamente resistente.'],
    array[]::text[],
    array[]::text[],
    '[]'::jsonb,
    null,
    'Disponible en tienda',
    8,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  short_description = excluded.short_description,
  description = excluded.description,
  price = excluded.price,
  compare_price = excluded.compare_price,
  discount_label = excluded.discount_label,
  currency = excluded.currency,
  stock_status = excluded.stock_status,
  featured = excluded.featured,
  pickup_only = excluded.pickup_only,
  pickup_note = excluded.pickup_note,
  pickup_summary = excluded.pickup_summary,
  pickup_eta = excluded.pickup_eta,
  images = excluded.images,
  tags = excluded.tags,
  highlights = excluded.highlights,
  benefits = excluded.benefits,
  usage_steps = excluded.usage_steps,
  specifications = excluded.specifications,
  eyebrow = excluded.eyebrow,
  cta_label = excluded.cta_label,
  "order" = excluded."order",
  active = excluded.active,
  updated_at = timezone('utc', now());

insert into public.store_categories (slug, name, description, parent_id, "order", active)
values
  ('suplementos', 'Suplementos', 'Base principal para nutricion y suplementacion.', null, 1, true),
  ('accesorios', 'Accesorios', 'Apoyos funcionales para entrenamiento y sala.', null, 2, true),
  ('merchandising', 'Merchandising', 'Prendas y objetos con identidad Nova Forza.', null, 3, true),
  (
    'proteinas',
    'Proteinas',
    'Proteinas y aislados pensados para recuperacion y rendimiento.',
    (select id from public.store_categories where slug = 'suplementos'),
    1,
    true
  ),
  (
    'creatinas',
    'Creatinas',
    'Soporte diario para fuerza y potencia.',
    (select id from public.store_categories where slug = 'suplementos'),
    2,
    true
  ),
  (
    'shakers',
    'Shakers',
    'Mezcla y transporte para suplementacion diaria.',
    (select id from public.store_categories where slug = 'accesorios'),
    1,
    true
  ),
  (
    'agarre',
    'Agarre',
    'Accesorios para tirones pesados y proteccion de manos.',
    (select id from public.store_categories where slug = 'accesorios'),
    2,
    true
  ),
  (
    'hidratacion',
    'Hidratacion',
    'Botellas y piezas para entrenar con comodidad.',
    (select id from public.store_categories where slug = 'accesorios'),
    3,
    true
  ),
  (
    'ropa-tecnica',
    'Ropa tecnica',
    'Prendas funcionales con estetica Nova Forza.',
    (select id from public.store_categories where slug = 'merchandising'),
    1,
    true
  ),
  (
    'movilidad',
    'Movilidad',
    'Accesorios para activacion y trabajo complementario.',
    (select id from public.store_categories where slug = 'accesorios'),
    4,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  parent_id = excluded.parent_id,
  "order" = excluded."order",
  active = excluded.active,
  updated_at = timezone('utc', now());

update public.products
set category_id = (select id from public.store_categories where slug = 'creatinas')
where slug = 'creatina-monohidratada-300g';

update public.products
set category_id = (select id from public.store_categories where slug = 'proteinas')
where slug = 'whey-protein-isolate-2kg';

update public.products
set category_id = (select id from public.store_categories where slug = 'shakers')
where slug = 'shaker-premium-nova-forza';

update public.products
set category_id = (select id from public.store_categories where slug = 'agarre')
where slug in ('straps-de-levantamiento-pro', 'guantes-entrenamiento-nova');

update public.products
set category_id = (select id from public.store_categories where slug = 'ropa-tecnica')
where slug = 'polo-tecnico-nova-forza';

update public.products
set category_id = (select id from public.store_categories where slug = 'hidratacion')
where slug = 'botella-termica-nova';

update public.products
set category_id = (select id from public.store_categories where slug = 'movilidad')
where slug = 'banda-elastica-tela-nova';
