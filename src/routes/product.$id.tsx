import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ProductGrid } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { discountPercent, getCategory, hasDiscount, type OptionType, type Product } from "@/data/products";
import { optimizedProductImage, useCatalogProducts } from "@/lib/catalog";
import { CART_MAX_QTY, useCart } from "@/lib/cart";
import { useI18n, type DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/product/$id")({
  head: ({ params }) => ({
    meta: [{ title: "محصول | ناب استور" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

const optionLabel: Record<OptionType, DictKey> = {
  model: "optModel",
  color: "optColor",
  size: "optSize",
  design: "optDesign",
};

function ProductNotFound() {
  const { t } = useI18n();
  return (
    <section className="container-page py-20 text-center">
      <p className="text-muted-foreground">{t("productNotFound")}</p>
      <Link to="/shop" className="mt-4 inline-block font-semibold text-primary">{t("backToShop")}</Link>
    </section>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const catalog = useCatalogProducts();
  const product = catalog.data?.find((item) => item.id === id);
  if (catalog.isLoading) return <section className="container-page min-h-[40vh] pt-10">در حال دریافت محصول…</section>;
  if (!product) return <ProductNotFound />;
  return <ProductDetail key={id} product={product} allProducts={catalog.data ?? []} />;
}

function ProductDetail({ product, allProducts }: { product: Product; allProducts: Product[] }) {
  const navigate = useNavigate();
  const id = product.id;
  const category = getCategory(product.category);
  const { t, l, price, num } = useI18n();
  const cart = useCart();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.options.map((o) => [o.type, o.values[0]?.fa ?? ""])),
  );
  const discount = discountPercent(product);
  const related = allProducts.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4);

  const addToCart = () => {
    cart.add(product.id, selected, qty);
    toast.success(t("addedToCart"), {
      action: { label: t("viewCart"), onClick: () => navigate({ to: "/cart" }) },
    });
  };

  return (
    <div className="container-page pt-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground" aria-label="breadcrumb">
        <Link to="/" className="hover:text-foreground">{t("home")}</Link>
        <span>/</span>
        {category && (
          <>
            <Link to="/category/$slug" params={{ slug: category.slug }} className="hover:text-foreground">
              {l(category.name)}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">{l(product.name)}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl border bg-sand">
            <img
              src={optimizedProductImage(product.images[active] ?? product.images[0] ?? "/favicon.svg", 1200)}
              onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/favicon.svg"; }}
              referrerPolicy="no-referrer"
              alt={l(product.name)}
              width={1024}
              height={1024}
              className="size-full object-cover"
            />
            {discount > 0 && (
              <span className="absolute start-4 top-4 rounded-full bg-highlight px-3 py-1 text-sm font-bold text-highlight-foreground">
                {num(discount)}٪ {t("off")}
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`${l(product.name)} ${num(i + 1)}`}
                  className={cn(
                    "size-20 overflow-hidden rounded-xl border-2 bg-sand",
                    i === active ? "border-primary" : "border-transparent",
                  )}
                >
                  <img src={optimizedProductImage(img, 180)} alt="" loading="lazy" width={160} height={160} referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/favicon.svg"; }} className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {category && <p className="text-sm font-medium text-primary">{l(category.name)}</p>}
          <h1 className="mt-1 text-2xl font-extrabold leading-snug sm:text-3xl">{l(product.name)}</h1>
          <p className="mt-2 text-muted-foreground">{l(product.short)}</p>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-2xl font-extrabold">{price(product.price)}</span>
            {hasDiscount(product) && product.oldPrice && (
              <span className="pb-0.5 text-sm text-muted-foreground line-through">{price(product.oldPrice)}</span>
            )}
          </div>

          {product.options.map((opt) => (
            <fieldset key={opt.type} className="mt-6">
              <legend className="text-sm font-semibold">{t(optionLabel[opt.type])}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {opt.values.map((v) => {
                  const isOn = selected[opt.type] === v.fa;
                  return (
                    <button
                      key={v.fa}
                      type="button"
                      aria-pressed={isOn}
                      onClick={() => setSelected((s) => ({ ...s, [opt.type]: v.fa }))}
                      className={cn(
                        "rounded-xl border px-3.5 py-2 text-sm transition-colors",
                        isOn ? "border-primary bg-primary-soft font-semibold text-primary" : "bg-card hover:bg-secondary",
                      )}
                    >
                      <span dir={opt.type === "model" ? "ltr" : undefined}>{l(v)}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border bg-card" role="group" aria-label={t("quantity")}>
              <Button variant="ghost" size="icon-lg" aria-label={t("increase")} onClick={() => setQty((q) => Math.min(CART_MAX_QTY, q + 1))}>
                <Plus />
              </Button>
              <span className="w-10 text-center font-semibold" aria-live="polite">{num(qty)}</span>
              <Button variant="ghost" size="icon-lg" aria-label={t("decrease")} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus />
              </Button>
            </div>
            <Button size="xl" className="flex-1" onClick={addToCart}>
              <ShoppingBag />
              {t("addToCart")}
            </Button>
          </div>

          <div className="mt-6 flex gap-3 rounded-2xl bg-primary-soft p-4 text-sm leading-7 text-primary-deep">
            <Truck className="mt-1 size-5 shrink-0" />
            <div>
              <p className="font-bold">{t("shippingNoteTitle")}</p>
              <p className="text-primary-deep/80">
                {t("shippingNote")}{" "}
                <Link to="/returns" className="font-semibold underline underline-offset-4">{t("returns")}</Link>
              </p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold">{t("description")}</h2>
            <p className="mt-2 leading-8 text-foreground/80">{l(product.description)}</p>
          </section>

          {product.specs.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold">{t("specs")}</h2>
              <dl className="mt-3 divide-y overflow-hidden rounded-2xl border bg-card text-sm">
                {product.specs.map((s) => (
                  <div key={s.label.en} className="grid grid-cols-3 gap-3 px-4 py-3">
                    <dt className="text-muted-foreground">{l(s.label)}</dt>
                    <dd className="col-span-2 font-medium">{l(s.value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">{t("related")}</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
