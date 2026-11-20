-- Restrict privileged dashboard access to the configured admin email using user JWT + RLS.
drop policy if exists "NABSTORE admin can manage products" on public.products;
create policy "NABSTORE admin can manage products"
on public.products for all to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'abbasmoradi554@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'abbasmoradi554@gmail.com');

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
revoke insert, update, delete on public.products from anon;

drop policy if exists "NABSTORE admin can read orders" on public.orders;
create policy "NABSTORE admin can read orders"
on public.orders for select to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'abbasmoradi554@gmail.com');

drop policy if exists "NABSTORE admin can update order status" on public.orders;
create policy "NABSTORE admin can update order status"
on public.orders for update to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'abbasmoradi554@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'abbasmoradi554@gmail.com');

grant select on public.orders to authenticated;
revoke update on public.orders from anon, authenticated;
grant update(status) on public.orders to authenticated;
revoke insert, delete on public.orders from anon, authenticated;

drop policy if exists "NABSTORE admin can upload product images" on storage.objects;
create policy "NABSTORE admin can upload product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and lower(coalesce(auth.jwt() ->> 'email', '')) = 'abbasmoradi554@gmail.com'
);
