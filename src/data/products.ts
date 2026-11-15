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
import phCase from "@/assets/ph-case.svg";
import phGlass from "@/assets/ph-glass.svg";
import phHolder from "@/assets/ph-holder.svg";

// SAMPLE catalog: every product and price here is a placeholder until real
// products are loaded from the database. Never add fake stock, ratings or reviews.

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

export type ProductTag = "trending" | "pick" | "recommended";
export type OptionType = "model" | "color" | "size" | "design";
export type ProductOption = { type: OptionType; values: Localized[] };
export type Spec = { label: Localized; value: Localized };

export type Product = {
  id: string;
  name: Localized;
  price: number; // Toman
  oldPrice?: number; // Toman, shown struck-through when higher than price
  category: CategorySlug;
  subcategory?: string;
  short: Localized;
  description: Localized;
  specs: Spec[];
  options: ProductOption[];
  images: string[];
  tags: ProductTag[];
  addedOrder: number; // higher = newer
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

const L = (fa: string, en: string): Localized => ({ fa, en });
const same = (v: string): Localized => ({ fa: v, en: v });

const phoneModels: ProductOption = {
  type: "model",
  values: ["iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16", "Galaxy A55", "Galaxy S24", "Redmi Note 13"].map(same),
};
const caseColors: ProductOption = {
  type: "color",
  values: [L("مشکی", "Black"), L("سبز تیره", "Dark green"), L("کرم", "Cream"), L("نارنجی", "Orange")],
};
const petSizes: ProductOption = { type: "size", values: ["S", "M", "L"].map(same) };
const spec = (lfa: string, len: string, vfa: string, ven: string): Spec => ({ label: L(lfa, len), value: L(vfa, ven) });

export const products: Product[] = [
  // ---- Phone cases & accessories ----
  {
    id: "silicone-case",
    name: L("قاب سیلیکونی سافت‌تاچ", "Soft-touch Silicone Case"),
    price: 290000,
    oldPrice: 350000,
    category: "phone-cases",
    subcategory: "silicone",
    short: L("سطح نرم، داخل مخمل", "Soft finish, microfiber lining"),
    description: L(
      "قاب سیلیکونی با سطح نرم و لبه‌های کمی برجسته‌تر از صفحه و دوربین. داخل قاب با لایه مخمل پوشانده شده است.",
      "Silicone case with a soft finish and edges slightly raised above the screen and camera. Microfiber inner lining.",
    ),
    specs: [spec("جنس", "Material", "سیلیکون", "Silicone"), spec("داخل قاب", "Lining", "مخمل", "Microfiber")],
    options: [phoneModels, caseColors],
    images: [phCase, phHolder],
    tags: ["pick", "trending"],
    addedOrder: 20,
  },
  {
    id: "clear-case",
    name: L("قاب شفاف با لبه محافظ", "Clear Case with Bumper Edges"),
    price: 220000,
    category: "phone-cases",
    subcategory: "clear",
    short: L("نمایش رنگ اصلی گوشی", "Shows your phone's original colour"),
    description: L(
      "قاب شفاف با گوشه‌های ضخیم‌تر برای کاهش آسیب در ضربه‌های معمولی.",
      "Transparent case with thicker corners to reduce damage from everyday knocks.",
    ),
    specs: [spec("جنس", "Material", "TPU شفاف", "Clear TPU"), spec("ضخامت", "Thickness", "حدود ۱.۵ میلی‌متر", "About 1.5 mm")],
    options: [phoneModels],
    images: [phCase],
    tags: ["recommended"],
    addedOrder: 18,
  },
  {
    id: "printed-case",
    name: L("قاب طرح‌دار مینیمال", "Minimal Printed Case"),
    price: 380000,
    oldPrice: 450000,
    category: "phone-cases",
    subcategory: "printed",
    short: L("چاپ مات، سه طرح", "Matte print, three designs"),
    description: L("قاب سخت با چاپ مات در سه طرح گربه، سگ و هندسی.", "Hard case with a matte print in cat, dog and geometric designs."),
    specs: [spec("جنس", "Material", "پلی‌کربنات و TPU", "Polycarbonate & TPU"), spec("چاپ", "Print", "مات", "Matte")],
    options: [phoneModels, { type: "design", values: [L("گربه", "Cat"), L("سگ", "Dog"), L("هندسی", "Geometric")] }],
    images: [phCase],
    tags: ["trending", "pick"],
    addedOrder: 22,
  },
  {
    id: "tempered-glass",
    name: L("گلس محافظ صفحه", "Tempered Glass Screen Protector"),
    price: 150000,
    category: "phone-cases",
    subcategory: "glass",
    short: L("پوشش کامل صفحه", "Full-screen coverage"),
    description: L("گلس شیشه‌ای برای محافظت از صفحه در برابر خط و خش روزمره.", "Glass protector that guards the screen against everyday scratches."),
    specs: [spec("جنس", "Material", "شیشه", "Glass"), spec("تعداد در بسته", "In the box", "۱ عدد", "1 piece")],
    options: [phoneModels],
    images: [phGlass],
    tags: ["pick"],
    addedOrder: 15,
  },
  {
    id: "lens-protector",
    name: L("محافظ لنز دوربین", "Camera Lens Protector"),
    price: 120000,
    category: "phone-cases",
    subcategory: "glass",
    short: L("محافظ شیشه‌ای لنزها", "Glass cover for the lenses"),
    description: L("محافظ شیشه‌ای که روی ماژول دوربین قرار می‌گیرد.", "Glass protector that sits over the camera module."),
    specs: [spec("جنس", "Material", "شیشه", "Glass")],
    options: [phoneModels],
    images: [phGlass],
    tags: [],
    addedOrder: 14,
  },
  {
    id: "pop-socket",
    name: L("پاپ‌سوکت جمع‌شونده", "Collapsible Phone Grip"),
    price: 140000,
    category: "phone-cases",
    subcategory: "holder",
    short: L("نگه‌دارنده و پایه کوچک", "Grip and mini stand"),
    description: L("پاپ‌سوکت چسبی برای گرفتن راحت‌تر گوشی و ایستاندن آن روی میز.", "Adhesive grip for an easier hold and to prop the phone on a desk."),
    specs: [spec("نصب", "Mounting", "چسبی", "Adhesive")],
    options: [caseColors],
    images: [phHolder],
    tags: ["recommended"],
    addedOrder: 16,
  },
  {
    id: "car-holder",
    name: L("هولدر مغناطیسی خودرو", "Magnetic Car Phone Holder"),
    price: 480000,
    category: "phone-cases",
    subcategory: "holder",
    short: L("نصب روی دریچه کولر", "Mounts on the air vent"),
    description: L("هولدر مغناطیسی برای نگه‌داشتن گوشی در خودرو، همراه با صفحه فلزی چسبی.", "Magnetic holder for the car, supplied with an adhesive metal plate."),
    specs: [spec("نصب", "Mounting", "دریچه کولر", "Air vent"), spec("همراه", "Included", "صفحه فلزی", "Metal plate")],
    options: [],
    images: [phHolder],
    tags: ["trending"],
    addedOrder: 19,
  },
  // ---- Food & water ----
  {
    id: "gravity-feeder",
    name: L("غذاده مخزن‌دار", "Gravity Food Dispenser"),
    price: 1150000,
    category: "food-water",
    short: L("پرشدن خودکار ظرف با وزن غذا", "Refills the bowl by gravity"),
    description: L("غذاده ساده بدون برق؛ با کم شدن غذای ظرف، از مخزن جایگزین می‌شود.", "Simple non-electric feeder; food flows from the tank as the bowl empties."),
    specs: [spec("نوع", "Type", "بدون برق", "Non-electric"), spec("جنس", "Material", "پلاستیک", "Plastic")],
    options: [],
    images: [feeder],
    tags: ["recommended"],
    addedOrder: 8,
  },
  {
    id: "water-fountain",
    name: L("آبخوری فیلتردار", "Filtered Water Fountain"),
    price: 1350000,
    oldPrice: 1590000,
    category: "food-water",
    short: L("گردش آب با فیلتر", "Circulating water with filter"),
    description: L("آبخوری برقی که آب را به گردش درمی‌آورد و از یک فیلتر قابل تعویض عبور می‌دهد.", "Electric fountain that circulates water through a replaceable filter."),
    specs: [spec("برق", "Power", "USB", "USB"), spec("فیلتر", "Filter", "قابل تعویض", "Replaceable")],
    options: [],
    images: [fountain, feeder],
    tags: ["trending", "pick"],
    addedOrder: 12,
  },
  {
    id: "ceramic-bowl",
    name: L("ظرف غذای سرامیکی دوقلو", "Twin Ceramic Bowl Set"),
    price: 420000,
    category: "food-water",
    short: L("دو کاسه با پایه", "Two bowls on a stand"),
    description: L("دو کاسه سرامیکی برای غذا و آب روی یک پایه.", "Two ceramic bowls for food and water on a single stand."),
    specs: [spec("جنس کاسه", "Bowl material", "سرامیک", "Ceramic")],
    options: [],
    images: [feeder],
    tags: [],
    addedOrder: 5,
  },
  // ---- Toys ----
  {
    id: "feather-ball",
    name: L("توپ متحرک پردار", "Self-rolling Feather Ball"),
    price: 390000,
    category: "toys",
    short: L("حرکت خودکار، شارژی", "Rolls by itself, rechargeable"),
    description: L("توپ شارژی که به‌صورت خودکار می‌چرخد و گربه را به بازی تشویق می‌کند.", "Rechargeable ball that rolls on its own to encourage play."),
    specs: [spec("شارژ", "Charging", "USB", "USB"), spec("مناسب", "Suitable for", "گربه", "Cats")],
    options: [],
    images: [toy],
    tags: ["trending", "pick"],
    addedOrder: 21,
  },
  {
    id: "teaser-wand",
    name: L("چوب بازی پردار گربه", "Feather Teaser Wand"),
    price: 120000,
    category: "toys",
    short: L("بازی تعاملی با گربه", "Interactive play with your cat"),
    description: L("چوب بازی سبک با پر قابل تعویض.", "Lightweight teaser wand with a replaceable feather."),
    specs: [spec("طول", "Length", "حدود ۶۰ سانتی‌متر", "About 60 cm")],
    options: [],
    images: [toy],
    tags: ["recommended"],
    addedOrder: 9,
  },
  {
    id: "chew-rope",
    name: L("طناب جویدنی سگ", "Dog Chew Rope"),
    price: 160000,
    oldPrice: 190000,
    category: "toys",
    short: L("طناب کتانی گره‌دار", "Knotted cotton rope"),
    description: L("طناب کتانی برای بازی کشیدنی و جویدن.", "Cotton rope for tug games and chewing."),
    specs: [spec("جنس", "Material", "نخ کتان", "Cotton")],
    options: [petSizes],
    images: [toy],
    tags: [],
    addedOrder: 6,
  },
  // ---- Collars & accessories ----
  {
    id: "leather-collar",
    name: L("قلاده چرمی با پلاک", "Leather Collar with ID Tag"),
    price: 450000,
    category: "collars",
    short: L("پلاک قابل حکاکی", "Engravable tag"),
    description: L("قلاده چرمی با سگک فلزی و پلاک شناسایی.", "Leather collar with a metal buckle and ID tag."),
    specs: [spec("جنس", "Material", "چرم", "Leather")],
    options: [petSizes],
    images: [tracker],
    tags: ["pick"],
    addedOrder: 11,
  },
  {
    id: "knit-sweater",
    name: L("پلیور بافت یقه‌اسکی", "Turtleneck Knit Sweater"),
    price: 520000,
    oldPrice: 650000,
    category: "collars",
    short: L("مناسب سگ‌ها و گربه‌های کوچک", "For small dogs and cats"),
    description: L("پلیور بافتنی نرم برای روزهای سرد.", "Soft knitted sweater for cold days."),
    specs: [spec("جنس", "Material", "اکریلیک", "Acrylic")],
    options: [petSizes, { type: "color", values: [L("کرم", "Cream"), L("قهوه‌ای", "Brown")] }],
    images: [sweater],
    tags: ["trending"],
    addedOrder: 17,
  },
  {
    id: "walking-leash",
    name: L("بند گردش قابل تنظیم", "Adjustable Walking Leash"),
    price: 380000,
    category: "collars",
    short: L("دسته نرم، قفل فلزی", "Padded handle, metal clip"),
    description: L("بند گردش با طول قابل تنظیم و دسته نرم.", "Walking leash with adjustable length and a padded handle."),
    specs: [spec("طول", "Length", "۱.۲ تا ۲ متر", "1.2–2 m")],
    options: [],
    images: [tracker],
    tags: [],
    addedOrder: 4,
  },
  // ---- Hygiene ----
  {
    id: "walnut-brush",
    name: L("برس دسته چوبی", "Wooden-handle Grooming Brush"),
    price: 290000,
    category: "hygiene",
    short: L("مناسب موهای کوتاه و بلند", "For short and long coats"),
    description: L("برس با دسته چوبی برای مرتب‌کردن موی حیوان.", "Wooden-handle brush for tidying your pet's coat."),
    specs: [spec("دسته", "Handle", "چوب", "Wood")],
    options: [],
    images: [grooming],
    tags: ["recommended"],
    addedOrder: 3,
  },
  {
    id: "covered-litter",
    name: L("ظرف خاک درب‌دار", "Covered Litter Box"),
    price: 780000,
    category: "hygiene",
    short: L("درب ورودی و فیلتر بو", "Entry flap and odour filter"),
    description: L("ظرف خاک بزرگ با سقف، درب ورودی و جای فیلتر.", "Large hooded litter box with an entry flap and filter slot."),
    specs: [spec("جنس", "Material", "پلاستیک", "Plastic")],
    options: [],
    images: [litter],
    tags: ["pick"],
    addedOrder: 10,
  },
  {
    id: "litter-scoop",
    name: L("بیلچه خاک گربه", "Litter Scoop"),
    price: 95000,
    category: "hygiene",
    short: L("دسته بلند، سوراخ‌های ریز", "Long handle, fine slots"),
    description: L("بیلچه پلاستیکی محکم برای تمیزکردن ظرف خاک.", "Sturdy plastic scoop for cleaning the litter box."),
    specs: [spec("جنس", "Material", "پلاستیک", "Plastic")],
    options: [],
    images: [litter],
    tags: [],
    addedOrder: 2,
  },
  // ---- Beds & carriers ----
  {
    id: "orthopedic-bed",
    name: L("تخت گرد بوکله", "Round Bouclé Bed"),
    price: 1850000,
    oldPrice: 2150000,
    category: "beds-carriers",
    short: L("فوم داخلی، روکش جداشونده", "Foam insert, removable cover"),
    description: L("تخت گرد نرم با روکش بوکله که برای شستشو جدا می‌شود.", "Soft round bed with a bouclé cover that unzips for washing."),
    specs: [spec("روکش", "Cover", "بوکله، قابل شستشو", "Bouclé, washable")],
    options: [petSizes],
    images: [bed],
    tags: ["pick", "recommended"],
    addedOrder: 7,
  },
  {
    id: "bubble-carrier",
    name: L("کوله حمل پنجره‌دار", "Window Carrier Backpack"),
    price: 1650000,
    category: "beds-carriers",
    short: L("سوراخ‌های تهویه، بند دوشی", "Air vents, shoulder straps"),
    description: L("کوله‌پشتی حمل حیوانات کوچک با پنجره شفاف و سوراخ‌های تهویه.", "Backpack carrier for small pets with a clear window and air vents."),
    specs: [spec("مناسب", "Suitable for", "گربه و سگ کوچک", "Cats and small dogs")],
    options: [],
    images: [carrier],
    tags: ["trending"],
    addedOrder: 13,
  },
  {
    id: "cooling-mat",
    name: L("تشک خنک تابستانی", "Summer Cooling Mat"),
    price: 650000,
    category: "beds-carriers",
    short: L("سطح خنک، تاشو", "Cool surface, foldable"),
    description: L("تشک سبک و تاشو برای روزهای گرم.", "Light, foldable mat for warm days."),
    specs: [spec("ابعاد", "Size", "بسته به سایز", "Depends on size")],
    options: [petSizes],
    images: [bed],
    tags: [],
    addedOrder: 1,
  },
  // ---- Gadgets ----
  {
    id: "wireless-earbuds",
    name: L("هندزفری بی‌سیم", "Wireless Earbuds"),
    price: 1450000,
    oldPrice: 1690000,
    category: "gadgets",
    short: L("کیس شارژ، بلوتوث", "Charging case, Bluetooth"),
    description: L("هندزفری بی‌سیم بلوتوثی همراه با کیس شارژ.", "Bluetooth wireless earbuds with a charging case."),
    specs: [spec("اتصال", "Connection", "بلوتوث", "Bluetooth"), spec("شارژ", "Charging", "USB-C", "USB-C")],
    options: [{ type: "color", values: [L("سفید", "White"), L("مشکی", "Black")] }],
    images: [earbuds],
    tags: ["trending", "pick"],
    addedOrder: 23,
  },
  {
    id: "3in1-charger",
    name: L("پایه شارژ بی‌سیم ۳ در ۱", "3-in-1 Wireless Charging Stand"),
    price: 1690000,
    category: "gadgets",
    short: L("گوشی، ساعت و هندزفری", "Phone, watch and earbuds"),
    description: L("پایه شارژ بی‌سیم برای شارژ هم‌زمان سه دستگاه سازگار.", "Wireless stand that charges three compatible devices at once."),
    specs: [spec("ورودی", "Input", "USB-C", "USB-C")],
    options: [],
    images: [charger],
    tags: ["recommended"],
    addedOrder: 24,
  },
  {
    id: "star-projector",
    name: L("چراغ خواب پروژکتوری", "Projector Night Light"),
    price: 890000,
    category: "gadgets",
    short: L("نور ملایم روی سقف", "Soft light on the ceiling"),
    description: L("چراغ خواب کوچک که طرح نوری روی سقف و دیوار می‌اندازد.", "Small night light that projects a light pattern on ceiling and walls."),
    specs: [spec("برق", "Power", "USB", "USB")],
    options: [],
    images: [projector],
    tags: ["trending"],
    addedOrder: 25,
  },
  {
    id: "home-camera",
    name: L("دوربین Wi-Fi خانگی", "Home Wi-Fi Camera"),
    price: 1750000,
    category: "gadgets",
    short: L("دیدن حیوان خانگی از راه دور", "Check on your pet remotely"),
    description: L("دوربین Wi-Fi کوچک برای دیدن تصویر خانه روی گوشی.", "Compact Wi-Fi camera to view your home on your phone."),
    specs: [spec("اتصال", "Connection", "Wi-Fi", "Wi-Fi")],
    options: [],
    images: [camera],
    tags: ["pick"],
    addedOrder: 26,
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function byTag(tag: ProductTag) {
  return products.filter((p) => p.tags.includes(tag));
}

export function hasDiscount(p: Product) {
  return !!p.oldPrice && p.oldPrice > p.price;
}

export function onSale() {
  return products.filter(hasDiscount);
}

export function discountPercent(p: Product) {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0;
  return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
}

export function relatedProducts(p: Product, count = 4) {
  return products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, count);
}

export type SortKey = "newest" | "price-asc" | "price-desc";
export const sortKeys: SortKey[] = ["newest", "price-asc", "price-desc"];

export type ProductFilter = {
  q?: string;
  cat?: string;
  sub?: string;
  sale?: boolean;
  min?: number;
  max?: number;
  sort?: SortKey;
};

export function filterProducts(opts: ProductFilter) {
  const q = opts.q?.trim().toLowerCase();
  const list = products.filter((p) => {
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
      return [...list].sort((a, b) => b.addedOrder - a.addedOrder);
  }
}
