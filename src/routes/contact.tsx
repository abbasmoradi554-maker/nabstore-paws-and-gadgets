import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone, Send } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { instagramUrl, isSet, siteConfig, telegramUrl } from "@/lib/site-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تماس با ما | ناب استور" },
      { name: "description", content: "راه‌های ارتباط با پشتیبانی ناب استور: تلفن، ایمیل، نشانی، اینستاگرام و تلگرام." },
      { property: "og:title", content: "تماس با ناب استور" },
      { property: "og:description", content: "با پشتیبانی ناب استور در ارتباط باشید." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nabstore-paws-and-gadgets.lovable.app/contact" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nabstore-paws-and-gadgets.lovable.app/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useI18n();
  const items = [
    { Icon: Phone, label: t("phone"), value: siteConfig.phone, href: isSet(siteConfig.phone) ? `tel:${siteConfig.phone}` : "", ltr: true },
    { Icon: Mail, label: t("email"), value: siteConfig.email, href: isSet(siteConfig.email) ? `mailto:${siteConfig.email}` : "", ltr: true },
    { Icon: MapPin, label: t("address"), value: siteConfig.address, href: "", ltr: false },
    { Icon: Instagram, label: "Instagram", value: siteConfig.instagram, href: instagramUrl(), ltr: true },
    { Icon: Send, label: "Telegram", value: siteConfig.telegram, href: telegramUrl(), ltr: true },
  ];
  return (
    <section className="container-page max-w-3xl pt-10">
      <h1 className="text-3xl font-bold">{t("contactTitle")}</h1>
      <p className="mt-3 leading-8 text-muted-foreground">{t("supportText")}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map(({ Icon, label, value, href, ltr }) => {
          const shown = isSet(value) ? value : t("toBeAnnounced");
          return (
            <div key={label} className="flex items-center gap-4 rounded-2xl border bg-card p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                {href ? (
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" dir={ltr ? "ltr" : undefined} className="font-semibold text-primary">
                    {shown}
                  </a>
                ) : (
                  <p dir={ltr && isSet(value) ? "ltr" : undefined} className="font-semibold">{shown}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
