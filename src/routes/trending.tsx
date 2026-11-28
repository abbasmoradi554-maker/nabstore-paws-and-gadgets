import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";

import { ProductGrid } from "@/components/site/ProductCard";

import { useI18n } from "@/lib/i18n";
import { useCatalogProducts } from "@/lib/catalog";

export const Route = createFileRoute("/trending")({
  head: () => ({
    meta: [
      { title: "ترندهای روز | ناب استور" },
      { name: "description", content: "ترندهای تازه ناب استور: قاب گوشی، لوازم حیوانات خانگی و گجت‌های کاربردی." },
      { property: "og:title", content: "ترندهای روز ناب استور" },
      { property: "og:description", content: "ترندهای تازه ناب استور." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trending,
});

function Trending() {
  const { t } = useI18n();
  const catalog = useCatalogProducts();
  const trending = (catalog.data ?? []).filter(p => p.tags.includes("trending"));
  return (
    <section className="container-page pt-8">
      <div className="rounded-3xl bg-ink-gradient p-8 sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-highlight/15 px-3 py-1 text-xs font-bold text-highlight">
          <Flame className="size-3.5" />
          {t("badgeTrending")}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-ink-foreground">{t("trendingNow")}</h1>
        <p className="mt-2 text-ink-foreground/70">{t("trendingSubtitle")}</p>
      </div>
      {catalog.isLoading ? <p className="mt-8 text-sm text-muted-foreground">در حال دریافت محصولات…</p> : <ProductGrid products={trending} className="mt-8" />}
    </section>
  );
}
