import type { Localized } from "@/lib/i18n";

import bed from "@/assets/p-bed.jpg";
import feeder from "@/assets/p-feeder.jpg";
import litter from "@/assets/p-litter.jpg";
import sweater from "@/assets/p-sweater.jpg";
import toy from "@/assets/p-toy.jpg";
import earbuds from "@/assets/p-earbuds.jpg";
import phCase from "@/assets/ph-case.svg";

// Categories are fixed in code (display order = this array's order). Products
// are NOT defined here: they are loaded live from the database (active only).

export type CategorySlug =
  | "phone-cases"
  | "food-water"
  | "toys"
  | "collars"
  | "hygiene"
  | "beds-carriers"
  | "gadgets";

export type Subcategory = { slug: string; name: Localized };

export type Category = {
  slug: CategorySlug;
  name: Localized;
  description: Localized;
  image: string;
  subcategories?: Subcategory[];
};

export const productTags = ["trending", "pick", "recommended"] as const;
export type ProductTag = (typeof productTags)[number];
export const optionTypes = ["model", "color", "size", "design"] as const;
export type OptionType = (typeof optionTypes)[number];
export type ProductOption = { type: OptionType; values: Localized[] };
export type Spec = { label: Localized; value: Localized };

export type Product = {
  id: string;
  name: Localized;
  price: number; // Toman
  oldPrice?: number | undefined; // Toman, shown struck-through when higher than price
  category: string;
  subcategory?: string | undefined;
  short: Localized;
  description: Localized;
  specs: Spec[];
  options: ProductOption[];
  images: string[];
  tags: ProductTag[];
  sortOrder: number;
  inStock: boolean;
  createdAt: string; // ISO timestamp
};

// Display order matters: phone cases first in menus and on the homepage.
export const categories: Category[] = [
  {
    slug: "phone-cases",
    name: { fa: "قاب گوشی و لوازم جانبی", en: "Phone Cases & Accessories" },
    description: { fa: "قاب، گلس، محافظ لنز، پاپ‌سوکت و هولدر", en: "Cases, screen guards, lens protectors, grips and holders" },
    image: phCase,
    subcategories: [
      { slug: "silicone", name: { fa: "قاب سیلیکونی", en: "Silicone cases" } },
      { slug: "clear", name: { fa: "قاب شفاف", en: "Clear cases" } },
      { slug: "printed", name: { fa: "قاب طرح‌دار", en: "Printed cases" } },
      { slug: "glass", name: { fa: "گلس و محافظ لنز", en: "Screen & lens protectors" } },
      { slug: "holder", name: { fa: "پاپ‌سوکت و هولدر", en: "Grips & holders" } },
    ],
  },
  {
    slug: "food-water",
    name: { fa: "غذا و آبخوری", en: "Food & Water" },
    description: { fa: "ظرف غذا، آبخوری و غذاده", en: "Bowls, fountains and feeders" },
    image: feeder,
  },
  {
    slug: "toys",
    name: { fa: "اسباب‌بازی", en: "Toys" },
    description: { fa: "اسباب‌بازی برای گربه و سگ", en: "Toys for cats and dogs" },
    image: toy,
  },
  {
    slug: "collars",
    name: { fa: "قلاده و اکسسوری", en: "Collars & Accessories" },
    description: { fa: "قلاده، بند گردش و پوشاک", en: "Collars, leashes and clothing" },
    image: sweater,
  },
  {
    slug: "hygiene",
    name: { fa: "بهداشت و نظافت", en: "Hygiene & Cleaning" },
    description: { fa: "ظرف خاک، برس و لوازم نظافت", en: "Litter boxes, brushes and cleaning supplies" },
    image: litter,
  },
  {
    slug: "beds-carriers",
    name: { fa: "تخت و حمل", en: "Beds & Carriers" },
    description: { fa: "تخت، تشک و کیف حمل", en: "Beds, mats and carriers" },
    image: bed,
  },
  {
    slug: "gadgets",
    name: { fa: "گجت‌های ترند", en: "Trending Gadgets" },
    description: { fa: "هندزفری، شارژر و گجت‌های کاربردی", en: "Earbuds, chargers and handy gadgets" },
    image: earbuds,
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export const categorySlugs = categories.map((c) => c.slug);

export function getProduct(list: Product[], id: string) {
  return list.find((p) => p.id === id);
}

export function byTag(list: Product[], tag: ProductTag) {
  return list.filter((p) => p.tags.includes(tag));
}

export function hasDiscount(p: Product) {
  return !!p.oldPrice && p.oldPrice > p.price;
}

export function onSale(list: Product[]) {
  return list.filter(hasDiscount);
}

export function discountPercent(p: Product) {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0;
  return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
}

export function relatedProducts(list: Product[], p: Product, count = 4) {
  return list.filter((x) => x.category === p.category && x.id !== p.id).slice(0, count);
}

export function newest(list: Product[]) {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type SortKey = "newest" | "price-asc" | "price-desc";
export const sortKeys: SortKey[] = ["newest", "price-asc", "price-desc"];

export type ProductFilter = {
  q?: string | undefined;
  cat?: string | undefined;
  sub?: string | undefined;
  sale?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  sort?: SortKey | undefined;
};

export function filterProducts(all: Product[], opts: ProductFilter) {
  const q = opts.q?.trim().toLowerCase();
  const list = all.filter((p) => {
    if (opts.cat && p.category !== opts.cat) return false;
    if (opts.sub && p.subcategory !== opts.sub) return false;
    if (opts.sale && !hasDiscount(p)) return false;
    if (opts.min != null && p.price < opts.min) return false;
    if (opts.max != null && p.price > opts.max) return false;
    if (q) {
      const hay = `${p.name.fa} ${p.name.en} ${p.short.fa} ${p.short.en}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  switch (opts.sort ?? "newest") {
    case "price-asc":
      return [...list].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...list].sort((a, b) => b.price - a.price);
    default:
      return newest(list);
  }
}
