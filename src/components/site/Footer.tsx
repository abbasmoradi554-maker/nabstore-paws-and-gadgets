import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin, Mail, MessageCircle, Phone, Send } from "lucide-react";

import { categories } from "@/data/catalog";
import { useI18n } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";
import { Logo } from "./Logo";

export function Footer() {
  const { t, l, num } = useI18n();
  const socials = [
    { href: siteConfig.social.instagram, label: "Instagram", Icon: Instagram },
    { href: siteConfig.social.telegram, label: "Telegram", Icon: Send },
    { href: siteConfig.social.whatsapp, label: "WhatsApp", Icon: MessageCircle },
    { href: siteConfig.social.linkedin, label: "LinkedIn", Icon: Linkedin },
  ];

  return (
    <footer className="mt-24 bg-ink-gradient text-ink-foreground">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo inverted />
          <p className="mt-5 max-w-sm text-sm leading-7 text-ink-foreground/70">{t("footerAbout")}</p>
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
                  aria-label={label}
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
          <ul className="mt-4 grid grid-cols-1 gap-2.5 text-sm text-ink-foreground/70">
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link to="/category/$slug" params={{ slug: c.slug }} className="hover:text-ink-foreground">
                  {l(c.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-sm font-bold">{t("footerHelp")}</h3>
          <ul className="mt-4 grid gap-2.5 text-sm text-ink-foreground/70">
            <li>
              <Link to="/shop" className="hover:text-ink-foreground">{t("shop")}</Link>
            </li>
            <li>
              <Link to="/trending" className="hover:text-ink-foreground">{t("trendingNow")}</Link>
            </li>
            <li>
              <Link to="/shop" search={{ sale: true }} className="hover:text-ink-foreground">{t("offers")}</Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-ink-foreground">{t("contact")}</Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h3 className="text-sm font-bold">{t("footerContact")}</h3>
          <ul className="mt-4 grid gap-3 text-sm text-ink-foreground/70">
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0" />
              <span>{t("phone")}:</span>
              <span dir="ltr">{siteConfig.phone || t("toBeAnnounced")}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0" />
              <span>{t("email")}:</span>
              <span dir="ltr">{siteConfig.email || t("toBeAnnounced")}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-foreground/55 sm:flex-row">
          <span>
            © {num(new Date().getFullYear())} NABSTORE — {t("rights")}
          </span>
        </div>
      </div>
    </footer>
  );
}
