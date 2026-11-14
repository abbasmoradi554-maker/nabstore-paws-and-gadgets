import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "پشتیبانی و تماس | نبستور" },
      { name: "description", content: "راه‌های ارتباط با تیم پشتیبانی فروشگاه نبستور." },
      { property: "og:title", content: "پشتیبانی نبستور" },
      { property: "og:description", content: "با تیم پشتیبانی نبستور در ارتباط باشید." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useI18n();
  const items = [
    { Icon: Phone, label: t("phone"), value: siteConfig.phone },
    { Icon: Mail, label: t("email"), value: siteConfig.email },
  ];
  return (
    <section className="container-page max-w-3xl pt-10">
      <h1 className="text-3xl font-bold">{t("contactTitle")}</h1>
      <p className="mt-3 leading-8 text-muted-foreground">{t("supportText")}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border bg-card p-5">
            <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p dir="ltr" className="font-semibold">{value || t("toBeAnnounced")}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
