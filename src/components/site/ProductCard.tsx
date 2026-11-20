import { Link } from "@tanstack/react-router";
import { ShoppingBag, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getCategory, discountPercent, hasDiscount, type Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { l, t, price, num } = useI18n();
  const cart = useCart();
  const category = getCategory(product.category);
  const discount = discountPercent(product);
  const needsOptions = product.options.length > 0;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
    >
      <Link to="/product/$id" params={{ id: product.id }} className="relative block aspect-square overflow-hidden bg-sand">
        <img
          src={product.images[0]}
          alt={l(product.name)}
          loading="lazy"
          decoding="async"
          width={1024}
          height={1024}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-highlight px-2.5 py-1 text-xs font-bold text-highlight-foreground">
              {num(discount)}٪ {t("off")}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {category && <span className="text-xs font-medium text-muted-foreground">{l(category.name)}</span>}
        <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-snug text-foreground">
          <Link to="/product/$id" params={{ id: product.id }} className="hover:text-primary">
            {l(product.name)}
          </Link>
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{l(product.short)}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col">
            {hasDiscount(product) && product.oldPrice && (
              <span className="text-xs text-muted-foreground line-through">{price(product.oldPrice)}</span>
            )}
            <span className="text-base font-bold text-foreground">{price(product.price)}</span>
          </div>
          {needsOptions ? (
            <Button asChild size="icon" variant="soft" className="rounded-xl" aria-label={t("chooseOptions")}>
              <Link to="/product/$id" params={{ id: product.id }}>
                <SlidersHorizontal />
              </Link>
            </Button>
          ) : (
            <Button
              size="icon"
              variant="soft"
              aria-label={t("addToCart")}
              onClick={() => {
                cart.add(product.id, {});
                toast.success(t("addedToCart"));
              }}
              className="rounded-xl"
            >
              <ShoppingBag />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} className="w-[46%] shrink-0 snap-start sm:w-[32%] lg:w-auto" />
      ))}
    </div>
  );
}
