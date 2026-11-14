import { createFileRoute, Link } from "@tanstack/react-router";

import { ProductGrid } from "@/components/site/ProductCard";
import { categories, filterProducts, type SortKey } from "@/data/catalog";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ShopSearch = { q?: string; cat?: string; sale?: boolean; sort?: SortKey };
const sorts: SortKey[] = ["featured", "newest", "price-asc", "price-desc"];

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
    cat: typeof s.cat === "string" && s.cat ? s.cat : undefined,
    sale: s.sale === true || s.sale === "true" ? true : undefined,
    sort: sorts.includes(s.sort as SortKey) ? (s.sort as SortKey) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "فروشگاه نبستور | همه محصولات" },
      { name: "description", content: "همه محصولات نبستور: لوازم گربه و سگ و گجت‌های ترند با قیمت به تومان." },
      { property: "og:title", content: "فروشگاه نبستور" },
      { property: "og:description", content: "لوازم باکیفیت گربه و سگ و گجت‌های ترند." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const { t, l, num } = useI18n();
  const list = filterProducts(search);
  const sortLabels: Record<SortKey, string> = {
    featured: t("sortFeatured"),
    newest: t("sortNewest"),
    "price-asc": t("sortPriceAsc"),
    "price-desc": t("sortPriceDesc"),
  };
  const chip = "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors";

  return (
    <section className="container-page pt-8">
      <h1 className="text-2xl font-bold sm:text-3xl">
        {search.q ? `${t("resultsFor")} «${search.q}»` : t("shopTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {num(list.length)} {t("results")}
      </p>

      <div className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-2">
        <Link to="/shop" search={{ ...search, cat: undefined }} className={cn(chip, !search.cat ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>
          {t("allCategories")}
        </Link>
        {categories.map((c) => (
          <Link key={c.slug} to="/shop" search={{ ...search, cat: c.slug }} className={cn(chip, search.cat === c.slug ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>
            {l(c.name)}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("sortBy")}:</span>
        {sorts.map((s) => (
          <Link key={s} to="/shop" search={{ ...search, sort: s === "featured" ? undefined : s }} className={cn("rounded-lg px-3 py-1.5", (search.sort ?? "featured") === s ? "bg-primary-soft font-semibold text-primary" : "hover:bg-secondary")}>
            {sortLabels[s]}
          </Link>
        ))}
        <Link to="/shop" search={{ ...search, sale: search.sale ? undefined : true }} className={cn("ms-auto rounded-lg px-3 py-1.5", search.sale ? "bg-highlight font-semibold text-highlight-foreground" : "hover:bg-secondary")}>
          {t("onlyOffers")}
        </Link>
      </div>

      <div className="mt-6">
        {list.length ? (
          <ProductGrid products={list} />
        ) : (
          <div className="rounded-3xl border bg-card p-10 text-center">
            <p className="text-muted-foreground">{t("noResults")}</p>
            <Link to="/shop" search={{}} className="mt-4 inline-block font-semibold text-primary">{t("clearFilters")}</Link>
          </div>
        )}
      </div>
    </section>
  );
}
