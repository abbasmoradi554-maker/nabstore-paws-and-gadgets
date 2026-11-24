import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  BadgePercent,
  Flame,
  Headset,
  MessageSquareQuote,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react";

import heroMain from "@/assets/hero-main.jpg";
import heroTech from "@/assets/hero-tech.jpg";
import phoneCaseImg from "@/assets/ph-case.svg";
import { CategoryCard } from "@/components/site/CategoryCard";
import { ProductGrid, ProductRail } from "@/components/site/ProductCard";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/products";
import { useCatalogProducts } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { useStoreContent } from "@/lib/store-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ناب استور | قاب گوشی، لوازم حیوانات خانگی و گجت‌های ترند" },
      {
        name: "description",
        content:
          "خرید آنلاین قاب و لوازم جانبی گوشی، ظرف غذا و آبخوری، اسباب‌بازی، قلاده، لوازم بهداشتی، تخت و کیف حمل گربه و سگ و گجت‌های ترند با قیمت به تومان.",
      },
      { property: "og:title", content: "ناب استور | NABSTORE" },
      { property: "og:description", content: "قاب و لوازم جانبی گوشی، محصولات گربه و سگ و گجت‌های ترند." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function useHomeText() {
  const { l } = useI18n();
  const content = useStoreContent();
  return (key: string, fallback: string) => {
    const value = content.data?.["home"]?.[key];
    return value && typeof value === "object" && "fa" in value && "en" in value
      ? l(value as { fa: string; en: string })
      : fallback;
  };
}

function Index() {
  return (
    <>
      <Hero />
      <ValueStrip />
      <CategoriesSection />
      <PhoneSection />
      <TrendingSection />
      <NewArrivals />
      <OffersSection />
      <BestSellers />
      <Recommended />
      <Reviews />
      <SupportCta />
    </>
  );
}

function Hero() {
  const { t, l } = useI18n();
  const content = useStoreContent();
  const home = content.data?.["home"] ?? {};
  const localized = (value: unknown, fallback: string) => value && typeof value === "object" && "fa" in value && "en" in value ? l(value as { fa: string; en: string }) : fallback;
  return (
    <section className="container-page pt-4 sm:pt-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative isolate min-h-[26rem] overflow-hidden rounded-3xl bg-sand sm:min-h-[30rem] lg:col-span-2 lg:min-h-[34rem]">
          <img
            src={heroMain}
            alt=""
            width={1920}
            height={1088}
            fetchPriority="high"
            className="absolute inset-0 -z-10 size-full object-cover object-[70%_center] rtl:-scale-x-100"
          />
          <div className="absolute inset-0 -z-10 bg-hero-fade" />
          <div className="flex h-full max-w-lg animate-fade-up flex-col justify-center gap-5 p-6 sm:p-10 lg:p-14">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-card/80 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur">
              <span className="size-1.5 rounded-full bg-highlight" />
              {localized(home.heroEyebrow, t("heroEyebrow"))}
            </span>
            <h1 className="text-3xl font-extrabold leading-[1.25] text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.2]">
              {localized(home.heroTitle, t("heroTitle"))}
            </h1>
            <p className="max-w-md text-sm leading-7 text-foreground/75 sm:text-base sm:leading-8">{localized(home.heroText, t("heroText"))}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="xl">
                <Link to="/shop">
                  {localized(home.heroCta, t("heroCta"))}
                  <ArrowLeft className="ltr:rotate-180" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="bg-card/70 backdrop-blur">
                <Link to="/trending">{localized(home.heroCta2, t("heroCta2"))}</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Link
            to="/category/$slug"
            params={{ slug: "gadgets" }}
            className="group relative isolate flex min-h-52 flex-col justify-end overflow-hidden rounded-3xl bg-ink p-6"
          >
            <img
              src={heroTech}
              alt=""
              width={1600}
              height={1008}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 -z-10 size-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
            <span className="text-xs font-semibold text-highlight">NEW</span>
            <h2 className="mt-1 text-xl font-bold text-ink-foreground">{localized(home.promoTechTitle, t("promoTechTitle"))}</h2>
            <p className="mt-1 text-sm text-ink-foreground/75">{localized(home.promoTechText, t("promoTechText"))}</p>
          </Link>
          <Link
            to="/category/$slug"
            params={{ slug: "phone-cases" }}
            className="group relative isolate flex min-h-52 items-center gap-4 overflow-hidden rounded-3xl bg-primary-soft p-6"
          >
            <div className="flex-1">
              <h2 className="text-xl font-bold text-primary-deep">{localized(home.promoPhoneTitle, t("promoPhoneTitle"))}</h2>
              <p className="mt-1 text-sm text-primary-deep/70">{localized(home.promoPhoneText, t("promoPhoneText"))}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {t("viewAll")}
                <ArrowLeft className="size-4 ltr:rotate-180" />
              </span>
            </div>
            <img
              src={phoneCaseImg}
              alt=""
              width={1024}
              height={1024}
              loading="lazy"
              className="size-32 shrink-0 rounded-2xl object-cover mix-blend-multiply transition-transform duration-500 group-hover:-rotate-2 group-hover:scale-105 sm:size-36"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ValueStrip() {
  const { t, l, price } = useI18n();
  const h = useHomeText();
  const content = useStoreContent();
  const shipping = content.data?.["shipping"];
  const fee = Number(shipping?.flatFeeToman);
  const freeAbove = Number(shipping?.freeAboveToman);
  const hasShippingConfig = Number.isSafeInteger(fee) && fee >= 0 && Number.isSafeInteger(freeAbove) && freeAbove >= 0;
  const shippingText = !hasShippingConfig
    ? h("valueShippingText", t("valueShippingText"))
    : shipping?.enabled === false || fee === 0
      ? l({ fa: "ارسال سفارش‌ها رایگان است", en: "Shipping is free" })
      : freeAbove > 0
        ? l({
            fa: `ارسال عادی ${price(fee)}؛ خرید ${price(freeAbove)} و بیشتر رایگان`,
            en: `Standard shipping ${price(fee)}; free on orders of ${price(freeAbove)} or more`,
          })
        : l({ fa: `هزینه ارسال ${price(fee)} است`, en: `Shipping costs ${price(fee)}` });
  const items = [
    { Icon: Truck, title: h("valueShipping", t("valueShipping")), text: shippingText },
    { Icon: Package, title: h("valuePackaging", t("valuePackaging")), text: h("valuePackagingText", t("valuePackagingText")) },
    { Icon: Headset, title: h("valueSupport", t("valueSupport")), text: h("valueSupportText", t("valueSupportText")) },
    { Icon: RotateCcw, title: h("valueReturns", t("valueReturns")), text: h("valueReturnsText", t("valueReturnsText")) },
  ];
  return (
    <section className="container-page mt-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
        {items.map(({ Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 bg-card p-4 sm:p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">{title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoriesSection() {
  const { t } = useI18n();
  const h = useHomeText();
  const content = useStoreContent();
  const visibleCategories = Array.isArray(content.data?.["categories"]) ? content.data["categories"] : categories;
  return (
    <section className="container-page mt-16 sm:mt-20">
      <SectionHeader title={h("catTitle", t("catTitle"))} subtitle={h("catSubtitle", t("catSubtitle"))} link={{ to: "/shop" }} />
      <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-7">
        {visibleCategories.map((c: (typeof categories)[number]) => (
          <CategoryCard key={c.slug} category={c} />
        ))}
      </div>
    </section>
  );
}

function PhoneSection() {
  const { l } = useI18n();
  const catalog = useCatalogProducts();
  const content = useStoreContent();
  const visibleCategories = Array.isArray(content.data?.["categories"]) ? content.data["categories"] : categories;
  const cat = visibleCategories[0] as (typeof categories)[number] | undefined;
  if (!cat) return null;
  const products = (catalog.data ?? []).filter((p) => p.category === cat.slug).slice(0, 4);
  // Do not render an empty category rail when the live catalog has no products in it.
  if (!catalog.isLoading && products.length === 0) return null;
  return (
    <section className="container-page mt-16 sm:mt-20">
      <SectionHeader title={l(cat.name)} subtitle={l(cat.description)} link={{ to: "/category/$slug", params: { slug: cat.slug } }} />
      <ProductRail products={products} />
    </section>
  );
}

function TrendingSection() {
  const { t } = useI18n();
  const h = useHomeText();
  const catalog = useCatalogProducts();
  return (
    <section className="container-page mt-16 sm:mt-20">
      <div className="overflow-hidden rounded-3xl bg-ink-gradient px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-highlight/15 px-3 py-1 text-xs font-bold text-highlight">
          <Flame className="size-3.5" />
          {t("badgeTrending")}
        </div>
        <SectionHeader inverted title={h("trendingTitle", t("trendingNow"))} subtitle={h("trendingSubtitle", t("trendingSubtitle"))} link={{ to: "/trending" }} />
        <ProductRail products={(catalog.data ?? []).filter((p) => p.tags.includes("trending")).slice(0, 4)} />
      </div>
    </section>
  );
}

function NewArrivals() {
  const { t } = useI18n();
  const h = useHomeText();
  const catalog = useCatalogProducts();
  const list = [...(catalog.data ?? [])].sort((a, b) => b.addedOrder - a.addedOrder).slice(0, 4);
  return (
    <section className="container-page mt-16 sm:mt-20">
      <SectionHeader
        title={h("newArrivals", t("newArrivals"))}
        subtitle={h("newArrivalsSubtitle", t("newArrivalsSubtitle"))}
        link={{ to: "/shop", search: { sort: "newest" } }}
      />
      <ProductRail products={list} />
    </section>
  );
}

function OffersSection() {
  const { t } = useI18n();
  const h = useHomeText();
  const catalog = useCatalogProducts();
  const discountedProducts = (catalog.data ?? []).filter((p) => p.oldPrice != null && p.oldPrice > p.price).slice(0, 4);
  // Hide the promotions block until there are genuine discounted products to show.
  if (!catalog.isLoading && discountedProducts.length === 0) return null;
  return (
    <section className="container-page mt-16 sm:mt-20">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-3xl bg-ink p-6 sm:p-8 lg:col-span-2">
          <img
            src={heroTech}
            alt=""
            width={1600}
            height={1008}
            loading="lazy"
            className="absolute inset-0 -z-10 size-full object-cover opacity-60"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-highlight px-3 py-1 text-xs font-bold text-highlight-foreground">
            <BadgePercent className="size-3.5" />
            {t("offers")}
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-ink-foreground sm:text-3xl">{h("offersTitle", t("offersTitle"))}</h2>
          <p className="mt-2 max-w-sm text-sm leading-7 text-ink-foreground/75">{h("offersText", t("offersText"))}</p>
          <Button asChild variant="highlight" size="lg" className="mt-5 w-fit rounded-xl">
            <Link to="/shop" search={{ sale: true }}>
              {h("offersCta", t("offersCta"))}
              <ArrowLeft className="ltr:rotate-180" />
            </Link>
          </Button>
        </div>
        <div className="lg:col-span-3">
          <ProductGrid products={discountedProducts} className="md:grid-cols-2 lg:grid-cols-2" />
        </div>
      </div>
    </section>
  );
}

function BestSellers() {
  const { t } = useI18n();
  const h = useHomeText();
  const catalog = useCatalogProducts();
  return (
    <section className="container-page mt-16 sm:mt-20">
      <SectionHeader title={h("bestSellers", t("bestSellers"))} subtitle={h("bestSellersSubtitle", t("bestSellersSubtitle"))} link={{ to: "/shop" }} />
      <ProductRail products={(catalog.data ?? []).filter((p) => p.tags.includes("pick")).slice(0, 4)} />
    </section>
  );
}

function Recommended() {
  const { t } = useI18n();
  const h = useHomeText();
  const catalog = useCatalogProducts();
  return (
    <section className="container-page mt-16 sm:mt-20">
      <SectionHeader title={h("recommended", t("recommended"))} subtitle={h("recommendedSubtitle", t("recommendedSubtitle"))} link={{ to: "/shop" }} />
      <ProductGrid products={(catalog.data ?? []).filter((p) => p.tags.includes("recommended")).slice(0, 4)} />
    </section>
  );
}

function Reviews() {
  const { t } = useI18n();
  const h = useHomeText();
  const points = [
    { Icon: UserCheck, label: h("reviewsPoint1", t("reviewsPoint1")) },
    { Icon: BadgeCheck, label: h("reviewsPoint2", t("reviewsPoint2")) },
    { Icon: ShieldCheck, label: h("reviewsPoint3", t("reviewsPoint3")) },
  ];
  return (
    <section className="container-page mt-16 sm:mt-20">
      <SectionHeader title={h("reviewsTitle", t("reviewsTitle"))} subtitle={h("reviewsSubtitle", t("reviewsSubtitle"))} />
      <div className="grid items-center gap-8 rounded-3xl border bg-card p-6 sm:p-10 lg:grid-cols-5">
        <div className="flex items-start gap-4 lg:col-span-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <MessageSquareQuote className="size-6" />
          </span>
          <p className="text-sm leading-8 text-foreground/80 sm:text-base sm:leading-8">{h("reviewsEmpty", t("reviewsEmpty"))}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-1">
          {points.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold">
              <Icon className="size-4 text-primary" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SupportCta() {
  const { t } = useI18n();
  const h = useHomeText();
  return (
    <section className="container-page mt-16 sm:mt-20">
      <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-primary-soft p-6 sm:flex-row sm:items-center sm:p-10">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Headset className="size-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-primary-deep sm:text-2xl">{h("supportTitle", t("supportTitle"))}</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-primary-deep/75">{h("supportText", t("supportText"))}</p>
          </div>
        </div>
        <Button asChild size="xl">
          <Link to="/contact">{h("supportCta", t("supportCta"))}</Link>
        </Button>
      </div>
    </section>
  );
}
