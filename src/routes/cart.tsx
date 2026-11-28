import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCatalogProducts } from "@/lib/catalog";
import { CART_MAX_QTY, useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سبد خرید | ناب استور" },
      { name: "description", content: "محصولات انتخاب‌شده شما در ناب استور؛ تغییر تعداد، حذف و ادامه ثبت سفارش." },
      { property: "og:title", content: "سبد خرید ناب استور" },
      { property: "og:description", content: "مشاهده و ویرایش سبد خرید در ناب استور." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, l, price, num } = useI18n();
  const cart = useCart();
  const catalog = useCatalogProducts();

  if (!cart.ready) return (
    <section className="container-page min-h-[40vh] pt-10 text-center">
      {cart.catalogError ? (
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-6">
          <p className="text-sm text-destructive">دریافت محصولات انجام نشد؛ سبد خرید شما حذف نشده است.</p>
          <Button className="mt-4" onClick={cart.retryCatalog}>تلاش دوباره</Button>
        </div>
      ) : <p className="text-sm text-muted-foreground">در حال دریافت اطلاعات محصولات…</p>}
    </section>
  );

  if (cart.items.length === 0) {
    return (
      <section className="container-page pt-10">
        <h1 className="text-3xl font-bold">{t("cartTitle")}</h1>
        <div className="mt-8 rounded-3xl border bg-card p-10 text-center">
          <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t("cartEmpty")}</p>
          <Button asChild size="lg" className="mt-6 rounded-xl">
            <Link to="/shop">{t("continueShopping")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container-page pt-10">
      <h1 className="text-3xl font-bold">{t("cartTitle")}</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <ul className="grid gap-3 lg:col-span-2">
          {cart.items.map((item) => {
            const p = catalog.data?.find((product) => product.id === item.id);
            if (!p) return (
              <li key={item.key} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">این محصول دیگر موجود یا فعال نیست</p>
                  <p className="mt-1 text-xs text-muted-foreground">برای ادامه خرید، این مورد را از سبد حذف کنید.</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => cart.remove(item.key)}>
                  <Trash2 /> حذف
                </Button>
              </li>
            );
            const opts = p.options
              .map((o) => o.values.find((v) => v.fa === item.options[o.type]))
              .filter(Boolean)
              .map((v) => l(v!))
              .join(" · ");
            return (
              <li key={item.key} className="flex gap-4 rounded-2xl border bg-card p-3 sm:p-4">
                <Link to="/product/$id" params={{ id: p.id }} className="shrink-0">
                  <img src={p.images[0]} alt={l(p.name)} loading="lazy" width={96} height={96} className="size-20 rounded-xl bg-sand object-cover sm:size-24" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link to="/product/$id" params={{ id: p.id }} className="font-semibold leading-snug hover:text-primary">
                    {l(p.name)}
                  </Link>
                  {opts && <p className="text-xs text-muted-foreground">{opts}</p>}
                  <p className="text-sm text-muted-foreground">{price(p.price)}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex items-center rounded-xl border" role="group" aria-label={t("quantity")}>
                      <Button variant="ghost" size="icon" aria-label={t("increase")} disabled={item.qty >= CART_MAX_QTY || (typeof p.stockQuantity === "number" && item.qty >= p.stockQuantity)} onClick={() => cart.setQty(item.key, item.qty + 1)}>
                        <Plus />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{num(item.qty)}</span>
                      <Button variant="ghost" size="icon" aria-label={t("decrease")} disabled={item.qty <= 1} onClick={() => cart.setQty(item.key, item.qty - 1)}>
                        <Minus />
                      </Button>
                    </div>
                    <span className="font-bold">{price(p.price * item.qty)}</span>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => cart.remove(item.key)}>
                      <Trash2 />
                      {t("remove")}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-3xl border bg-card p-6 lg:sticky lg:top-40">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>{t("total")}</span>
            <span>{price(cart.total)}</span>
          </div>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">{t("shippingLater")}</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">{t("paymentNote")}</p>
          <Button asChild size="xl" className="mt-5 w-full" disabled={cart.items.some((item) => !catalog.data?.some((product) => product.id === item.id))}>
            <Link to="/checkout">{t("goCheckout")}</Link>
          </Button>
          {cart.items.some((item) => !catalog.data?.some((product) => product.id === item.id)) ? (
            <p className="mt-2 text-xs leading-6 text-destructive">ابتدا موارد ناموجود را از سبد حذف کنید.</p>
          ) : null}
          <Link to="/shop" className="mt-3 block text-center text-sm font-semibold text-primary">
            {t("continueShopping")}
          </Link>
        </aside>
      </div>
    </section>
  );
}
