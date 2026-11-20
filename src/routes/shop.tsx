import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { ProductGrid } from "@/components/site/ProductCard";
import { categories, getCategory, sortKeys, type SortKey } from "@/data/products";
import { useI18n } from "@/lib/i18n";
import { filterCatalogProducts, useCatalogProducts } from "@/lib/catalog";
import { toLatinDigits } from "@/lib/order-schema";
import { cn } from "@/lib/utils";

type ShopSearch = {
  q?: string | undefined;
  cat?: string | undefined;
  sub?: string | undefined;
  sale?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  sort?: SortKey | undefined;
};

const toNum = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(toLatinDigits(v)) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"].slice(0, 100) : undefined,
    cat: typeof s["cat"] === "string" && s["cat"] ? s["cat"] : undefined,
    sub: typeof s["sub"] === "string" && s["sub"] ? s["sub"] : undefined,
    sale: s["sale"] === true || s["sale"] === "true" ? true : undefined,
    min: toNum(s["min"]),
    max: toNum(s["max"]),
    sort: sortKeys.includes(s["sort"] as SortKey) ? (s["sort"] as SortKey) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "فروشگاه | همه محصولات ناب استور" },
      { name: "description", content: "جستجو و فیلتر همه محصولات ناب استور بر اساس دسته‌بندی و قیمت به تومان." },
      { property: "og:title", content: "فروشگاه ناب استور" },
      { property: "og:description", content: "قاب و لوازم جانبی گوشی، محصولات حیوانات خانگی و گجت‌های ترند." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

const priceRanges: { min?: number | undefined; max?: number | undefined }[] = [
  { max: 300000 },
  { min: 300000, max: 800000 },
  { min: 800000, max: 1500000 },
  { min: 1500000 },
];

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { t, l, num, price } = useI18n();
  const catalog = useCatalogProducts();
  const list = filterCatalogProducts(catalog.data ?? [], search);
  const activeCat = search.cat ? getCategory(search.cat) : undefined;
  const [q, setQ] = useState(search.q ?? "");
  const [min, setMin] = useState(search.min?.toString() ?? "");
  const [max, setMax] = useState(search.max?.toString() ?? "");

  useEffect(() => setQ(search.q ?? ""), [search.q]);
  useEffect(() => {
    setMin(search.min?.toString() ?? "");
    setMax(search.max?.toString() ?? "");
  }, [search.min, search.max]);

  const sortLabels: Record<SortKey, string> = {
    newest: t("sortNewest"),
    "price-asc": t("sortPriceAsc"),
    "price-desc": t("sortPriceDesc"),
  };
  const chip = "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors";
  const on = "border-primary bg-primary text-primary-foreground";
  const off = "bg-card hover:bg-secondary";

  const rangeLabel = (r: { min?: number | undefined; max?: number | undefined }) => {
    if (r.min == null) return `${t("priceUpTo")} ${price(r.max!)}`;
    if (r.max == null) return `${t("priceOver")} ${price(r.min)}`;
    return `${num(r.min)} – ${price(r.max)}`;
  };

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ search: (prev) => ({ ...prev, q: q.trim() || undefined }) });
  };
  const submitPrice = (e: FormEvent) => {
    e.preventDefault();
    navigate({ search: (prev) => ({ ...prev, min: toNum(min), max: toNum(max) }) });
  };

  return (
    <section className="container-page pt-8">
      <h1 className="text-2xl font-bold sm:text-3xl">
        {search.q ? `${t("resultsFor")} «${search.q}»` : activeCat ? l(activeCat.name) : t("shopTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {num(list.length)} {t("results")}
      </p>

      <form onSubmit={submitSearch} role="search" className="mt-5 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          maxLength={100}
          className="h-11 flex-1 rounded-xl border bg-card px-4 text-sm outline-none focus:border-ring"
        />
        <button type="submit" className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
          {t("search")}
        </button>
      </form>

      <div className="scrollbar-none mt-5 flex gap-2 overflow-x-auto pb-2">
        <Link to="/shop" search={(prev) => ({ ...prev, cat: undefined, sub: undefined })} className={cn(chip, !search.cat ? on : off)}>
          {t("allCategories")}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            to="/shop"
            search={(prev) => ({ ...prev, cat: c.slug, sub: undefined })}
            className={cn(chip, search.cat === c.slug ? on : off)}
          >
            {l(c.name)}
          </Link>
        ))}
      </div>

      {activeCat?.subcategories && (
        <div className="scrollbar-none mt-2 flex gap-2 overflow-x-auto pb-2">
          <Link to="/shop" search={(prev) => ({ ...prev, sub: undefined })} className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm", !search.sub ? "bg-primary-soft font-semibold text-primary" : "hover:bg-secondary")}>
            {t("allSubcategories")}
          </Link>
          {activeCat.subcategories.map((s) => (
            <Link
              key={s.slug}
              to="/shop"
              search={(prev) => ({ ...prev, sub: s.slug })}
              className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm", search.sub === s.slug ? "bg-primary-soft font-semibold text-primary" : "hover:bg-secondary")}
            >
              {l(s.name)}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">{t("priceRange")}</p>
        <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1">
          <Link to="/shop" search={(prev) => ({ ...prev, min: undefined, max: undefined })} className={cn(chip, search.min == null && search.max == null ? on : off)}>
            {t("anyPrice")}
          </Link>
          {priceRanges.map((r) => (
            <Link
              key={`${r.min}-${r.max}`}
              to="/shop"
              search={(prev) => ({ ...prev, min: r.min, max: r.max })}
              className={cn(chip, search.min === r.min && search.max === r.max ? on : off)}
            >
              {rangeLabel(r)}
            </Link>
          ))}
        </div>
        <form onSubmit={submitPrice} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="grid flex-1 gap-1 text-xs text-muted-foreground">
            {t("minPrice")}
            <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} className="h-10 min-w-0 rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-ring" />
          </label>
          <label className="grid flex-1 gap-1 text-xs text-muted-foreground">
            {t("maxPrice")}
            <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} className="h-10 min-w-0 rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-ring" />
          </label>
          <button type="submit" className="h-10 rounded-lg bg-secondary px-4 text-sm font-semibold hover:bg-secondary/80">
            {t("apply")}
          </button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t("sortBy")}:</span>
        {sortKeys.map((s) => (
          <Link
            key={s}
            to="/shop"
            search={(prev) => ({ ...prev, sort: s === "newest" ? undefined : s })}
            className={cn("rounded-lg px-3 py-1.5", (search.sort ?? "newest") === s ? "bg-primary-soft font-semibold text-primary" : "hover:bg-secondary")}
          >
            {sortLabels[s]}
          </Link>
        ))}
        <Link
          to="/shop"
          search={(prev) => ({ ...prev, sale: prev.sale ? undefined : true })}
          className={cn("ms-auto rounded-lg px-3 py-1.5", search.sale ? "bg-highlight font-semibold text-highlight-foreground" : "hover:bg-secondary")}
        >
          {t("onlyOffers")}
        </Link>
      </div>

      <div className="mt-6">
        {!catalog.isLoading && list.length ? (
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
