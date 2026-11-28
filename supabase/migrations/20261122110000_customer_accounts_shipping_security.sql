begin;

alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists shipping_toman bigint not null default 59000;

update public.orders set shipping_toman = 0 where created_at < now();

create index if not exists orders_user_created_at_idx
  on public.orders (user_id, created_at desc)
  where user_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_shipping_nonnegative'
  ) then
    alter table public.orders
      add constraint orders_shipping_nonnegative check (shipping_toman >= 0);
  end if;
end $$;

insert into public.store_content(key, value)
values ('shipping', '{"flatFeeToman":59000,"freeAboveToman":2000000,"enabled":true}'::jsonb)
on conflict (key) do nothing;

drop function if exists public.place_order_with_rate_limit(text,text,text,text,text,text,text,text,jsonb,bigint);

create or replace function public.place_order_with_rate_limit(
  p_order_code text,
  p_customer_name text,
  p_mobile text,
  p_province text,
  p_city text,
  p_address text,
  p_postal_code text,
  p_notes text,
  p_items jsonb,
  p_total_toman bigint,
  p_shipping_toman bigint,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_last_hour bigint;
  v_last_day bigint;
  v_product record;
  v_updated integer;
begin
  if p_shipping_toman < 0 or p_total_toman < p_shipping_toman then
    raise exception using errcode = 'P0001', message = 'invalid_order_total';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_mobile, 0));

  select count(*) into v_last_hour from public.orders
  where mobile = p_mobile and created_at >= v_now - interval '1 hour';
  select count(*) into v_last_day from public.orders
  where mobile = p_mobile and created_at >= v_now - interval '24 hours';

  if v_last_hour >= 3 or v_last_day >= 10 then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  for v_product in
    select item.value->>'id' as product_id,
           sum((item.value->>'qty')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as item(value)
    group by item.value->>'id'
    order by item.value->>'id'
  loop
    update public.products
    set stock_quantity = case when stock_quantity is null then null else stock_quantity - v_product.quantity end,
        updated_at = now()
    where id = v_product.product_id and active = true
      and (stock_quantity is null or stock_quantity >= v_product.quantity);

    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      if exists (select 1 from public.products where id = v_product.product_id and active = true) then
        raise exception using errcode = 'P0001', message = 'insufficient_stock';
      else
        raise exception using errcode = 'P0001', message = 'product_not_available';
      end if;
    end if;
  end loop;

  insert into public.orders(
    order_code, customer_name, mobile, province, city, address,
    postal_code, notes, items, total_toman, shipping_toman, user_id
  )
  values (
    p_order_code, p_customer_name, p_mobile, p_province, p_city, p_address,
    p_postal_code, coalesce(p_notes, ''), p_items, p_total_toman, p_shipping_toman, p_user_id
  );

  return jsonb_build_object('order_code', p_order_code);
end;
$function$;

revoke all on function public.place_order_with_rate_limit(text,text,text,text,text,text,text,text,jsonb,bigint,bigint,uuid) from public, anon, authenticated;
grant execute on function public.place_order_with_rate_limit(text,text,text,text,text,text,text,text,jsonb,bigint,bigint,uuid) to service_role;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.order_claim_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0
);
revoke all on private.order_claim_attempts from public, anon, authenticated;

create or replace function public.claim_order_for_customer(p_order_code text, p_mobile text)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_attempts integer;
  v_claimed integer;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if p_order_code is null or p_order_code !~ '^NB-[A-Z0-9-]{6,24}$'
     or p_mobile is null or p_mobile !~ '^09[0-9]{9}$' then
    raise exception using errcode = 'P0001', message = 'invalid_claim_details';
  end if;

  insert into private.order_claim_attempts(user_id, window_started_at, attempts)
  values (v_user_id, now(), 1)
  on conflict (user_id) do update
    set attempts = case when private.order_claim_attempts.window_started_at < now() - interval '15 minutes'
      then 1 else private.order_claim_attempts.attempts + 1 end,
    window_started_at = case when private.order_claim_attempts.window_started_at < now() - interval '15 minutes'
      then now() else private.order_claim_attempts.window_started_at end
  returning attempts into v_attempts;

  if v_attempts > 5 then
    raise exception using errcode = 'P0001', message = 'claim_rate_limited';
  end if;

  update public.orders set user_id = v_user_id
  where order_code = upper(p_order_code) and mobile = p_mobile and user_id is null;
  get diagnostics v_claimed = row_count;
  if v_claimed = 1 then return true; end if;

  return exists (
    select 1 from public.orders
    where order_code = upper(p_order_code) and mobile = p_mobile and user_id = v_user_id
  );
end;
$function$;

revoke all on function public.claim_order_for_customer(text,text) from public, anon;
grant execute on function public.claim_order_for_customer(text,text) to authenticated;

drop policy if exists "Customers can read their own orders" on public.orders;
create policy "Customers can read their own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);

commit;