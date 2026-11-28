-- Record whether each order line actually reserved finite stock at checkout time.
-- This prevents later inventory setup from creating phantom stock on cancellation.
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
  v_order_items jsonb;
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

  select coalesce(
    jsonb_agg(item.value || jsonb_build_object('stock_reserved', product.stock_quantity is not null)),
    '[]'::jsonb
  )
  into v_order_items
  from jsonb_array_elements(p_items) as item(value)
  join public.products product on product.id = item.value->>'id';

  if jsonb_array_length(v_order_items) <> jsonb_array_length(p_items) then
    raise exception using errcode = 'P0001', message = 'product_not_available';
  end if;

  insert into public.orders(
    order_code, customer_name, mobile, province, city, address,
    postal_code, notes, items, total_toman, shipping_toman, user_id
  )
  values (
    p_order_code, p_customer_name, p_mobile, p_province, p_city, p_address,
    p_postal_code, coalesce(p_notes, ''), v_order_items, p_total_toman, p_shipping_toman, p_user_id
  );

  return jsonb_build_object('order_code', p_order_code);
end;
$function$;

create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status text
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_order record;
  v_item record;
  v_updated integer;
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'abbasmoradi554@gmail.com' then
    raise exception using errcode = '42501', message = 'admin_forbidden';
  end if;

  if p_status not in ('pending_review', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') then
    raise exception using errcode = '22023', message = 'invalid_order_status';
  end if;

  select id, status, items into v_order
  from public.orders where id = p_order_id for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'order_not_found';
  end if;

  if v_order.status is distinct from p_status then
    if jsonb_typeof(v_order.items) <> 'array' then
      raise exception using errcode = '22023', message = 'invalid_order_items';
    end if;

    if v_order.status <> 'cancelled' and p_status = 'cancelled' then
      for v_item in
        select value ->> 'id' as product_id,
               sum((value ->> 'qty')::integer)::integer as quantity
        from jsonb_array_elements(v_order.items)
        where coalesce((value ->> 'stock_reserved')::boolean, false)
        group by value ->> 'id' order by value ->> 'id'
      loop
        if v_item.product_id is null or v_item.quantity is null or v_item.quantity < 1 then
          raise exception using errcode = '22023', message = 'invalid_order_items';
        end if;
        perform 1 from public.products where id = v_item.product_id for update;
        if not found then
          raise exception using errcode = 'P0001', message = 'order_product_missing';
        end if;
        update public.products
        set stock_quantity = case when stock_quantity is null then null else stock_quantity + v_item.quantity end,
            updated_at = now()
        where id = v_item.product_id;
      end loop;

    elsif v_order.status = 'cancelled' and p_status <> 'cancelled' then
      for v_item in
        select value ->> 'id' as product_id,
               sum((value ->> 'qty')::integer)::integer as quantity
        from jsonb_array_elements(v_order.items)
        where coalesce((value ->> 'stock_reserved')::boolean, false)
        group by value ->> 'id' order by value ->> 'id'
      loop
        if v_item.product_id is null or v_item.quantity is null or v_item.quantity < 1 then
          raise exception using errcode = '22023', message = 'invalid_order_items';
        end if;
        update public.products
        set stock_quantity = case when stock_quantity is null then null else stock_quantity - v_item.quantity end,
            updated_at = now()
        where id = v_item.product_id and active = true
          and (stock_quantity is null or stock_quantity >= v_item.quantity);
        get diagnostics v_updated = row_count;
        if v_updated = 0 then
          if exists (select 1 from public.products where id = v_item.product_id and active = true) then
            raise exception using errcode = 'P0001', message = 'insufficient_stock';
          else
            raise exception using errcode = 'P0001', message = 'product_not_available';
          end if;
        end if;
      end loop;
    end if;
  end if;

  update public.orders set status = p_status where id = p_order_id;
  return jsonb_build_object('id', p_order_id, 'status', p_status);
end;
$$;

revoke all on function public.admin_update_order_status(uuid, text) from public;
revoke all on function public.admin_update_order_status(uuid, text) from anon;
grant execute on function public.admin_update_order_status(uuid, text) to authenticated;
