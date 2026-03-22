create table if not exists public.member_commerce_customers (
  supabase_user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  medusa_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_commerce_customers enable row level security;

create policy "Los miembros pueden ver su propia vinculacion commerce"
  on public.member_commerce_customers
  for select
  using (auth.uid() = supabase_user_id);

create index if not exists member_commerce_customers_email_idx
  on public.member_commerce_customers(email);

drop trigger if exists set_member_commerce_customers_updated_at on public.member_commerce_customers;

create trigger set_member_commerce_customers_updated_at
  before update on public.member_commerce_customers
  for each row
  execute function public.handle_updated_at();
