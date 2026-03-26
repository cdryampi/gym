create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'lead_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.lead_status as enum ('new', 'contacted', 'closed');
  end if;
end $$;

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  site_name text not null,
  site_tagline text not null,
  hero_badge text not null,
  hero_title text not null,
  hero_description text not null,
  hero_primary_cta text not null,
  hero_secondary_cta text not null,
  hero_video_url text,
  topbar_enabled boolean not null default false,
  topbar_variant text not null default 'announcement' check (topbar_variant in ('announcement', 'promotion', 'notice')),
  topbar_text text,
  topbar_cta_label text,
  topbar_cta_url text,
  topbar_expires_at timestamptz,
  hero_highlight_one text not null,
  hero_highlight_two text not null,
  hero_highlight_three text not null,
  contact_email text not null,
  notification_email text not null,
  transactional_from_email text not null,
  contact_phone text,
  whatsapp_url text,
  address text,
  opening_hours text,
  seo_title text not null,
  seo_description text not null,
  seo_keywords text[] not null default '{}',
  seo_canonical_url text,
  seo_og_image_url text,
  footer_text text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  source text not null default 'website',
  status public.lead_status not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.site_settings enable row level security;
alter table public.leads enable row level security;

drop policy if exists "site_settings public read" on public.site_settings;
create policy "site_settings public read"
on public.site_settings
for select
using (true);

drop policy if exists "site_settings auth manage" on public.site_settings;
create policy "site_settings auth manage"
on public.site_settings
for all
to authenticated
using (true)
with check (true);

drop policy if exists "leads public insert" on public.leads;
create policy "leads public insert"
on public.leads
for insert
to anon, authenticated
with check (true);

drop policy if exists "leads auth read" on public.leads;
create policy "leads auth read"
on public.leads
for select
to authenticated
using (true);

drop policy if exists "leads auth update" on public.leads;
create policy "leads auth update"
on public.leads
for update
to authenticated
using (true)
with check (true);

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
