create table if not exists public.marketing_testimonials (
  id uuid primary key default gen_random_uuid(),
  site_settings_id integer not null default 1 references public.site_settings (id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles (id) on delete cascade,
  supabase_user_id uuid not null unique,
  quote text not null,
  rating integer not null check (rating between 1 and 5),
  author_name text not null,
  author_detail text not null,
  author_initials text not null,
  moderation_status text not null default 'pending' check (
    moderation_status in ('pending', 'approved', 'rejected')
  ),
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketing_testimonials_site_status_idx
  on public.marketing_testimonials (site_settings_id, moderation_status, approved_at desc, updated_at desc);

alter table public.marketing_testimonials enable row level security;

drop policy if exists "marketing_testimonials public read approved" on public.marketing_testimonials;
create policy "marketing_testimonials public read approved"
on public.marketing_testimonials
for select
using (moderation_status = 'approved');

drop policy if exists "marketing_testimonials member read own" on public.marketing_testimonials;
create policy "marketing_testimonials member read own"
on public.marketing_testimonials
for select
to authenticated
using (auth.uid() = supabase_user_id);

drop policy if exists "marketing_testimonials member insert own" on public.marketing_testimonials;
create policy "marketing_testimonials member insert own"
on public.marketing_testimonials
for insert
to authenticated
with check (auth.uid() = supabase_user_id);

drop policy if exists "marketing_testimonials member update own" on public.marketing_testimonials;
create policy "marketing_testimonials member update own"
on public.marketing_testimonials
for update
to authenticated
using (auth.uid() = supabase_user_id)
with check (auth.uid() = supabase_user_id);
