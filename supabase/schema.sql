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
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  updated_at timestamptz not null default now()
);

create index if not exists orders_phone_idx on public.orders (phone);
create index if not exists orders_confirm_idx on public.orders (confirm);

alter table public.orders enable row level security;
