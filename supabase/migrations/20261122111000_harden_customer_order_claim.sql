begin;
drop function if exists public.claim_order_for_customer(text,text);

create or replace function public.record_order_claim_attempt(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, private, pg_temp
as $function$
declare v_attempts integer;
begin
  if p_user_id is null then raise exception using errcode = '22023', message = 'invalid_user'; end if;
  insert into private.order_claim_attempts(user_id,window_started_at,attempts)
  values(p_user_id,now(),1)
  on conflict(user_id) do update
    set attempts=case when private.order_claim_attempts.window_started_at < now()-interval '15 minutes'
      then 1 else private.order_claim_attempts.attempts+1 end,
    window_started_at=case when private.order_claim_attempts.window_started_at < now()-interval '15 minutes'
      then now() else private.order_claim_attempts.window_started_at end
  returning attempts into v_attempts;
  return v_attempts <= 5;
end;
$function$;

revoke all on function public.record_order_claim_attempt(uuid) from public,anon,authenticated;
grant execute on function public.record_order_claim_attempt(uuid) to service_role;

drop policy if exists "NABSTORE admin can read orders" on public.orders;
drop policy if exists "Customers can read their own orders" on public.orders;
drop policy if exists "Orders readable by owner or store admin" on public.orders;
create policy "Orders readable by owner or store admin"
  on public.orders for select to authenticated
  using (
    (select auth.uid()) = user_id
    or lower(coalesce((select auth.jwt()) ->> 'email','')) = 'abbasmoradi554@gmail.com'
  );
commit;