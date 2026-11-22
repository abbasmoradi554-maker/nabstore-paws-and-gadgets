create table if not exists public.store_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.store_content enable row level security;
grant select on public.store_content to anon, authenticated;
grant insert, update, delete on public.store_content to authenticated;

drop policy if exists "Public can read store content" on public.store_content;
create policy "Public can read store content" on public.store_content
for select to anon, authenticated using (true);

drop policy if exists "Store admin can manage content" on public.store_content;
create policy "Store admin can manage content" on public.store_content
for all to authenticated
using ((select auth.jwt() ->> 'email') = 'abbasmoradi554@gmail.com')
with check ((select auth.jwt() ->> 'email') = 'abbasmoradi554@gmail.com');

insert into public.store_content (key, value) values
('store', '{"phone":"[PHONE]","email":"[EMAIL]","address":"[ADDRESS]","instagram":"[INSTAGRAM]","telegram":"[TELEGRAM]","whatsapp":""}'::jsonb),
('home', '{"heroEyebrow":{"fa":"مجموعه جدید فصل","en":"New season collection"},"heroTitle":{"fa":"آسایش هوشمند برای همراهان کوچک شما","en":"Smart comfort for your little companions"},"heroText":{"fa":"قاب و لوازم جانبی گوشی، محصولات گربه و سگ و گجت‌های کاربردی — با قیمت‌هایی منصفانه.","en":"Phone cases and accessories, cat & dog essentials and handy gadgets — at fair prices."},"heroCta":{"fa":"خرید کنید","en":"Shop now"},"heroCta2":{"fa":"ترندهای روز","en":"See what is trending"},"promoTechTitle":{"fa":"گجت‌های ترند","en":"Trending gadgets"},"promoTechText":{"fa":"تکنولوژی کاربردی برای زندگی روزمره","en":"Useful tech for everyday life"},"promoPhoneTitle":{"fa":"قاب گوشی و لوازم جانبی","en":"Phone cases & accessories"},"promoPhoneText":{"fa":"قاب، گلس، محافظ لنز و هولدر","en":"Cases, screen guards, lens protectors and holders"},"announcement":{"fa":"محصولات نمونه‌اند — قیمت و موجودی نهایی پس از ثبت سفارش توسط پشتیبانی با شما هماهنگ می‌شود.","en":"Sample products — support confirms final price and availability after ordering."}}'::jsonb),
('footer', '{"about":{"fa":"ناب استور؛ فروشگاه آنلاین قاب و لوازم جانبی گوشی، محصولات گربه و سگ و گجت‌های ترند.","en":"NABSTORE — an online store for phone accessories, cat & dog products and trending gadgets."},"followUs":{"fa":"ما را دنبال کنید","en":"Follow us"},"rights":{"fa":"تمامی حقوق برای ناب استور محفوظ است.","en":"All rights reserved."}}'::jsonb),
('pages', '{}'::jsonb),
('faq', '[{"q":{"fa":"محصولات سایت واقعی هستند؟","en":"Are the products real?"},"a":{"fa":"فروشگاه در حال راه‌اندازی است و محصولات و قیمت‌های فعلی نمونه‌اند. قیمت و موجودی نهایی هنگام تأیید سفارش اعلام می‌شود.","en":"The store is launching and current products and prices are samples. Final price and availability are confirmed with your order."}},{"q":{"fa":"پرداخت چگونه انجام می‌شود؟","en":"How do I pay?"},"a":{"fa":"پرداخت پس از تأیید سفارش توسط پشتیبانی هماهنگ می‌شود. در حال حاضر پرداخت آنلاین در سایت فعال نیست.","en":"Payment is arranged by support after your order is confirmed. Online payment is not active yet."}},{"q":{"fa":"هزینه ارسال چقدر است؟","en":"How much is shipping?"},"a":{"fa":"هزینه ارسال به شهر مقصد بستگی دارد و هنگام تأیید سفارش اعلام می‌شود.","en":"It depends on your city and is confirmed with your order."}},{"q":{"fa":"امکان بازگشت کالا وجود دارد؟","en":"Can I return an item?"},"a":{"fa":"بله، طبق رویه بازگشت کالای فروشگاه.","en":"Yes, under the store returns policy."}},{"q":{"fa":"چطور سفارشم را پیگیری کنم؟","en":"How do I track my order?"},"a":{"fa":"با شماره سفارش از طریق راه‌های ارتباطی صفحه تماس با ما پیگیری کنید.","en":"Contact support with your order number using the details on the Contact page."}}]'::jsonb)
on conflict (key) do nothing;
