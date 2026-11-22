import { createFileRoute } from "@tanstack/react-router";

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
      { property: "og:url", content: "https://nabstore-paws-and-gadgets.lovable.app/faq" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nabstore-paws-and-gadgets.lovable.app/faq" }],
  }),
  component: Faq,
});

function Faq() {
  const { t, l } = useI18n();
  const content = useStoreContent();
  const questions = Array.isArray(content.data?.faq) ? content.data.faq : faqs;
  return (
    <section className="container-page max-w-3xl pt-10">
      <h1 className="text-3xl font-bold">{t("faq")}</h1>
      <Accordion type="single" collapsible className="mt-8 rounded-2xl border bg-card px-5">
        {questions.map((f: typeof faqs[number], i: number) => (
          <AccordionItem key={i} value={`q${i}`}>
            <AccordionTrigger className="text-start">{l(f.q)}</AccordionTrigger>
            <AccordionContent className="leading-7 text-foreground/80">{l(f.a)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
