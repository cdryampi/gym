-- Migración: Auditoría de Importaciones de Socios desde CSV
-- Nova Forza Gym - Member Importer Feature

create table if not exists public.member_import_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  created_by_user_id text, -- Firebase UID of the staff user who ran it
  created_by_email text, -- Email of the staff user
  file_name text not null,
  file_sha256 text,
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null default 'pending', -- 'pending', 'processing', 'completed', 'failed'
  errors jsonb -- Any batch level errors/exceptions
);

create table if not exists public.member_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.member_import_batches(id) on delete cascade,
  row_number integer not null,
  email text,
  status text not null, -- 'created', 'updated', 'skipped', 'failed'
  errors jsonb, -- JSON array of error messages
  warnings jsonb, -- JSON array of warning messages
  firebase_uid text,
  member_profile_id uuid,
  membership_request_id uuid,
  raw_row jsonb not null
);

-- Habilitar RLS
alter table public.member_import_batches enable row level security;
alter table public.member_import_rows enable row level security;

-- Crear políticas para lectura del staff
drop policy if exists "Staff can read batches" on public.member_import_batches;
create policy "Staff can read batches" on public.member_import_batches
  for select using (public.is_staff());

drop policy if exists "Staff can read rows" on public.member_import_rows;
create policy "Staff can read rows" on public.member_import_rows
  for select using (public.is_staff());

-- Índices para optimización
create index if not exists member_import_batches_created_at_idx
  on public.member_import_batches(created_at desc);

create index if not exists member_import_rows_batch_row_idx
  on public.member_import_rows(batch_id, row_number);
