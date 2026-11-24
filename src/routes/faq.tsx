import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site-config";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs } from "@/data/pages";
import { useI18n } from "@/lib/i18n";
import { useStoreContent } from "@/lib/store-content";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "پرسش‌های متداول | ناب استور" },
      { name: "description", content: "پاسخ پرسش‌های پرتکرار درباره سفارش، پرداخت، ارسال و بازگشت کالا در ناب استور." },
      { property: "og:title", content: "پرسش‌های متداول | ناب استور" },
      { property: "og:description", content: "سفارش، پرداخت، ارسال و بازگشت کالا در ناب استور." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${siteUrl}/faq` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${siteUrl}/faq` }],
  }),
  component: Faq,
});

function Faq() {
  const { t, l } = useI18n();
  const content = useStoreContent();
  const questions = Array.isArray(content.data?.["faq"]) && content.data["faq"].every((item: any) => item?.q?.fa && item?.q?.en && item?.a?.fa && item?.a?.en) ? content.data["faq"] : faqs;
  const shipping = content.data?.["shipping"];
  const shippingFee = Number(shipping?.flatFeeToman);
  const freeAbove = Number(shipping?.freeAboveToman);
  const validShipping = Number.isSafeInteger(shippingFee) && shippingFee >= 0 && Number.isSafeInteger(freeAbove) && freeAbove >= 0;
  const shippingAnswer = validShipping
    ? shipping?.enabled === false || shippingFee === 0
      ? { fa: "ارسال سفارش‌ها رایگان است.", en: "Shipping is free." }
      : freeAbove > 0
        ? {
            fa: `هزینه ارسال عادی ${shippingFee.toLocaleString("fa-IR")} تومان است و برای سفارش‌های ${freeAbove.toLocaleString("fa-IR")} تومان و بیشتر رایگان خواهد بود.`,
            en: `Standard shipping is ${shippingFee.toLocaleString("en-US")} Toman and free for orders of ${freeAbove.toLocaleString("en-US")} Toman or more.`,
          }
        : {
            fa: `هزینه ارسال عادی ${shippingFee.toLocaleString("fa-IR")} تومان است.`,
            en: `Standard shipping is ${shippingFee.toLocaleString("en-US")} Toman.`,
          }
    : null;
  const synchronizedQuestions = questions.map((item: typeof faqs[number]) => {
    const questionFa = String(item.q.fa ?? "");
    const questionEn = String(item.q.en ?? "").toLowerCase();
    const asksShippingCost = questionFa.includes("هزینه ارسال") || questionEn.includes("shipping");
    return asksShippingCost && shippingAnswer ? { ...item, a: shippingAnswer } : item;
  });
  return (
    <section className="container-page max-w-3xl pt-10">
      <h1 className="text-3xl font-bold">{t("faq")}</h1>
      <Accordion type="single" collapsible className="mt-8 rounded-2xl border bg-card px-5">
        {synchronizedQuestions.map((f: typeof faqs[number], i: number) => (
          <AccordionItem key={i} value={`q${i}`}>
            <AccordionTrigger className="text-start">{l(f.q)}</AccordionTrigger>
            <AccordionContent className="leading-7 text-foreground/80">{l(f.a)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
