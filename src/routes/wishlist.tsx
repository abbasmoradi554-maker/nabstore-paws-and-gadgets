import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Trash2 } from "lucide-react";

import { ProductGrid } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { useCatalogProducts } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { useWishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "علاقه‌مندی‌ها | ناب استور" },
      { name: "description", content: "محصولات موردعلاقه‌ات را در ناب استور ذخیره کن و بعداً به سبد خرید اضافه کن." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { t, l, num } = useI18n();
  const wishlist = useWishlist();
  const catalog = useCatalogProducts();
  const products = (catalog.data ?? []).filter((product) => wishlist.ids.includes(product.id));

  if (!wishlist.ready || catalog.isLoading) {
    return <section className="container-page min-h-[40vh] py-16 text-center text-sm text-muted-foreground">{l({ fa: "در حال بارگذاری علاقه‌مندی‌ها…", en: "Loading your wishlist…" })}</section>;
  }

  if (catalog.isError) {
    return (
      <section className="container-page py-16 text-center">
        <p className="text-sm text-destructive">{l({ fa: "دریافت محصولات انجام نشد.", en: "Products could not be loaded." })}</p>
        <Button className="mt-4" onClick={() => void catalog.refetch()}>{l({ fa: "تلاش دوباره", en: "Try again" })}</Button>
      </section>
    );
  }

  return (
    <section className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">NABSTORE</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{l({ fa: "علاقه‌مندی‌های من", en: "My wishlist" })}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{num(products.length)} {l({ fa: "محصول ذخیره‌شده", en: "saved products" })}</p>
        </div>
        {products.length > 0 && (
          <Button variant="outline" onClick={wishlist.clear}>
            <Trash2 className="size-4" />
            {l({ fa: "پاک‌کردن فهرست", en: "Clear wishlist" })}
          </Button>
        )}
      </div>

      {products.length > 0 ? (
        <div className="mt-7">
          <ProductGrid products={products} />
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border bg-card px-6 py-14 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Heart className="size-7" />
          </span>
          <h2 className="mt-5 text-lg font-bold">{l({ fa: "هنوز محصولی ذخیره نکرده‌ای", en: "Your wishlist is empty" })}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">{l({ fa: "با زدن علامت قلب روی محصولات، آن‌ها را اینجا نگه دار تا بعداً راحت‌تر پیدایشان کنی.", en: "Tap the heart on any product to save it here and find it easily later." })}</p>
          <Button asChild className="mt-6">
            <Link to="/shop">{t("continueShopping")}</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
