import type { InfoPage as InfoPageData } from "@/data/pages";
import { useI18n } from "@/lib/i18n";
import { pages as defaultPages } from "@/data/pages";
import { useStoreContent } from "@/lib/store-content";

export function InfoPage({ page }: { page: InfoPageData }) {
  const { l } = useI18n();
  const content = useStoreContent();
  const pageKey = Object.entries(defaultPages).find(([, value]) => value === page)?.[0];
  const candidate = pageKey ? content.data?.pages?.[pageKey] : null;
  const pageData = candidate?.title && candidate?.intro && Array.isArray(candidate?.sections) ? candidate : page;
  const shipping = content.data?.shipping;
  const shippingFee = Number.isSafeInteger(Number(shipping?.flatFeeToman)) ? Math.max(0, Number(shipping.flatFeeToman)) : 59000;
  const freeAbove = Number.isSafeInteger(Number(shipping?.freeAboveToman)) ? Math.max(0, Number(shipping.freeAboveToman)) : 2000000;
  const sections = pageKey === "shipping"
    ? [
        { title: { fa: "هزینه ارسال", en: "Shipping fee" }, body: { fa: shipping?.enabled === false ? "هزینه ارسال در حال حاضر غیرفعال است." : `هزینه ارسال ثابت ${new Intl.NumberFormat("fa-IR").format(shippingFee)} تومان است. برای خریدهای ${new Intl.NumberFormat("fa-IR").format(freeAbove)} تومان و بیشتر، ارسال رایگان خواهد بود.`, en: shipping?.enabled === false ? "Shipping fees are currently disabled." : `Standard shipping is ${shippingFee.toLocaleString("en-US")} Toman. Shipping is free on orders of ${freeAbove.toLocaleString("en-US")} Toman or more.` } },
        { title: { fa: "زمان و روش ارسال", en: "Delivery method" }, body: { fa: "سفارش‌ها پس از تأیید و آماده‌سازی با روش متناسب با مقصد ارسال می‌شوند. زمان تحویل به شرکت حمل و شهر مقصد بستگی دارد.", en: "Orders are dispatched after confirmation and preparation. Delivery time depends on the carrier and destination." } },
        ...pageData.sections.slice(1),
      ]
    : pageData.sections;
  return (
    <section className="container-page max-w-3xl pt-10">
      <h1 className="text-3xl font-bold">{l(pageData.title)}</h1>
      <p className="mt-4 leading-8 text-foreground/80">{l(pageData.intro)}</p>
      <div className="mt-8 grid gap-4">
        {sections.map((s: InfoPageData["sections"][number]) => (
          <div key={s.title.en} className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="font-bold">{l(s.title)}</h2>
            <p className="mt-2 text-sm leading-7 text-foreground/80">{l(s.body)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
