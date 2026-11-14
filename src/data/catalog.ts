import type { Localized } from "@/lib/i18n";

import bed from "@/assets/p-bed.jpg";
import feeder from "@/assets/p-feeder.jpg";
import fountain from "@/assets/p-fountain.jpg";
import litter from "@/assets/p-litter.jpg";
import carrier from "@/assets/p-carrier.jpg";
import grooming from "@/assets/p-grooming.jpg";
import tracker from "@/assets/p-tracker.jpg";
import sweater from "@/assets/p-sweater.jpg";
import toy from "@/assets/p-toy.jpg";
import earbuds from "@/assets/p-earbuds.jpg";
import projector from "@/assets/p-projector.jpg";
import charger from "@/assets/p-charger.jpg";
import camera from "@/assets/p-camera.jpg";

// Stage 1 sample catalog. Replaced by database-backed products in stage 3.
export type CategorySlug =
  | "beds"
  | "smart-bowls"
  | "hygiene"
  | "travel"
  | "care"
  | "smart-gadgets"
  | "accessories"
  | "toys"
  | "tech"
  | "innovative";

export type Category = {
  slug: CategorySlug;
  name: Localized;
  description: Localized;
  image: string;
};

export type ProductTag = "trending" | "new" | "best" | "recommended";

export type Product = {
  id: string;
  name: Localized;
  short: Localized;
  category: CategorySlug;
  image: string;
  price: number; // Toman
  compareAt?: number; // Toman, original price when discounted
  tags: ProductTag[];
  addedOrder: number; // higher = newer
};

export const categories: Category[] = [
  {
    slug: "beds",
    name: { fa: "تخت و آسایش", en: "Pet Beds & Comfort" },
    description: { fa: "تخت‌ها و تشک‌های نرم و طبی برای خوابی آرام", en: "Soft and orthopedic beds for restful sleep" },
    image: bed,
  },
  {
    slug: "smart-bowls",
    name: { fa: "ظرف غذا و آب هوشمند", en: "Smart Food & Water Bowls" },
    description: { fa: "غذاده خودکار و آبخوری‌های فیلتردار", en: "Automatic feeders and filtered fountains" },
    image: feeder,
  },
  {
    slug: "hygiene",
    name: { fa: "بهداشت و نظافت", en: "Hygiene & Cleaning" },
    description: { fa: "ظرف خاک هوشمند و لوازم نظافت", en: "Smart litter boxes and cleaning supplies" },
    image: litter,
  },
  {
    slug: "travel",
    name: { fa: "سفر و حمل", en: "Travel & Carriers" },
    description: { fa: "کیف و باکس حمل ایمن و راحت", en: "Safe, comfortable carriers and bags" },
    image: carrier,
  },
  {
    slug: "care",
    name: { fa: "مراقبت و آرایش", en: "Pet Care Products" },
    description: { fa: "برس، شامپو و محصولات مراقبتی", en: "Brushes, shampoos and grooming care" },
    image: grooming,
  },
  {
    slug: "smart-gadgets",
    name: { fa: "گجت‌های هوشمند پت", en: "Smart Pet Gadgets" },
    description: { fa: "ردیاب، دوربین و ابزار هوشمند", en: "Trackers, cameras and smart tools" },
    image: camera,
  },
  {
    slug: "accessories",
    name: { fa: "اکسسوری و پوشاک", en: "Accessories & Clothing" },
    description: { fa: "قلاده، لباس و لوازم جانبی", en: "Collars, clothing and accessories" },
    image: sweater,
  },
  {
    slug: "toys",
    name: { fa: "اسباب‌بازی و سرگرمی", en: "Toys & Entertainment" },
    description: { fa: "اسباب‌بازی‌های تعاملی و سرگرم‌کننده", en: "Interactive and engaging toys" },
    image: toy,
  },
  {
    slug: "tech",
    name: { fa: "گجت‌های ترند", en: "Trending Tech Gadgets" },
    description: { fa: "هدفون، پروژکتور و تکنولوژی روز", en: "Earbuds, projectors and the latest tech" },
    image: earbuds,
  },
  {
    slug: "innovative",
    name: { fa: "محصولات نوآورانه", en: "Innovative Products" },
    description: { fa: "ایده‌های تازه برای زندگی ساده‌تر", en: "Fresh ideas for an easier life" },
    image: charger,
  },
];

export const products: Product[] = [
  {
    id: "orthopedic-bed",
    name: { fa: "تخت طبی گرد بوکله", en: "Bouclé Orthopedic Round Bed" },
    short: { fa: "فوم طبی، روکش قابل شستشو", en: "Memory foam, washable cover" },
    category: "beds",
    image: bed,
    price: 2450000,
    compareAt: 2890000,
    tags: ["best"],
    addedOrder: 3,
  },
  {
    id: "smart-feeder",
    name: { fa: "غذاده هوشمند خودکار", en: "Automatic Smart Feeder" },
    short: { fa: "برنامه‌ریزی وعده‌ها از طریق اپ", en: "Schedule meals from the app" },
    category: "smart-bowls",
    image: feeder,
    price: 4890000,
    tags: ["best", "recommended"],
    addedOrder: 5,
  },
  {
    id: "water-fountain",
    name: { fa: "آبخوری فیلتردار بی‌صدا", en: "Silent Filtered Water Fountain" },
    short: { fa: "۲ لیتر، فیلتر چندلایه", en: "2L, multi-layer filter" },
    category: "smart-bowls",
    image: fountain,
    price: 1690000,
    compareAt: 2050000,
    tags: ["trending"],
    addedOrder: 7,
  },
  {
    id: "self-cleaning-litter",
    name: { fa: "ظرف خاک خودتمیزشونده", en: "Self-Cleaning Litter Box" },
    short: { fa: "تمیزکاری خودکار و کنترل بو", en: "Automatic cleaning, odor control" },
    category: "hygiene",
    image: litter,
    price: 18900000,
    tags: ["trending", "best"],
    addedOrder: 6,
  },
  {
    id: "bubble-carrier",
    name: { fa: "کوله حمل پنجره‌دار", en: "Bubble Window Carrier Backpack" },
    short: { fa: "تهویه کامل، بند چرمی", en: "Fully ventilated, leather straps" },
    category: "travel",
    image: carrier,
    price: 3250000,
    compareAt: 3790000,
    tags: ["best"],
    addedOrder: 2,
  },
  {
    id: "walnut-brush",
    name: { fa: "برس گردو و روغن مراقبت مو", en: "Walnut Brush & Coat Oil Set" },
    short: { fa: "کاهش ریزش مو، دسته چوبی", en: "Reduces shedding, wooden handle" },
    category: "care",
    image: grooming,
    price: 890000,
    tags: ["best", "recommended"],
    addedOrder: 1,
  },
  {
    id: "gps-collar",
    name: { fa: "قلاده چرمی با ردیاب GPS", en: "Leather Collar with GPS Tracker" },
    short: { fa: "موقعیت لحظه‌ای روی گوشی", en: "Live location on your phone" },
    category: "smart-gadgets",
    image: tracker,
    price: 3490000,
    tags: ["trending", "recommended"],
    addedOrder: 8,
  },
  {
    id: "treat-camera",
    name: { fa: "دوربین هوشمند تشویقی", en: "Smart Treat-Tossing Camera" },
    short: { fa: "تصویر زنده و پرتاب تشویقی", en: "Live view and treat tossing" },
    category: "smart-gadgets",
    image: camera,
    price: 6750000,
    tags: ["trending", "new"],
    addedOrder: 12,
  },
  {
    id: "knit-sweater",
    name: { fa: "پلیور بافت یقه‌اسکی", en: "Turtleneck Knit Sweater" },
    short: { fa: "نخ نرم، مناسب سگ‌های کوچک", en: "Soft yarn, for small dogs" },
    category: "accessories",
    image: sweater,
    price: 690000,
    compareAt: 850000,
    tags: ["new"],
    addedOrder: 10,
  },
  {
    id: "feather-ball",
    name: { fa: "توپ هوشمند پردار", en: "Smart Feather Roller Ball" },
    short: { fa: "حرکت خودکار، شارژی", en: "Self-moving, rechargeable" },
    category: "toys",
    image: toy,
    price: 1190000,
    tags: ["new", "recommended"],
    addedOrder: 11,
  },
  {
    id: "wireless-earbuds",
    name: { fa: "هندزفری بی‌سیم نویزگیر", en: "Noise-Cancelling Wireless Earbuds" },
    short: { fa: "۳۰ ساعت شارژدهی", en: "30-hour battery life" },
    category: "tech",
    image: earbuds,
    price: 2790000,
    compareAt: 3390000,
    tags: ["trending"],
    addedOrder: 4,
  },
  {
    id: "mini-projector",
    name: { fa: "پروژکتور هوشمند جیبی", en: "Pocket Smart Projector" },
    short: { fa: "Full HD، اسپیکر داخلی", en: "Full HD, built-in speaker" },
    category: "tech",
    image: projector,
    price: 12500000,
    tags: ["new", "recommended"],
    addedOrder: 13,
  },
  {
    id: "3in1-charger",
    name: { fa: "پایه شارژ بی‌سیم ۳ در ۱", en: "3-in-1 Wireless Charging Stand" },
    short: { fa: "گوشی، ساعت و هندزفری", en: "Phone, watch and earbuds" },
    category: "innovative",
    image: charger,
    price: 2350000,
    tags: ["trending", "new"],
    addedOrder: 9,
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function byTag(tag: ProductTag) {
  return products.filter((p) => p.tags.includes(tag));
}

export function onSale() {
  return products.filter((p) => p.compareAt && p.compareAt > p.price);
}

export function discountPercent(p: Product) {
  if (!p.compareAt || p.compareAt <= p.price) return 0;
  return Math.round(((p.compareAt - p.price) / p.compareAt) * 100);
}

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export function filterProducts(opts: { q?: string; cat?: string; sale?: boolean; sort?: SortKey }) {
  const q = opts.q?.trim().toLowerCase();
  let list = products.filter((p) => {
    if (opts.cat && p.category !== opts.cat) return false;
    if (opts.sale && !(p.compareAt && p.compareAt > p.price)) return false;
    if (q) {
      const hay = `${p.name.fa} ${p.name.en} ${p.short.fa} ${p.short.en}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  switch (opts.sort) {
    case "newest":
      list = [...list].sort((a, b) => b.addedOrder - a.addedOrder);
      break;
    case "price-asc":
      list = [...list].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list = [...list].sort((a, b) => b.price - a.price);
      break;
  }
  return list;
}
