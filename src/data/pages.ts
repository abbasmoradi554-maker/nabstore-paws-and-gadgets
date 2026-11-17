import type { Localized } from "@/lib/i18n";

// Short, cautious policy texts. They claim nothing that has not been confirmed
// by the store owner; review and replace before launch.
export type InfoSection = { title: Localized; body: Localized };
export type InfoPage = { title: Localized; intro: Localized; sections: InfoSection[] };

const L = (fa: string, en: string): Localized => ({ fa, en });

export const pages = {
  about: {
    title: L("درباره ناب استور", "About NABSTORE"),
    intro: L(
      "ناب استور یک فروشگاه آنلاین تازه‌کار است که قاب و لوازم جانبی گوشی، محصولات گربه و سگ و گجت‌های کاربردی را در یک جا عرضه می‌کند.",
      "NABSTORE is a new online store offering phone accessories, cat & dog products and handy gadgets in one place.",
    ),
    sections: [
      {
        title: L("هدف ما", "Our aim"),
        body: L(
          "تلاش می‌کنیم محصولات کاربردی را با قیمت منصفانه و توضیحات روشن ارائه کنیم. فروشگاه در حال راه‌اندازی است و محصولات فعلی نمونه هستند.",
          "We aim to offer useful products at fair prices with clear descriptions. The store is launching and current products are samples.",
        ),
      },
      {
        title: L("نحوه کار", "How it works"),
        body: L(
          "پس از ثبت سفارش، پشتیبانی موجودی، هزینه ارسال و روش پرداخت را با شما هماهنگ می‌کند و سپس سفارش ارسال می‌شود.",
          "After you order, support confirms availability, shipping cost and payment with you before the order is shipped.",
        ),
      },
    ],
  },
  terms: {
    title: L("قوانین و مقررات", "Terms & conditions"),
    intro: L(
      "استفاده از وب‌سایت و ثبت سفارش در ناب استور به معنای پذیرش موارد زیر است. این متن ممکن است به‌روزرسانی شود.",
      "Using the site and ordering from NABSTORE means you accept the points below. This text may be updated.",
    ),
    sections: [
      {
        title: L("ثبت سفارش", "Placing orders"),
        body: L(
          "ثبت سفارش در سایت به معنای قطعی شدن خرید نیست. سفارش پس از تماس و تأیید پشتیبانی نهایی می‌شود.",
          "Submitting an order does not finalise a purchase. Orders are final once support has contacted you and confirmed them.",
        ),
      },
      {
        title: L("قیمت و موجودی", "Prices & availability"),
        body: L(
          "قیمت‌ها به تومان است. محصولات و قیمت‌های فعلی نمونه‌اند و قیمت و موجودی نهایی هنگام تأیید سفارش اعلام می‌شود.",
          "Prices are in Toman. Current products and prices are samples; final price and availability are confirmed with your order.",
        ),
      },
      {
        title: L("اطلاعات خریدار", "Customer details"),
        body: L(
          "خریدار مسئول درستی نام، شماره تماس و نشانی واردشده است.",
          "Customers are responsible for the accuracy of the name, phone number and address they enter.",
        ),
      },
    ],
  },
  returns: {
    title: L("رویه بازگشت کالا", "Returns policy"),
    intro: L(
      "در صورت وجود مشکل در کالای دریافتی، با پشتیبانی تماس بگیرید تا طبق شرایط زیر بررسی شود.",
      "If there is a problem with your item, contact support so it can be reviewed under the terms below.",
    ),
    sections: [
      {
        title: L("شرایط کلی", "General conditions"),
        body: L(
          "درخواست بازگشت باید در مدت اعلام‌شده توسط پشتیبانی ثبت شود و کالا استفاده‌نشده و در بسته‌بندی اصلی باشد.",
          "Return requests must be made within the period stated by support, with the item unused and in its original packaging.",
        ),
      },
      {
        title: L("کالای معیوب یا مغایر", "Faulty or wrong items"),
        body: L(
          "اگر کالا معیوب یا با سفارش مغایر باشد، پس از بررسی، تعویض یا بازگشت وجه با پشتیبانی هماهنگ می‌شود.",
          "If an item is faulty or not what you ordered, an exchange or refund is arranged with support after review.",
        ),
      },
      {
        title: L("هزینه ارسال بازگشت", "Return shipping"),
        body: L(
          "نحوه پرداخت هزینه ارسال بازگشت بسته به دلیل بازگشت، توسط پشتیبانی اعلام می‌شود.",
          "Who pays for return shipping depends on the reason and is confirmed by support.",
        ),
      },
    ],
  },
  shipping: {
    title: L("ارسال سفارش", "Shipping"),
    intro: L(
      "سفارش‌ها به سراسر کشور ارسال می‌شوند. روش، هزینه و زمان ارسال هنگام تأیید سفارش با شما هماهنگ می‌شود.",
      "Orders ship nationwide. Method, cost and timing are confirmed when your order is approved.",
    ),
    sections: [
      {
        title: L("هزینه ارسال", "Shipping cost"),
        body: L(
          "هزینه ارسال به شهر مقصد و وزن بسته بستگی دارد و پیش از پرداخت به شما اعلام می‌شود.",
          "Shipping cost depends on the destination and parcel weight, and is shared with you before payment.",
        ),
      },
      {
        title: L("بسته‌بندی", "Packaging"),
        body: L("سفارش‌ها با بسته‌بندی مناسب حمل ارسال می‌شوند.", "Orders are packed to suit transit."),
      },
    ],
  },
  privacy: {
    title: L("حریم خصوصی", "Privacy"),
    intro: L(
      "ناب استور اطلاعاتی را که هنگام ثبت سفارش وارد می‌کنید، فقط برای پردازش و ارسال سفارش استفاده می‌کند.",
      "NABSTORE uses the details you enter at checkout only to process and deliver your order.",
    ),
    sections: [
      {
        title: L("چه اطلاعاتی ذخیره می‌شود", "What we store"),
        body: L(
          "نام، شماره موبایل، نشانی، کد پستی، توضیحات و اقلام سفارش. سبد خرید فقط روی مرورگر خودتان نگه داشته می‌شود.",
          "Name, mobile, address, postal code, notes and ordered items. Your cart is kept only in your own browser.",
        ),
      },
      {
        title: L("اشتراک‌گذاری", "Sharing"),
        body: L(
          "اطلاعات شما فروخته نمی‌شود و فقط در حد لازم برای ارسال سفارش در اختیار شرکت حمل قرار می‌گیرد.",
          "Your details are not sold and are shared with the courier only as needed to deliver your order.",
        ),
      },
    ],
  },
} satisfies Record<string, InfoPage>;

export const faqs: { q: Localized; a: Localized }[] = [
  {
    q: L("محصولات سایت واقعی هستند؟", "Are the products real?"),
    a: L(
      "فروشگاه در حال راه‌اندازی است و محصولات و قیمت‌های فعلی نمونه‌اند. قیمت و موجودی نهایی هنگام تأیید سفارش اعلام می‌شود.",
      "The store is launching and current products and prices are samples. Final price and availability are confirmed with your order.",
    ),
  },
  {
    q: L("پرداخت چگونه انجام می‌شود؟", "How do I pay?"),
    a: L(
      "پرداخت پس از تأیید سفارش توسط پشتیبانی هماهنگ می‌شود. در حال حاضر پرداخت آنلاین در سایت فعال نیست.",
      "Payment is arranged by support after your order is confirmed. Online payment is not active on the site yet.",
    ),
  },
  {
    q: L("هزینه ارسال چقدر است؟", "How much is shipping?"),
    a: L("هزینه ارسال به شهر مقصد بستگی دارد و هنگام تأیید سفارش اعلام می‌شود.", "It depends on your city and is confirmed with your order."),
  },
  {
    q: L("امکان بازگشت کالا وجود دارد؟", "Can I return an item?"),
    a: L("بله، طبق رویه بازگشت کالای فروشگاه.", "Yes, under the store's returns policy."),
  },
  {
    q: L("چطور سفارشم را پیگیری کنم؟", "How do I track my order?"),
    a: L("با شماره سفارش از طریق راه‌های ارتباطی صفحه تماس با ما پیگیری کنید.", "Contact support with your order number using the details on the Contact page."),
  },
];
