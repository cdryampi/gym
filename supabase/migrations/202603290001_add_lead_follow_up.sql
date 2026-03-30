alter table public.leads
  add column if not exists contacted_at timestamptz,
  add column if not exists channel text,
  add column if not exists outcome text,
  add column if not exists next_step text;

update public.leads
set contacted_at = created_at
where contacted_at is null
  and status in ('contacted', 'closed');
