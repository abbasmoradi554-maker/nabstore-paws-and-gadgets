import { Link, useNavigate } from "@tanstack/react-router";
import { Globe, Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { categories } from "@/data/products";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useStoreContent } from "@/lib/store-content";
import { useWishlist } from "@/lib/wishlist";
import { Logo } from "./Logo";

function SearchBox({ className }: { className?: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/shop", search: { q: q.trim() || undefined } });
  };
  return (
    <form onSubmit={onSubmit} role="search" className={className}>
      <label className="relative block">
        <span className="sr-only">{t("search")}</span>
        <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          maxLength={100}
          aria-label={t("search")}
          className="h-11 w-full" rounded-xl border border-transparent bg-secondary ps-11 pe-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:bg-card"
        />
      </label>
    </form>
  );
}

function LangSwitch() {
  const { t, toggleLang } = useI18n();
  return (
    <Button variant="ghost" size="sm" onClick={toggleLang} className="h-10 gap-1.5 rounded-xl px-3 font-semibold">
      <Globe />
      <span>{t("language")}</span>
    </Button>
  );
}

export function Header() {
  const { t, l, num } = useI18n();
  const content = useStoreContent();
  const announcement = content.data?.home?.announcement;
  const announcementText = announcement && typeof announcement === "object" ? l(announcement) : t("previewNotice");
  const visibleCategories = Array.isArray(content.data?.categories) ? content.data.categories : categories;
  const cart = useCart();
  const wishlist = useWishlist();
  const [open, setOpen] = useState(false);

  const mainLinks = [
    { to: "/", label: t("home") },
    { to: "/shop", label: t("shop") },
    { to: "/trending", label: t("trendingNow") },
    { to: "/contact", label: t("contact") },
  ] as const;
  const infoLinks = [
    { to: "/about", label: t("about") },
    { to: "/faq", label: t("faq") },
    { to: "/shipping", label: t("shipping") },
    { to: "/returns", label: t("returns") },
  ] as const;

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink text-ink-foreground">
        <p className="container-page py-2 text-center text-[0.72rem] leading-relaxed sm:text-xs">{announcementText}</p>
      </div>

      <div className="border-b bg-background/90 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center gap-3 sm:h-[4.5rem] lg:gap-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label={t("menu")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={l({ fa: "right", en: "left" }) as "right" | "left"} className="w-[85%] max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pb-8">
                {mainLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-base font-semibold hover:bg-secondary"
                    activeOptions={{ exact: true }}
                    activeProps={{ className: "text-primary" }}
                  >
                    {link.label}
                  </Link>
                ))}
                <p className="mt-4 px-3 text-xs font-semibold uppercase text-muted-foreground">{t("categories")}</p>
                {visibleCategories.map((c: (typeof categories)[number]) => (
                  <Link
                    key={c.slug}
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm hover:bg-secondary"
                  >
                    {l(c.name)}
                  </Link>
                ))}
                <span className="my-3 h-px bg-border" />
                {infoLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" aria-label="NABSTORE" className="shrink-0">
            <Logo />
          </Link>

          <SearchBox className="hidden flex-1 md:block" />

          <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
            <div className="hidden sm:block">
              <LangSwitch />
            </div>
            <Button asChild variant="ghost" size="icon-lg" aria-label={t("account")}><Link to="/account"><UserRound className="size-5" /></Link></Button>
            <Button asChild variant="ghost" size="icon-lg" className="relative">
              <Link to="/wishlist" aria-label={t("wishlist")}>
                <Heart className="size-5" />
                {wishlist.count > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 grid min-w-5 place-items-center rounded-full bg-highlight px-1 text-[0.65rem] font-bold leading-5 text-highlight-foreground">
                    {num(wishlist.count)}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon-lg" className="relative">
              <Link to="/cart" aria-label={t("cart")}>
                <ShoppingBag className="size-5" />
                {cart.count > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 grid min-w-5 place-items-center rounded-full bg-highlight px-1 text-[0.65rem] font-bold leading-5 text-highlight-foreground">
                    {num(cart.count)}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>

        <div className="container-page flex items-center gap-2 pb-3 md:hidden">
          <SearchBox className="flex-1" />
          <div className="sm:hidden">
            <LangSwitch />
          </div>
        </div>

        <nav className="hidden border-t lg:block" aria-label={t("categories")}>
          <div className="container-page flex h-12 items-center gap-6 text-sm">
            {mainLinks.slice(1, 3).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-semibold text-foreground hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {link.label}
              </Link>
            ))}
            <span className="h-4 w-px bg-border" />
            <div className="scrollbar-none flex items-center gap-5 overflow-x-auto">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "text-primary font-semibold" }}
                >
                  {l(c.name)}
                </Link>
              ))}
            </div>
            <Link to="/contact" className="ms-auto whitespace-nowrap text-muted-foreground hover:text-foreground">
              {t("contact")}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
