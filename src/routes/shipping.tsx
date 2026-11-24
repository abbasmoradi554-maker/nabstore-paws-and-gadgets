import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site-config";

import { InfoPage } from "@/components/site/InfoPage";
import { pages } from "@/data/pages";
import { useStoreContent } from "@/lib/store-content";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "ارسال سفارش | ناب استور" },
      { name: "description", content: "نحوه، هزینه و زمان ارسال سفارش‌های ناب استور به سراسر کشور." },
      { property: "og:title", content: "ارسال سفارش | ناب استور" },
      { property: "og:description", content: "نحوه، هزینه و زمان ارسال سفارش‌های ناب استور به سراسر کشور." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${siteUrl}/shipping` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${siteUrl}/shipping` }],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  const content = useStoreContent();
  const shipping = content.data?.["shipping"];
  const fee = Number(shipping?.flatFeeToman);
  const freeAbove = Number(shipping?.freeAboveToman);
  const valid = Number.isSafeInteger(fee) && fee >= 0 && Number.isSafeInteger(freeAbove) && freeAbove >= 0;

  if (!valid) return <InfoPage page={pages.shipping} />;

  const copy = shipping?.enabled === false || fee === 0
    ? {
        fa: "در حال حاضر هزینه ارسال سفارش‌ها رایگان است. مبلغ نهایی پیش از ثبت سفارش نمایش داده می‌شود.",
        en: "Shipping is currently free. The final amount is shown before you place your order.",
      }
    : freeAbove > 0
      ? {
          fa: `هزینه ارسال عادی ${fee.toLocaleString("fa-IR")} تومان است. برای سفارش‌های ${freeAbove.toLocaleString("fa-IR")} تومان و بیشتر، ارسال رایگان خواهد بود. مبلغ نهایی پیش از ثبت سفارش نمایش داده می‌شود.`,
          en: `Standard shipping is ${fee.toLocaleString("en-US")} Toman. Orders of ${freeAbove.toLocaleString("en-US")} Toman or more ship free. The final amount is shown before you place your order.`,
        }
      : {
          fa: `هزینه ارسال عادی ${fee.toLocaleString("fa-IR")} تومان است. مبلغ نهایی پیش از ثبت سفارش نمایش داده می‌شود.`,
          en: `Standard shipping is ${fee.toLocaleString("en-US")} Toman. The final amount is shown before you place your order.`,
        };

  const page = {
    ...pages.shipping,
    intro: copy,
    sections: pages.shipping.sections.map((section, index) =>
      index === 0 ? { ...section, body: copy } : section
    ),
  };
  return <InfoPage page={page} />;
}
