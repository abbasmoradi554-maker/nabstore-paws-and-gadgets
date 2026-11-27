-- Keep finite inventory consistent when an administrator cancels or reopens an order.
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
