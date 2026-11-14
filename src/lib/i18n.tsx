import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "fa" | "en";
export type Localized = { fa: string; en: string };

const STORAGE_KEY = "nabstore-lang";

const dict = {
  previewNotice: {
    fa: "پیش‌نمایش طراحی فروشگاه — محصولات و قیمت‌ها فعلاً نمونه هستند و امکان خرید هنوز فعال نشده است.",
    en: "Store design preview — products and prices are samples for now and checkout is not live yet.",
  },
  searchPlaceholder: { fa: "جستجو در محصولات نبستور…", en: "Search NABSTORE products…" },
  search: { fa: "جستجو", en: "Search" },
  allCategories: { fa: "همه دسته‌بندی‌ها", en: "All categories" },
  categories: { fa: "دسته‌بندی‌ها", en: "Categories" },
  home: { fa: "خانه", en: "Home" },
  shop: { fa: "فروشگاه", en: "Shop" },
  trendingNow: { fa: "ترندهای روز", en: "Trending Now" },
  offers: { fa: "پیشنهادهای ویژه", en: "Special Offers" },
  contact: { fa: "پشتیبانی و تماس", en: "Support & Contact" },
  account: { fa: "ورود / ثبت‌نام", en: "Sign in" },
  wishlist: { fa: "علاقه‌مندی‌ها", en: "Wishlist" },
  cart: { fa: "سبد خرید", en: "Cart" },
  menu: { fa: "منو", en: "Menu" },
  comingSoon: { fa: "این بخش در مرحله بعدی فعال می‌شود.", en: "This feature arrives in the next stage." },
  addToCart: { fa: "افزودن به سبد", en: "Add to cart" },
  addToWishlist: { fa: "افزودن به علاقه‌مندی", en: "Add to wishlist" },
  viewAll: { fa: "مشاهده همه", en: "View all" },
  toman: { fa: "تومان", en: "Toman" },
  off: { fa: "تخفیف", en: "off" },
  badgeNew: { fa: "جدید", en: "New" },
  badgeTrending: { fa: "ترند", en: "Trending" },

  heroEyebrow: { fa: "مجموعه جدید فصل", en: "New season collection" },
  heroTitle: { fa: "آسایش هوشمند برای همراهان کوچک شما", en: "Smart comfort for your little companions" },
  heroText: {
    fa: "محصولات باکیفیت برای گربه‌ها و سگ‌ها، همراه با جدیدترین گجت‌های روز — با قیمت‌هایی منصفانه.",
    en: "Quality essentials for cats and dogs, alongside the latest gadgets — at fair, competitive prices.",
  },
  heroCta: { fa: "خرید کنید", en: "Shop now" },
  heroCta2: { fa: "ترندهای روز", en: "See what's trending" },
  promoTechTitle: { fa: "گجت‌های ترند", en: "Trending gadgets" },
  promoTechText: { fa: "تکنولوژی کاربردی برای زندگی روزمره", en: "Useful tech for everyday life" },
  promoSmartTitle: { fa: "خانه هوشمند حیوان خانگی", en: "The smart pet home" },
  promoSmartText: { fa: "ظرف غذا، آبخوری و دوربین هوشمند", en: "Smart feeders, fountains and cameras" },

  valueGenuine: { fa: "ضمانت اصالت کالا", en: "Authenticity guaranteed" },
  valueGenuineText: { fa: "انتخاب‌شده از برندهای معتبر", en: "Sourced from trusted brands" },
  valueShipping: { fa: "ارسال به سراسر ایران", en: "Shipping across Iran" },
  valueShippingText: { fa: "بسته‌بندی ایمن و استاندارد", en: "Safe, careful packaging" },
  valueSupport: { fa: "پشتیبانی پاسخگو", en: "Responsive support" },
  valueSupportText: { fa: "مشاوره پیش و پس از خرید", en: "Help before and after you buy" },
  valuePrice: { fa: "قیمت رقابتی", en: "Competitive prices" },
  valuePriceText: { fa: "کیفیت بالا، قیمت منصفانه", en: "High quality, fair price" },

  catTitle: { fa: "خرید بر اساس دسته‌بندی", en: "Shop by category" },
  catSubtitle: { fa: "هر آنچه همراه شما نیاز دارد، در یک جا", en: "Everything your companion needs, in one place" },
  trendingSubtitle: { fa: "محبوب‌ترین انتخاب‌های این هفته", en: "This week's most-loved picks" },
  newArrivals: { fa: "تازه‌ها", en: "New Arrivals" },
  newArrivalsSubtitle: { fa: "جدیدترین محصولات اضافه‌شده", en: "The latest additions to the store" },
  bestSellers: { fa: "پرفروش‌ها", en: "Best Sellers" },
  bestSellersSubtitle: { fa: "انتخاب‌های همیشگی مشتریان", en: "Customer favourites" },
  recommended: { fa: "پیشنهاد نبستور", en: "Recommended for you" },
  recommendedSubtitle: { fa: "گلچین تیم ما برای شما", en: "Hand-picked by our team" },
  offersTitle: { fa: "تخفیف‌های ویژه این هفته", en: "This week's special deals" },
  offersText: {
    fa: "منتخبی از محصولات محبوب با قیمت ویژه، تا پایان موجودی.",
    en: "A selection of popular products at special prices.",
  },
  offersCta: { fa: "مشاهده تخفیف‌ها", en: "View deals" },

  reviewsTitle: { fa: "نظرات مشتریان", en: "Customer reviews" },
  reviewsSubtitle: { fa: "فقط از خریداران تأییدشده", en: "From verified buyers only" },
  reviewsEmpty: {
    fa: "در نبستور فقط نظرات واقعی خریداران تأییدشده منتشر می‌شود. نخستین نظرات پس از ثبت سفارش‌های واقعی در این بخش نمایش داده خواهند شد.",
    en: "NABSTORE only publishes genuine reviews from verified buyers. The first reviews will appear here once real orders are delivered.",
  },
  reviewsPoint1: { fa: "نظر فقط پس از خرید", en: "Reviews only after purchase" },
  reviewsPoint2: { fa: "بدون امتیاز ساختگی", en: "No fabricated ratings" },
  reviewsPoint3: { fa: "بررسی و تأیید توسط تیم", en: "Moderated by our team" },

  supportTitle: { fa: "سؤالی دارید؟ کنار شما هستیم", en: "Questions? We're here to help" },
  supportText: {
    fa: "برای انتخاب محصول مناسب، پیگیری سفارش یا مشاوره، با تیم پشتیبانی نبستور در ارتباط باشید.",
    en: "Get help choosing the right product, tracking an order, or anything else from the NABSTORE team.",
  },
  supportCta: { fa: "ارتباط با پشتیبانی", en: "Contact support" },

  footerAbout: {
    fa: "نبستور؛ فروشگاه آنلاین محصولات باکیفیت برای گربه‌ها و سگ‌ها و گجت‌های ترند، با قیمت رقابتی.",
    en: "NABSTORE — an online store for quality cat & dog products and trending gadgets, at competitive prices.",
  },
  footerShop: { fa: "فروشگاه", en: "Shop" },
  footerHelp: { fa: "راهنما", en: "Help" },
  footerContact: { fa: "تماس با ما", en: "Contact us" },
  phone: { fa: "تلفن", en: "Phone" },
  email: { fa: "ایمیل", en: "Email" },
  toBeAnnounced: { fa: "به‌زودی اعلام می‌شود", en: "To be announced" },
  rights: { fa: "تمامی حقوق برای نبستور محفوظ است.", en: "All rights reserved." },
  followUs: { fa: "ما را دنبال کنید", en: "Follow us" },

  shopTitle: { fa: "همه محصولات", en: "All products" },
  results: { fa: "محصول", en: "products" },
  sortBy: { fa: "مرتب‌سازی", en: "Sort by" },
  sortFeatured: { fa: "پیشنهادی", en: "Featured" },
  sortNewest: { fa: "جدیدترین", en: "Newest" },
  sortPriceAsc: { fa: "ارزان‌ترین", en: "Price: low to high" },
  sortPriceDesc: { fa: "گران‌ترین", en: "Price: high to low" },
  onlyOffers: { fa: "فقط تخفیف‌دار", en: "Deals only" },
  noResults: { fa: "محصولی با این مشخصات پیدا نشد.", en: "No products match your search." },
  clearFilters: { fa: "حذف فیلترها", en: "Clear filters" },
  resultsFor: { fa: "نتایج جستجو برای", en: "Results for" },

  contactTitle: { fa: "پشتیبانی نبستور", en: "NABSTORE support" },
  faqTitle: { fa: "پرسش‌های پرتکرار", en: "Frequently asked questions" },
  hours: { fa: "ساعات پاسخگویی", en: "Support hours" },
  socials: { fa: "شبکه‌های اجتماعی", en: "Social media" },
  notFoundCategory: { fa: "این دسته‌بندی پیدا نشد.", en: "This category doesn't exist." },
  backToShop: { fa: "بازگشت به فروشگاه", en: "Back to shop" },
  language: { fa: "English", en: "فارسی" },
} satisfies Record<string, Localized>;

export type DictKey = keyof typeof dict;

type I18nValue = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: DictKey) => string;
  l: (value: Localized) => string;
  price: (toman: number) => string;
  num: (n: number) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function formatNumber(n: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(n);
}

export function formatToman(toman: number, lang: Lang) {
  return `${formatNumber(toman, lang)} ${dict.toman[lang]}`;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "fa") setLangState(saved);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "fa" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      dir: lang === "fa" ? "rtl" : "ltr",
      setLang,
      toggleLang: () => setLang(lang === "fa" ? "en" : "fa"),
      t: (key) => dict[key][lang],
      l: (v) => v[lang],
      price: (n) => formatToman(n, lang),
      num: (n) => formatNumber(n, lang),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
