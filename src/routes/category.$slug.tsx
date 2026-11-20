import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { ProductGrid } from "@/components/site/ProductCard";
import { getCategory } from "@/data/products";
import { catalogQueryOptions, useCatalog } from "@/lib/catalog-query";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(catalogQueryOptions);
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { slug: category.slug, title: category.name.fa, description: category.description.fa };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} | ناب استور` : "دسته‌بندی | ناب استور" },
      { name: "description", content: loaderData?.description ?? "دسته‌بندی محصولات ناب استور" },
      { property: "og:title", content: loaderData ? `${loaderData.title} | ناب استور` : "ناب استور" },
      { property: "og:description", content: loaderData?.description ?? "دسته‌بندی محصولات ناب استور" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: CategoryNotFound,
  component: CategoryPage,
});

function CategoryNotFound() {
  const { t } = useI18n();
  return (
    <section className="container-page py-20 text-center">
      <p className="text-muted-foreground">{t("notFoundCategory")}</p>
      <Link to="/shop" className="mt-4 inline-block font-semibold text-primary">{t("backToShop")}</Link>
    </section>
  );
}

function CategoryPage() {
  const { slug } = Route.useLoaderData();
  const { l, t, num } = useI18n();
  const category = getCategory(slug)!;
  const { products } = useCatalog();
  const list = products.filter((p) => p.category === slug);
  return (
    <section className="container-page pt-8">
      <div className="flex items-center gap-5 rounded-3xl bg-primary-soft p-6 sm:p-8">
        <img src={category.image} alt="" width={1024} height={1024} loading="lazy" className="size-20 rounded-2xl object-cover sm:size-28" />
        <div>
          <h1 className="text-2xl font-bold text-primary-deep sm:text-3xl">{l(category.name)}</h1>
          <p className="mt-1 text-sm text-primary-deep/70 sm:text-base">{l(category.description)}</p>
          <p className="mt-2 text-xs text-primary-deep/60">{num(list.length)} {t("results")}</p>
          {category.subcategories && (
            <div className="mt-3 flex flex-wrap gap-2">
              {category.subcategories.map((s) => (
                <Link
                  key={s.slug}
                  to="/shop"
                  search={{ cat: category.slug, sub: s.slug }}
                  className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary hover:bg-card/80"
                >
                  {l(s.name)}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      {list.length ? <ProductGrid products={list} className="mt-8" /> : <p className="mt-8 rounded-3xl border bg-card p-10 text-center text-muted-foreground">{t("catalogEmpty")}</p>}
    </section>
  );
}
