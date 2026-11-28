-- Product catalog managed by the authenticated server-side admin only.
create table if not exists public.products (
  id text primary key,
  name jsonb not null,
  price bigint not null check (price >= 0),
  old_price bigint check (old_price is null or old_price >= 0),
  category text not null,
  short jsonb not null default '{"fa":"","en":""}'::jsonb,
  description jsonb not null default '{"fa":"","en":""}'::jsonb,
  images jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
revoke all on table public.products from anon, authenticated;
