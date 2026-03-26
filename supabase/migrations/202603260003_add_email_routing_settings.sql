alter table public.site_settings
add column if not exists notification_email text;

alter table public.site_settings
add column if not exists transactional_from_email text;

update public.site_settings
set
  notification_email = coalesce(notification_email, contact_email),
  transactional_from_email = coalesce(transactional_from_email, contact_email)
where id = 1;

alter table public.site_settings
alter column notification_email set not null;

alter table public.site_settings
alter column transactional_from_email set not null;
