insert into storage.buckets (id, name, public)
values ('medusa-media', 'medusa-media', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists "Public read routine-assets and product-images" on storage.objects;
drop policy if exists "Admin insert routine-assets and product-images" on storage.objects;
drop policy if exists "Admin update routine-assets and product-images" on storage.objects;

create policy "Public read routine-assets commerce buckets"
  on storage.objects
  for select
  to public
  using (bucket_id in ('routine-assets', 'product-images', 'medusa-media'));

create policy "Admin insert routine-assets commerce buckets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('routine-assets', 'product-images', 'medusa-media')
    and exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  );

create policy "Admin update routine-assets commerce buckets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('routine-assets', 'product-images', 'medusa-media')
    and exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  )
  with check (
    bucket_id in ('routine-assets', 'product-images', 'medusa-media')
    and exists (
      select 1
      from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  );
