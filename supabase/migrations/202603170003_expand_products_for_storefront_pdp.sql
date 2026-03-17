alter table public.products
  add column if not exists eyebrow text,
  add column if not exists compare_price numeric(10, 2),
  add column if not exists discount_label text,
  add column if not exists pickup_summary text,
  add column if not exists pickup_eta text,
  add column if not exists benefits text[] not null default '{}',
  add column if not exists usage_steps text[] not null default '{}',
  add column if not exists specifications jsonb not null default '[]'::jsonb;

update public.products
set
  eyebrow = 'Base de rendimiento',
  pickup_summary = 'Recogida en Nova Forza Gym',
  pickup_eta = 'Tu bote estara listo en recepcion en menos de 24 horas laborables.',
  benefits = array[
    'Mejora la potencia en esfuerzos repetidos.',
    'Ayuda a sostener fases de fuerza e hipertrofia.',
    'Formato simple y facil de integrar a diario.'
  ],
  usage_steps = array[
    'Mezcla una toma diaria con agua o batido.',
    'Tomala de forma constante para notar mejores resultados.'
  ],
  specifications = jsonb_build_array(
    jsonb_build_object('label', 'Peso neto', 'value', '300 g'),
    jsonb_build_object('label', 'Servicios', 'value', '60 aprox.'),
    jsonb_build_object('label', 'Formato', 'value', 'Monohidratada micronizada')
  )
where slug = 'creatina-monohidratada-300g';

update public.products
set
  name = 'Nova Forza Isolate Whey Protein',
  eyebrow = 'Suplemento de elite',
  description = 'Maximiza tu recuperacion con nuestra formula de rapida absorcion. Disenada para atletas que buscan pureza absoluta: 25 g de proteina, 0 g de azucar y un perfil completo de aminoacidos para alimentar tu fuerza.',
  price = 49.99,
  compare_price = 58.99,
  discount_label = 'Ahorra 15%',
  pickup_summary = 'Recogida en Nova Forza Gym',
  pickup_eta = 'Tu producto estara listo en recepcion en menos de 24 horas laborables. Presenta tu email de confirmacion.',
  images = array[
    '/images/products/product-1.png',
    '/images/products/product-2.png',
    '/images/products/product-6.png',
    '/images/products/product-4.png'
  ],
  highlights = array[
    '25 g de proteina por servicio.',
    '0 g de azucar y digestion comoda.',
    'Perfil premium para volumen o definicion.'
  ],
  benefits = array[
    'Sintesis muscular acelerada.',
    'Pureza del 90% de proteina aislada.',
    'Facil digestion sin hinchazon.'
  ],
  usage_steps = array[
    'Mezcla un servicio (30 g) con 250 ml de agua o leche fria.',
    'Agitar durante 30 segundos. Consumir preferiblemente despues del entrenamiento o entre comidas para mantener el anabolismo.'
  ],
  specifications = jsonb_build_array(
    jsonb_build_object('label', 'Peso neto', 'value', '2 kg / 4.4 lbs'),
    jsonb_build_object('label', 'Servicios', 'value', '66 aprox.'),
    jsonb_build_object('label', 'Origen', 'value', 'Suiza')
  ),
  cta_label = 'Reservar para recogida'
where slug = 'whey-protein-isolate-2kg';

update public.products
set
  pickup_summary = 'Proxima reposicion',
  pickup_eta = 'Consulta en recepcion para reservar talla en la siguiente tirada.'
where slug = 'polo-tecnico-nova-forza';
