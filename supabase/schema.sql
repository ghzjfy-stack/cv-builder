-- QuickCV orders — run once in the Supabase SQL editor.
-- Service role key (server only) bypasses RLS; do not expose it to the browser.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  phone text not null default '',
  name text not null default '',
  order_date timestamptz not null default now(),
  exp_date timestamptz not null,
  confirm text not null default 'no' check (confirm in ('yes', 'no')),
  status text not null default 'pending',
  updated_at timestamptz not null default now()
);

create index if not exists orders_phone_idx on public.orders (phone);
create index if not exists orders_confirm_idx on public.orders (confirm);
create index if not exists orders_order_id_idx on public.orders (order_id);

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'approved', 'rejected', 'paid', 'confirmed'));

alter table public.orders enable row level security;

-- Checkout polling: public may read status by order_id, not phone/name.
revoke all on table public.orders from anon, authenticated;
grant select (order_id, status, confirm, exp_date) on table public.orders to anon, authenticated;
grant all on table public.orders to service_role;

drop policy if exists orders_public_read_status on public.orders;
create policy orders_public_read_status
on public.orders
for select
to anon, authenticated
using (true);

create or replace view public.order_status
  with (security_invoker = true)
as
  select order_id, status, confirm, exp_date
  from public.orders;

grant select on public.order_status to anon, authenticated, service_role;
