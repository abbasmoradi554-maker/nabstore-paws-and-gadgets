import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone, Send, ShieldCheck } from "lucide-react";

import { categories } from "@/data/products";
import { jalaliYear, useI18n } from "@/lib/i18n";
import { isSet, siteConfig } from "@/lib/site-config";
import { useStoreContent } from "@/lib/store-content";
import { Logo } from "./Logo";

export function Footer() {
  const { t, l, lang } = useI18n();
  const content = useStoreContent();
  const store = content.data?.store ?? siteConfig;
  const footer = content.data?.footer ?? {};
  const instagram = typeof store.instagram === "string" && isSet(store.instagram) ? (store.instagram.startsWith("http") ? store.instagram : `https://instagram.com/${store.instagram.replace(/^@/, "")}`) : "";
  const telegram = typeof store.telegram === "string" && isSet(store.telegram) ? `https://t.me/${store.telegram.replace(/^@/, "")}` : "";
  const socials = [
    { href: instagram, label: "Instagram", Icon: Instagram },
    { href: telegram, label: "Telegram", Icon: Send },
  ];
  const helpLinks = [
    { to: "/about", label: t("about") },
    { to: "/contact", label: t("contact") },
    { to: "/faq", label: t("faq") },
    { to: "/shipping", label: t("shipping") },
  ] as const;
  const policyLinks = [
    { to: "/terms", label: t("terms") },
    { to: "/returns", label: t("returns") },
    { to: "/privacy", label: t("privacy") },
  ] as const;
  const contactItems = [
    { Icon: Phone, label: t("phone"), value: store.phone, ltr: true },
    { Icon: Mail, label: t("email"), value: store.email, ltr: true },
    { Icon: MapPin, label: t("address"), value: store.address, ltr: false },
  ];

  return (
    <footer className="mt-24 bg-ink-gradient text-ink-foreground">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo inverted />
          <p className="mt-2 text-sm font-semibold text-ink-foreground/80">{siteConfig.nameFa}</p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-ink-foreground/70">{l(footer.about ?? { fa: t("footerAbout"), en: "NABSTORE — an online store." })}</p>
          <p className="mt-6 text-xs font-semibold text-ink-foreground/60">{t("followUs")}</p>
          <div className="mt-3 flex gap-2">
            {socials.map(({ href, label, Icon }) =>
              href ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-xl border border-ink-foreground/15 transition hover:bg-ink-foreground/10"
                >
                  <Icon className="size-4" />
                </a>
              ) : (
                <span
                  key={label}
                  aria-label={`${label} — ${t("toBeAnnounced")}`}
                  title={t("toBeAnnounced")}
                  className="grid size-10 place-items-center rounded-xl border border-ink-foreground/10 text-ink-foreground/40"
                >
                  <Icon className="size-4" />
                </span>
              ),
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <h3 className="text-sm font-bold">{t("footerShop")}</h3>
          <ul className="mt-4 grid gap-2.5 text-sm text-ink-foreground/70">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to="/category/$slug" params={{ slug: c.slug }} className="hover:text-ink-foreground">
                  {l(c.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 lg:col-span-2 lg:grid-cols-1">
          <div>
            <h3 className="text-sm font-bold">{t("footerHelp")}</h3>
            <ul className="mt-4 grid gap-2.5 text-sm text-ink-foreground/70">
              {helpLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-ink-foreground">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold">{t("footerPolicies")}</h3>
            <ul className="mt-4 grid gap-2.5 text-sm text-ink-foreground/70">
              {policyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-ink-foreground">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3">
          <h3 className="text-sm font-bold">{t("footerContact")}</h3>
          <ul className="mt-4 grid gap-3 text-sm text-ink-foreground/70">
            {contactItems.map(({ Icon, label, value, ltr }) => (
              <li key={label} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span>{label}:</span>
                <span dir={ltr && isSet(value) ? "ltr" : undefined}>{isSet(value) ? value : t("toBeAnnounced")}</span>
              </li>
            ))}
          </ul>
          {/* Reserved for the e-Trust (Enamad) badge: paste the official badge code here once issued. */}
          <div
            aria-label={t("enamadSlot")}
            className="mt-6 grid size-28 place-items-center rounded-2xl border border-dashed border-ink-foreground/25 p-3 text-center text-[0.7rem] leading-5 text-ink-foreground/50"
          >
            <span className="flex flex-col items-center gap-1.5">
              <ShieldCheck className="size-5" />
              {t("enamadSlot")}
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-foreground/55 sm:flex-row">
          <span>
            © {jalaliYear(lang)} {lang === "fa" ? siteConfig.nameFa : siteConfig.nameEn} — {l(footer.rights ?? { fa: t("rights"), en: "All rights reserved." })}
          </span>
        </div>
      </div>
    </footer>
  );
}
