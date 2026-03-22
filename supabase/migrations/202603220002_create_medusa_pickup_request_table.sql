create table if not exists public.pickup_request (
  id text primary key,
  request_number text not null unique,
  cart_id text not null unique,
  customer_id text,
  supabase_user_id text,
  email text not null,
  notes text,
  status text not null default 'requested' check (
    status in ('requested', 'confirmed', 'ready_for_pickup', 'fulfilled', 'cancelled')
  ),
  currency_code text not null,
  item_count integer not null default 0,
  subtotal double precision not null default 0,
  total double precision not null default 0,
  line_items_snapshot jsonb not null default '[]'::jsonb,
  source text not null default 'gym-storefront',
  email_status text not null default 'pending' check (
    email_status in ('pending', 'sent', 'failed')
  ),
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists pickup_request_status_idx on public.pickup_request (status);
create index if not exists pickup_request_email_idx on public.pickup_request (email);
create index if not exists pickup_request_created_at_idx on public.pickup_request (created_at desc);
