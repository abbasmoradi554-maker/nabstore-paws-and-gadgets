drop policy if exists "Store admin can manage content" on public.store_content;
create policy "Store admin can insert content" on public.store_content
for insert to authenticated
with check (((select auth.jwt()) ->> 'email') = 'abbasmoradi554@gmail.com');

create policy "Store admin can update content" on public.store_content
for update to authenticated
using (((select auth.jwt()) ->> 'email') = 'abbasmoradi554@gmail.com')
with check (((select auth.jwt()) ->> 'email') = 'abbasmoradi554@gmail.com');

create policy "Store admin can delete content" on public.store_content
for delete to authenticated
using (((select auth.jwt()) ->> 'email') = 'abbasmoradi554@gmail.com');
