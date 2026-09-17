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
grant all on table public.orders to service_role, postgres;

drop policy if exists orders_public_read_status on public.orders;
create policy orders_public_read_status
on public.orders
for select
to anon, authenticated
using (true);

drop policy if exists orders_service_role_all on public.orders;
create policy orders_service_role_all
on public.orders
for all
to service_role
using (true)
with check (true);

create or replace view public.order_status
  with (security_invoker = true)
as
  select order_id, status, confirm, exp_date
  from public.orders;

grant select on public.order_status to anon, authenticated, service_role;

-- Signed Telegram Yes/No confirm. HMAC key lives in private.app_config.
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres, service_role;

create table if not exists private.app_config (
  key text primary key,
  value text not null
);
revoke all on table private.app_config from public, anon, authenticated;

insert into private.app_config (key, value)
values (
  'order_hmac_secret',
  'qc_ord_hmac_v1_7c2e9a4f1b8d0e6c3a5f9d2b7e1c4a08f6d3b9e0c5a2f8d1b4e7c0a3f6d9b2e5'
)
on conflict (key) do update set value = excluded.value;

create or replace function private.confirm_manual_order(
  p_order_id text,
  p_sig text,
  p_approve boolean,
  p_phone text default '',
  p_name text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  secret text;
  normalized text;
  decision text;
  expected text;
  new_status text;
  new_confirm text;
  result_row public.orders%rowtype;
begin
  normalized := upper(trim(coalesce(p_order_id, '')));
  if normalized !~ '^CV-[0-9]{4}$' then
    raise exception 'invalid_order_id' using errcode = '22023';
  end if;

  select c.value into secret
  from private.app_config c
  where c.key = 'order_hmac_secret';

  if secret is null or length(secret) < 16 then
    raise exception 'hmac_not_configured' using errcode = '42501';
  end if;

  decision := case when p_approve then 'yes' else 'no' end;
  expected := encode(
    extensions.hmac(
      convert_to(normalized || ':' || decision, 'UTF8'),
      convert_to(secret, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  if lower(trim(coalesce(p_sig, ''))) is distinct from expected then
    raise exception 'invalid_signature' using errcode = '42501';
  end if;

  new_status := case when p_approve then 'approved' else 'rejected' end;
  new_confirm := decision;

  insert into public.orders (
    order_id, phone, name, order_date, exp_date, confirm, status, updated_at
  )
  values (
    normalized,
    left(coalesce(p_phone, ''), 40),
    left(coalesce(p_name, ''), 120),
    now(),
    now() + interval '30 days',
    new_confirm,
    new_status,
    now()
  )
  on conflict (order_id) do update
    set
      confirm = excluded.confirm,
      status = excluded.status,
      updated_at = now(),
      phone = case when excluded.phone <> '' then excluded.phone else public.orders.phone end,
      name = case when excluded.name <> '' then excluded.name else public.orders.name end,
      exp_date = case
        when p_approve then now() + interval '30 days'
        else public.orders.exp_date
      end
  returning * into result_row;

  return jsonb_build_object(
    'order_id', result_row.order_id,
    'status', result_row.status,
    'confirm', result_row.confirm,
    'exp_date', result_row.exp_date
  );
end;
$$;

create or replace function public.confirm_manual_order(
  p_order_id text,
  p_sig text,
  p_approve boolean,
  p_phone text default '',
  p_name text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return private.confirm_manual_order(p_order_id, p_sig, p_approve, p_phone, p_name);
end;
$$;

revoke all on function private.confirm_manual_order(text, text, boolean, text, text) from public, anon, authenticated;
grant execute on function private.confirm_manual_order(text, text, boolean, text, text) to postgres, service_role;
revoke all on function public.confirm_manual_order(text, text, boolean, text, text) from public;
grant execute on function public.confirm_manual_order(text, text, boolean, text, text) to anon, authenticated, service_role;
