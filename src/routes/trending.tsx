import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";

import { ProductGrid } from "@/components/site/ProductCard";
import { byTag } from "@/data/catalog";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/trending")({
  head: () => ({
    meta: [
      { title: "ترندهای روز | نبستور" },
      { name: "description", content: "محبوب‌ترین محصولات حیوانات خانگی و گجت‌های ترند این هفته در نبستور." },
      { property: "og:title", content: "ترندهای روز نبستور" },
      { property: "og:description", content: "محبوب‌ترین انتخاب‌های این هفته." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trending,
});

function Trending() {
  const { t } = useI18n();
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
      <ProductGrid products={byTag("trending")} className="mt-8" />
    </section>
  );
}
