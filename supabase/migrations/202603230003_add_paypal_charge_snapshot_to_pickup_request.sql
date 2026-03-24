alter table if exists public.pickup_request
  add column if not exists charged_currency_code text,
  add column if not exists charged_total double precision,
  add column if not exists exchange_rate double precision,
  add column if not exists exchange_rate_source text,
  add column if not exists exchange_rate_reference text;
