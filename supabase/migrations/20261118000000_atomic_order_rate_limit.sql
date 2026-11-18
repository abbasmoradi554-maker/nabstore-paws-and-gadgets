-- Make per-mobile order limits atomic across all Cloudflare Worker instances.
-- The advisory transaction lock serializes submissions for the same mobile number.
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
  p_total_toman integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_last_hour bigint;
  v_last_day bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_mobile, 0));

  select count(*) into v_last_hour
  from public.orders
  where mobile = p_mobile
    and created_at >= v_now - interval '1 hour';

  select count(*) into v_last_day
  from public.orders
  where mobile = p_mobile
    and created_at >= v_now - interval '24 hours';

  if v_last_hour >= 3 or v_last_day >= 10 then
    raise exception using errcode = 'P0001', message = 'rate_limited';
  end if;

  insert into public.orders (
    order_code, customer_name, mobile, province, city, address,
    postal_code, notes, items, total_toman
  ) values (
    p_order_code, p_customer_name, p_mobile, p_province, p_city, p_address,
    p_postal_code, coalesce(p_notes, ''), p_items, p_total_toman
  );

  return jsonb_build_object('order_code', p_order_code);
end;
$$;

revoke all on function public.place_order_with_rate_limit(
  text, text, text, text, text, text, text, text, jsonb, integer
) from public, anon, authenticated;

grant execute on function public.place_order_with_rate_limit(
  text, text, text, text, text, text, text, text, jsonb, integer
) to service_role;
