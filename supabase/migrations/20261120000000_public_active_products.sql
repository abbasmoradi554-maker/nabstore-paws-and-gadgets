-- Extend the existing NABSTORE products table without replacing user-created data.
-- The initial table may already have been created manually, so every addition is idempotent.
alter table public.products
  add column if not exists subcategory text,
  add column if not exists specs jsonb not null default '[]'::jsonb,
  add column if not exists options jsonb not null default '[]'::jsonb,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists added_order integer not null default 0;

-- Public visitors may read active catalog entries only. Writes remain server-admin-only.
alter table public.products enable row level security;

revoke insert, update, delete, truncate, references, trigger
  on table public.products from anon, authenticated;

grant select on table public.products to anon, authenticated;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products
  for select
  to anon, authenticated
  using (active = true);
