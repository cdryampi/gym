create table if not exists public.store_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.store_categories(id) on delete restrict,
  slug text not null unique,
  name text not null,
  description text,
  medusa_category_id text,
  "order" integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.store_categories enable row level security;

create policy "Allow public read-only access to active store categories"
  on public.store_categories
  for select
  using (active = true);

create index if not exists store_categories_parent_idx on public.store_categories(parent_id);
create index if not exists store_categories_active_idx on public.store_categories(active);
create index if not exists store_categories_order_idx on public.store_categories("order");

drop trigger if exists set_store_categories_updated_at on public.store_categories;

create trigger set_store_categories_updated_at
  before update on public.store_categories
  for each row
  execute function public.handle_updated_at();

alter table public.products
  add column if not exists category_id uuid references public.store_categories(id) on delete set null,
  add column if not exists medusa_product_id text;

create index if not exists products_category_id_idx on public.products(category_id);
