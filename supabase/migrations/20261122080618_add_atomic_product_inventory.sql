alter table public.products
  add column if not exists stock_quantity integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_stock_quantity_nonnegative'
  ) then
    alter table public.products
      add constraint products_stock_quantity_nonnegative
      check (stock_quantity is null or stock_quantity >= 0);
  end if;
end $$;

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
  p_total_toman bigint
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
  perform pg_advisory_xact_lock(hashtextextended(p_mobile, 0));

  select count(*) into v_last_hour
  from public.orders
  where mobile = p_mobile and created_at >= v_now - interval '1 hour';

  select count(*) into v_last_day
  from public.orders
  where mobile = p_mobile and created_at >= v_now - interval '24 hours';

  if v_last_hour >= 3 or v_last_day >= 10 then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  -- NULL stock means "not tracked"; zero means sold out.
  for v_product in
    select item.value->>'id' as product_id,
           sum((item.value->>'qty')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as item(value)
    group by item.value->>'id'
    order by item.value->>'id'
  loop
    update public.products
    set stock_quantity = case
      when stock_quantity is null then null
      else stock_quantity - v_product.quantity
    end,
    updated_at = now()
    where id = v_product.product_id
      and active = true
      and (stock_quantity is null or stock_quantity >= v_product.quantity);

    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      if exists (
        select 1 from public.products
        where id = v_product.product_id and active = true
      ) then
        raise exception using errcode = 'P0001', message = 'insufficient_stock';
      else
        raise exception using errcode = 'P0001', message = 'product_not_available';
      end if;
    end if;
  end loop;

  insert into public.orders(
    order_code, customer_name, mobile, province, city, address,
    postal_code, notes, items, total_toman
  )
  values (
    p_order_code, p_customer_name, p_mobile, p_province, p_city, p_address,
    p_postal_code, coalesce(p_notes, ''), p_items, p_total_toman
  );

  return jsonb_build_object('order_code', p_order_code);
end;
$function$;
