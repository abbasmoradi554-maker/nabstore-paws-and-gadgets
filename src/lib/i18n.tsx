import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "fa" | "en";
export type Localized = { fa: string; en: string };

const STORAGE_KEY = "nabstore-lang";

const dict = {
  previewNotice: {
    fa: "موجودی و هزینه ارسال پس از ثبت سفارش توسط پشتیبانی با شما هماهنگ می‌شود.",
    en: "Availability and shipping cost are confirmed by support after you order.",
  },
  searchPlaceholder: { fa: "جستجو در ناب استور…", en: "Search NABSTORE…" },
  search: { fa: "جستجو", en: "Search" },
  allCategories: { fa: "همه دسته‌بندی‌ها", en: "All categories" },
  categories: { fa: "دسته‌بندی‌ها", en: "Categories" },
  home: { fa: "خانه", en: "Home" },
  shop: { fa: "فروشگاه", en: "Shop" },
  trendingNow: { fa: "ترندهای روز", en: "Trending Now" },
  offers: { fa: "پیشنهادهای ویژه", en: "Special Offers" },
  contact: { fa: "تماس با ما", en: "Contact" },
  account: { fa: "حساب کاربری", en: "Account" },
  wishlist: { fa: "علاقه‌مندی‌ها", en: "Wishlist" },
  cart: { fa: "سبد خرید", en: "Cart" },
  menu: { fa: "منو", en: "Menu" },
  comingSoon: { fa: "این بخش در مرحله بعدی فعال می‌شود.", en: "This feature arrives in a later stage." },
  addToCart: { fa: "افزودن به سبد", en: "Add to cart" },
  addToWishlist: { fa: "افزودن به علاقه‌مندی", en: "Add to wishlist" },
  viewAll: { fa: "مشاهده همه", en: "View all" },
  toman: { fa: "تومان", en: "Toman" },
  off: { fa: "تخفیف", en: "off" },
  badgeNew: { fa: "جدید", en: "New" },
  badgeTrending: { fa: "ترند", en: "Trending" },
  sampleBadge: { fa: "نمونه", en: "Sample" },

  heroEyebrow: { fa: "مجموعه جدید فصل", en: "New season collection" },
  heroTitle: { fa: "آسایش هوشمند برای همراهان کوچک شما", en: "Smart comfort for your little companions" },
  heroText: {
    fa: "قاب و لوازم جانبی گوشی، محصولات گربه و سگ و گجت‌های کاربردی — با قیمت‌هایی منصفانه.",
    en: "Phone cases and accessories, cat & dog essentials and handy gadgets — at fair prices.",
  },
  heroCta: { fa: "خرید کنید", en: "Shop now" },
  heroCta2: { fa: "ترندهای روز", en: "See what's trending" },
  promoTechTitle: { fa: "گجت‌های ترند", en: "Trending gadgets" },
  promoTechText: { fa: "تکنولوژی کاربردی برای زندگی روزمره", en: "Useful tech for everyday life" },
  promoPhoneTitle: { fa: "قاب گوشی و لوازم جانبی", en: "Phone cases & accessories" },
  promoPhoneText: { fa: "قاب، گلس، محافظ لنز و هولدر", en: "Cases, screen guards, lens protectors and holders" },

  valueShipping: { fa: "ارسال به سراسر کشور", en: "Nationwide shipping" },
  valueShippingText: { fa: "هزینه ارسال هنگام تأیید سفارش اعلام می‌شود", en: "Shipping cost is confirmed with your order" },
  valuePackaging: { fa: "بسته‌بندی ایمن", en: "Safe packaging" },
  valuePackagingText: { fa: "بسته‌بندی مناسب برای حمل", en: "Packed carefully for transit" },
  valueSupport: { fa: "پشتیبانی پیش و پس از فروش", en: "Pre- and post-sale support" },
  valueSupportText: { fa: "پاسخ به پرسش‌های محصول و سفارش", en: "Help with products and orders" },
  valueReturns: { fa: "مرجوعی طبق قوانین فروشگاه", en: "Returns per store policy" },
  valueReturnsText: { fa: "شرایط در صفحه رویه بازگشت کالا", en: "See the returns policy page" },

  catTitle: { fa: "خرید بر اساس دسته‌بندی", en: "Shop by category" },
  catSubtitle: { fa: "هر آنچه نیاز دارید، در یک جا", en: "Everything you need, in one place" },
  trendingSubtitle: { fa: "ترندهای تازه", en: "Fresh trends" },
  newArrivals: { fa: "تازه‌ها", en: "New Arrivals" },
  newArrivalsSubtitle: { fa: "جدیدترین محصولات اضافه‌شده", en: "The latest additions to the store" },
  bestSellers: { fa: "منتخب‌ها", en: "Our Picks" },
  bestSellersSubtitle: { fa: "گلچینی از محصولات فروشگاه", en: "A selection from the store" },
  recommended: { fa: "پیشنهاد ناب استور", en: "Recommended" },
  recommendedSubtitle: { fa: "گلچین تیم ما برای شما", en: "Hand-picked by our team" },
  offersTitle: { fa: "تخفیف‌های ویژه", en: "Special deals" },
  offersText: { fa: "منتخبی از محصولات با قیمت ویژه.", en: "A selection of products at special prices." },
  offersCta: { fa: "مشاهده تخفیف‌ها", en: "View deals" },

  reviewsTitle: { fa: "نظرات مشتریان", en: "Customer reviews" },
  reviewsSubtitle: { fa: "فقط از خریداران تأییدشده", en: "From verified buyers only" },
  reviewsEmpty: {
    fa: "در ناب استور فقط نظرات واقعی خریداران تأییدشده منتشر می‌شود. نخستین نظرات پس از تحویل سفارش‌های واقعی در این بخش نمایش داده خواهند شد.",
    en: "NABSTORE only publishes genuine reviews from verified buyers. The first reviews will appear here once real orders are delivered.",
  },
  reviewsPoint1: { fa: "نظر فقط پس از خرید", en: "Reviews only after purchase" },
  reviewsPoint2: { fa: "بدون امتیاز ساختگی", en: "No fabricated ratings" },
  reviewsPoint3: { fa: "بررسی و تأیید توسط تیم", en: "Moderated by our team" },

  supportTitle: { fa: "سؤالی دارید؟ کنار شما هستیم", en: "Questions? We're here to help" },
  supportText: {
    fa: "برای انتخاب محصول مناسب، پیگیری سفارش یا مشاوره، با پشتیبانی ناب استور در ارتباط باشید.",
    en: "Get help choosing a product, tracking an order, or anything else from the NABSTORE team.",
  },
  supportCta: { fa: "ارتباط با پشتیبانی", en: "Contact support" },

  footerAbout: {
    fa: "ناب استور؛ فروشگاه آنلاین قاب و لوازم جانبی گوشی، محصولات گربه و سگ و گجت‌های ترند.",
    en: "NABSTORE — an online store for phone accessories, cat & dog products and trending gadgets.",
  },
  footerShop: { fa: "دسته‌بندی‌ها", en: "Categories" },
  footerHelp: { fa: "راهنما", en: "Help" },
  footerPolicies: { fa: "قوانین", en: "Policies" },
  footerContact: { fa: "تماس با ما", en: "Contact us" },
  phone: { fa: "تلفن", en: "Phone" },
  email: { fa: "ایمیل", en: "Email" },
  address: { fa: "نشانی", en: "Address" },
  toBeAnnounced: { fa: "به‌زودی اعلام می‌شود", en: "To be announced" },
  rights: { fa: "تمامی حقوق برای ناب استور محفوظ است.", en: "All rights reserved." },
  followUs: { fa: "ما را دنبال کنید", en: "Follow us" },
  enamadSlot: { fa: "جای نماد اعتماد الکترونیکی", en: "e-Trust (Enamad) badge space" },

  about: { fa: "درباره ما", en: "About" },
  terms: { fa: "قوانین و مقررات", en: "Terms" },
  returns: { fa: "رویه بازگشت کالا", en: "Returns policy" },
  shipping: { fa: "ارسال", en: "Shipping" },
  privacy: { fa: "حریم خصوصی", en: "Privacy" },
  faq: { fa: "پرسش‌های متداول", en: "FAQ" },

  shopTitle: { fa: "همه محصولات", en: "All products" },
  results: { fa: "محصول", en: "products" },
  sortBy: { fa: "مرتب‌سازی", en: "Sort by" },
  sortNewest: { fa: "جدیدترین", en: "Newest" },
  sortPriceAsc: { fa: "ارزان‌ترین", en: "Cheapest" },
  sortPriceDesc: { fa: "گران‌ترین", en: "Most expensive" },
  onlyOffers: { fa: "فقط تخفیف‌دار", en: "Deals only" },
  noResults: { fa: "محصولی با این مشخصات پیدا نشد.", en: "No products match your search." },
  clearFilters: { fa: "حذف فیلترها", en: "Clear filters" },
  resultsFor: { fa: "نتایج جستجو برای", en: "Results for" },
  priceRange: { fa: "بازه قیمت", en: "Price range" },
  priceUpTo: { fa: "تا", en: "Up to" },
  priceOver: { fa: "بالای", en: "Over" },
  anyPrice: { fa: "همه قیمت‌ها", en: "Any price" },
  minPrice: { fa: "از (تومان)", en: "From (Toman)" },
  maxPrice: { fa: "تا (تومان)", en: "To (Toman)" },
  apply: { fa: "اعمال", en: "Apply" },
  allSubcategories: { fa: "همه", en: "All" },
  filters: { fa: "فیلترها", en: "Filters" },

  optModel: { fa: "مدل گوشی", en: "Phone model" },
  optColor: { fa: "رنگ", en: "Colour" },
  optSize: { fa: "سایز", en: "Size" },
  optDesign: { fa: "طرح", en: "Design" },
  quantity: { fa: "تعداد", en: "Quantity" },
  increase: { fa: "افزایش", en: "Increase" },
  decrease: { fa: "کاهش", en: "Decrease" },
  description: { fa: "توضیحات", en: "Description" },
  specs: { fa: "مشخصات", en: "Specifications" },
  shippingNoteTitle: { fa: "ارسال و بازگشت", en: "Shipping & returns" },
  shippingNote: {
    fa: "ارسال به سراسر کشور انجام می‌شود و هزینه و زمان آن هنگام تأیید سفارش اعلام می‌شود. بازگشت کالا طبق رویه بازگشت کالای فروشگاه است.",
    en: "We ship nationwide; cost and timing are confirmed with your order. Returns follow the store's returns policy.",
  },
  related: { fa: "محصولات مرتبط", en: "Related products" },
  addedToCart: { fa: "به سبد خرید اضافه شد", en: "Added to cart" },
  viewCart: { fa: "مشاهده سبد", en: "View cart" },
  chooseOptions: { fa: "انتخاب گزینه‌ها", en: "Choose options" },
  outOfStock: { fa: "ناموجود", en: "Out of stock" },
  catalogEmptyTitle: { fa: "هنوز محصولی ثبت نشده است", en: "No products yet" },
  catalogEmpty: {
    fa: "فروشگاه در حال آماده‌سازی است. محصولات واقعی پس از افزودن توسط مدیر فروشگاه در این بخش نمایش داده می‌شوند.",
    en: "The store is being prepared. Real products will appear here once the store admin adds them.",
  },
  productNotFound: { fa: "این محصول پیدا نشد.", en: "This product doesn't exist." },

  cartTitle: { fa: "سبد خرید", en: "Shopping cart" },
  cartEmpty: { fa: "سبد خرید شما خالی است.", en: "Your cart is empty." },
  continueShopping: { fa: "ادامه خرید", en: "Continue shopping" },
  remove: { fa: "حذف", en: "Remove" },
  total: { fa: "جمع کل", en: "Total" },
  shippingLater: { fa: "هزینه ارسال پس از تأیید سفارش اعلام می‌شود.", en: "Shipping cost is confirmed after your order is reviewed." },
  goCheckout: { fa: "ثبت سفارش", en: "Checkout" },

  checkoutTitle: { fa: "ثبت سفارش", en: "Checkout" },
  fName: { fa: "نام و نام خانوادگی", en: "Full name" },
  fMobile: { fa: "شماره موبایل", en: "Mobile number" },
  fProvince: { fa: "استان", en: "Province" },
  fCity: { fa: "شهر", en: "City" },
  fAddress: { fa: "نشانی کامل", en: "Full address" },
  fPostal: { fa: "کد پستی ۱۰ رقمی", en: "10-digit postal code" },
  fNotes: { fa: "توضیحات (اختیاری)", en: "Notes (optional)" },
  chooseProvince: { fa: "انتخاب استان", en: "Choose province" },
  submitOrder: { fa: "ثبت سفارش", en: "Place order" },
  submitting: { fa: "در حال ثبت…", en: "Placing order…" },
  paymentNote: { fa: "پرداخت پس از تأیید سفارش توسط پشتیبانی هماهنگ می‌شود", en: "Payment is arranged by support after your order is confirmed" },
  orderSummary: { fa: "خلاصه سفارش", en: "Order summary" },
  orderPlaced: { fa: "سفارش شما ثبت شد", en: "Your order has been placed" },
  orderNumber: { fa: "شماره سفارش", en: "Order number" },
  orderSavedText: {
    fa: "پشتیبانی برای تأیید موجودی، هزینه ارسال و هماهنگی پرداخت با شما تماس می‌گیرد. شماره سفارش را نگه دارید.",
    en: "Support will contact you to confirm availability, shipping cost and payment. Keep your order number.",
  },
  sendTelegram: { fa: "ارسال سفارش در تلگرام", en: "Send order via Telegram" },
  sendWhatsapp: { fa: "ارسال سفارش در واتس‌اپ", en: "Send order via WhatsApp" },
  copySummary: { fa: "کپی خلاصه سفارش", en: "Copy order summary" },
  copied: { fa: "کپی شد", en: "Copied" },
  orderFailed: { fa: "ثبت سفارش انجام نشد. لطفاً دوباره تلاش کنید.", en: "We couldn't place your order. Please try again." },
  orderUnavailable: {
    fa: "برخی کالاهای سبد دیگر موجود یا فعال نیستند. لطفاً سبد خرید را بررسی کنید.",
    en: "Some items in your cart are no longer available. Please review your cart.",
  },
  orderInvalid: { fa: "اطلاعات سفارش معتبر نیست. لطفاً فرم را بررسی کنید.", en: "Order details are invalid. Please check the form." },
  backHome: { fa: "بازگشت به خانه", en: "Back to home" },
  nameRequired: { fa: "نام را وارد کنید.", en: "Enter your name." },
  nameTooLong: { fa: "نام بیش از حد طولانی است.", en: "Name is too long." },
  mobileInvalid: { fa: "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.", en: "Mobile must be 11 digits starting with 09." },
  provinceRequired: { fa: "استان را انتخاب کنید.", en: "Choose a province." },
  cityRequired: { fa: "شهر را وارد کنید.", en: "Enter your city." },
  cityTooLong: { fa: "نام شهر بیش از حد طولانی است.", en: "City name is too long." },
  addressRequired: { fa: "نشانی کامل را وارد کنید (حداقل ۱۰ حرف).", en: "Enter your full address (at least 10 characters)." },
  addressTooLong: { fa: "نشانی بیش از حد طولانی است.", en: "Address is too long." },
  postalInvalid: { fa: "کد پستی باید ۱۰ رقم باشد.", en: "Postal code must be 10 digits." },
  notesTooLong: { fa: "توضیحات حداکثر ۵۰۰ حرف است.", en: "Notes can be up to 500 characters." },

  contactTitle: { fa: "تماس با ناب استور", en: "Contact NABSTORE" },
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

/** Current Persian (Jalali) year without a thousands separator, e.g. ۱۴۰۵. */
export function jalaliYear(lang: Lang, date = new Date()) {
  return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR-u-ca-persian" : "en-US-u-ca-persian-nu-latn", {
    year: "numeric",
  })
    .format(date)
    .replace(/[^0-9۰-۹]/g, "");
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
