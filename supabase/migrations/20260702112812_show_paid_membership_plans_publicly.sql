drop policy if exists public_can_read_active_featured_membership_plans on public.membership_plans;
drop policy if exists public_can_read_active_paid_membership_plans on public.membership_plans;

create policy public_can_read_active_paid_membership_plans
  on public.membership_plans
  for select
  using (is_active = true and price_amount > 0);

create index if not exists membership_plans_public_paid_sort_idx
  on public.membership_plans(is_active, price_amount, sort_order, created_at desc);
