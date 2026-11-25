import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Copy, MessageCircle, Send } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCatalogProducts } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { formatNumber, useI18n, type DictKey } from "@/lib/i18n";
import { customerSchema, provinces, type CustomerInput } from "@/lib/order-schema";
import type { PricedLine } from "@/lib/order-pricing";
import { placeOrder } from "@/lib/orders.functions";
import { supabase } from "@/integrations/supabase/client";
import { siteConfig } from "@/lib/site-config";
import { useStoreContent } from "@/lib/store-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "ثبت سفارش | ناب استور" },
      { name: "description", content: "ثبت سفارش در ناب استور؛ پرداخت پس از تأیید سفارش توسط پشتیبانی هماهنگ می‌شود." },
      { property: "og:title", content: "ثبت سفارش ناب استور" },
      { property: "og:description", content: "فرم ثبت سفارش ناب استور." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

type Field = keyof CustomerInput;
type Placed = { code: string; lines: PricedLine[]; subtotal: number; shippingToman: number; total: number; customer: CustomerInput };

const empty: CustomerInput = { name: "", mobile: "", province: "" as CustomerInput["province"], city: "", address: "", postalCode: "", notes: "" };

const CHECKOUT_IDEMPOTENCY_STORAGE_KEY = "nabstore-checkout-idempotency";

function getCheckoutIdempotencyKey() {
  try {
    const existing = sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY);
    if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function clearCheckoutIdempotencyKey() {
  try { sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
}

function buildSummary(o: Placed) {
  const p = (n: number) => `${formatNumber(n, "fa")} تومان`;
  const lines = o.lines.map((l) => {
    const opts = Object.values(l.options).join("، ");
    return `• ${l.nameFa}${opts ? ` (${opts})` : ""} × ${formatNumber(l.qty, "fa")} — ${p(l.lineTotal)}`;
  });
  return [
    `سفارش ${siteConfig.nameFa}`,
    `شماره سفارش: ${o.code}`,
    ...lines,
    `جمع کالاها: ${p(o.subtotal)}`,
    `هزینه ارسال: ${o.shippingToman === 0 ? "رایگان" : p(o.shippingToman)}`,
    `مبلغ نهایی: ${p(o.total)}`,
    `نام: ${o.customer.name}`,
    `موبایل: ${o.customer.mobile}`,
    `نشانی: ${o.customer.province}، ${o.customer.city}، ${o.customer.address}`,
    `کد پستی: ${o.customer.postalCode}`,
    o.customer.notes ? `توضیحات: ${o.customer.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function Checkout() {
  const { t, l, price, num } = useI18n();
  const cart = useCart();
  const catalog = useCatalogProducts();
  const storeContent = useStoreContent();
  const shippingConfig = storeContent.data?.["shipping"];
  const flatShipping = Number(shippingConfig?.flatFeeToman);
  const freeAbove = Number(shippingConfig?.freeAboveToman);
  const shippingConfigValid = Number.isSafeInteger(flatShipping) && flatShipping >= 0 &&
    Number.isSafeInteger(freeAbove) && freeAbove >= 0 && typeof shippingConfig?.enabled === "boolean";
  const shippingToman = shippingConfigValid
    ? shippingConfig.enabled === false || (freeAbove > 0 && cart.total >= freeAbove) ? 0 : flatShipping
    : null;
  const submit = useServerFn(placeOrder);
  const [form, setForm] = useState<CustomerInput>(empty);
  const [errors, setErrors] = useState<Partial<Record<Field, DictKey>>>({});
  const [pending, setPending] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);

  const set = (k: Field) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = customerSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Partial<Record<Field, DictKey>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as Field;
        if (!errs[k]) errs[k] = issue.message as DictKey;
      }
      setErrors(errs);
      return;
    }
    setPending(true);
    try {
      const formElement = e.currentTarget;
      const honeypot = String(new FormData(formElement).get("website") ?? "");
      const { data: sessionData } = await supabase.auth.getSession();
      const idempotencyKey = getCheckoutIdempotencyKey();
      const res = await submit({
        data: {
          customer: parsed.data,
          items: cart.items.map(({ id, qty, options }) => ({ id, qty, options })),
          idempotencyKey,
          honeypot,
          ...(sessionData.session?.access_token ? { accessToken: sessionData.session.access_token } : {}),
        },
      });
      clearCheckoutIdempotencyKey();
      setPlaced({ ...res, customer: parsed.data });
      cart.clear();
      window.scrollTo({ top: 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message.includes("rate_limited") ? t("orderRateLimited") : message.includes("email_verification_required") ? "برای اتصال سفارش به حساب، ابتدا ایمیل حساب را تأیید کنید؛ یا بدون ورود سفارش را ثبت کنید." : message.includes("insufficient_stock") ? "موجودی این محصول کافی نیست؛ سبد خرید را به‌روزرسانی کنید." : message.includes("idempotency_conflict") ? "اطلاعات این تلاش با سفارش ثبت‌شده قبلی متفاوت است. برای جلوگیری از ثبت سفارش تکراری، لطفاً پیش از تلاش دوباره با پشتیبانی هماهنگ کنید." : t("orderFailed"));
    } finally {
      setPending(false);
    }
  };

  // ---------------------------------------------------------------------------
  // FUTURE PAYMENT GATEWAY (e.g. Zarinpal / IDPay / bank IPG):
  // after placeOrder succeeds, call a server function that creates a payment
  // request for `placed.code` and redirect to the gateway URL. Verify the
  // payment in a server route callback under src/routes/api/public/ before
  // marking the order paid. Until then, payment is arranged by support.
  // ---------------------------------------------------------------------------

  if (placed) return <OrderPlaced order={placed} />;

  if (!cart.ready) return (
    <section className="container-page min-h-[40vh] pt-10 text-center">
      {cart.catalogError ? (
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-6">
          <p className="text-sm text-destructive">دریافت اطلاعات محصولات انجام نشد؛ سفارش شما هنوز ثبت نشده است.</p>
          <Button className="mt-4" onClick={cart.retryCatalog}>تلاش دوباره</Button>
        </div>
      ) : <p className="text-sm text-muted-foreground">در حال دریافت اطلاعات محصولات…</p>}
    </section>
  );

  if (cart.items.length === 0) {
    return (
      <section className="container-page pt-10 text-center">
        <p className="text-muted-foreground">{t("cartEmpty")}</p>
        <Button asChild size="lg" className="mt-6 rounded-xl">
          <Link to="/shop">{t("continueShopping")}</Link>
        </Button>
      </section>
    );
  }

  if (storeContent.isLoading) {
    return <section className="container-page min-h-[40vh] pt-10 text-center text-sm text-muted-foreground">در حال دریافت تنظیمات نهایی ارسال…</section>;
  }

  if (storeContent.isError || !shippingConfigValid || shippingToman === null) {
    return (
      <section className="container-page min-h-[40vh] pt-10 text-center">
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-6">
          <p className="text-sm text-destructive">تنظیمات هزینه ارسال دریافت نشد؛ برای جلوگیری از نمایش مبلغ اشتباه، ثبت سفارش موقتاً متوقف شده است.</p>
          <Button className="mt-4" onClick={() => void storeContent.refetch()}>تلاش دوباره</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container-page pt-10">
      <h1 className="text-3xl font-bold">{t("checkoutTitle")}</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-3xl border bg-card p-5 sm:grid-cols-2 sm:p-8 lg:col-span-3">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            defaultValue=""
            className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
          />
          <FormField label={t("fName")} error={errors.name && t(errors.name)} className="sm:col-span-2">
            <input value={form.name} onChange={set("name")} autoComplete="name" maxLength={80} className={inputCls} />
          </FormField>
          <FormField label={t("fMobile")} error={errors.mobile && t(errors.mobile)}>
            <input value={form.mobile} onChange={set("mobile")} inputMode="tel" autoComplete="tel" dir="ltr" placeholder="09xxxxxxxxx" maxLength={14} className={inputCls} />
          </FormField>
          <FormField label={t("fPostal")} error={errors.postalCode && t(errors.postalCode)}>
            <input value={form.postalCode} onChange={set("postalCode")} inputMode="numeric" autoComplete="postal-code" dir="ltr" maxLength={12} className={inputCls} />
          </FormField>
          <FormField label={t("fProvince")} error={errors.province && t(errors.province)}>
            <select value={form.province} onChange={set("province")} className={inputCls}>
              <option value="">{t("chooseProvince")}</option>
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </FormField>
          <FormField label={t("fCity")} error={errors.city && t(errors.city)}>
            <input value={form.city} onChange={set("city")} autoComplete="address-level2" maxLength={60} className={inputCls} />
          </FormField>
          <FormField label={t("fAddress")} error={errors.address && t(errors.address)} className="sm:col-span-2">
            <textarea value={form.address} onChange={set("address")} autoComplete="street-address" rows={3} maxLength={400} className={cn(inputCls, "h-auto py-3")} />
          </FormField>
          <FormField label={t("fNotes")} error={errors.notes && t(errors.notes)} className="sm:col-span-2">
            <textarea value={form.notes} onChange={set("notes")} rows={2} maxLength={500} className={cn(inputCls, "h-auto py-3")} />
          </FormField>
          <div className="sm:col-span-2">
            <p className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground">{t("paymentNote")}</p>
            <Button type="submit" size="xl" className="mt-4 w-full" disabled={pending}>
              {pending ? t("submitting") : t("submitOrder")}
            </Button>
          </div>
        </form>

        <aside className="h-fit rounded-3xl border bg-card p-5 sm:p-6 lg:col-span-2">
          <h2 className="font-bold">{t("orderSummary")}</h2>
          <ul className="mt-4 grid gap-3 text-sm">
            {cart.items.map((i) => {
              const p = catalog.data?.find((product) => product.id === i.id);
              if (!p) return null;
              return (
                <li key={i.key} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    {l(p.name)} <span className="text-muted-foreground">× {num(i.qty)}</span>
                    {Object.values(i.options).length > 0 && (
                      <span className="block text-xs text-muted-foreground">{Object.values(i.options).join("، ")}</span>
                    )}
                  </span>
                  <span className="shrink-0 font-semibold">{price(p.price * i.qty)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 grid gap-2 border-t pt-4 text-sm">
            <div className="flex justify-between"><span>جمع کالاها</span><span>{price(cart.total)}</span></div>
            <div className="flex justify-between"><span>هزینه ارسال</span><span>{shippingToman === 0 ? "رایگان" : price(shippingToman)}</span></div>
            <p className="text-xs leading-6 text-muted-foreground">
              {freeAbove > 0 ? `ارسال برای خریدهای ${num(freeAbove)} تومان و بیشتر رایگان است.` : "هزینه ارسال ثابت است."}
            </p>
            <div className="flex justify-between border-t pt-3 font-bold">
              <span>{t("total")}</span><span>{price(cart.total + shippingToman)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border bg-background px-4 text-sm text-foreground outline-none transition focus:border-ring aria-[invalid=true]:border-destructive";

function FormField({ label, error, className, children }: { label: string; error?: string | undefined; className?: string; children: ReactNode }) {
  return (
    <label className={cn("grid gap-1.5 text-sm font-medium", className)}>
      {label}
      {children}
      {error && <span className="text-xs font-normal text-destructive" role="alert">{error}</span>}
    </label>
  );
}

function OrderPlaced({ order }: { order: Placed }) {
  const { t, price, num } = useI18n();
  const content = useStoreContent();
  const store = content.data?.["store"] ?? siteConfig;
  const summary = buildSummary(order);
  const telegram = typeof store.telegram === "string" ? store.telegram.replace(/^@/, "") : "";
  const whatsapp = typeof store.whatsapp === "string" ? store.whatsapp.replace(/\D/g, "") : "";
  const tg = telegram && !/^[\[][^\]]*[\]]$/.test(telegram) ? `https://t.me/${telegram}` : "";
  const wa = whatsapp && !/^[\[][^\]]*[\]]$/.test(whatsapp) ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(summary)}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      toast.success(t("copied"));
      return true;
    } catch {
      return false;
    }
  };

  return (
    <section className="container-page max-w-2xl pt-10">
      <div className="rounded-3xl border bg-card p-6 sm:p-10">
        <CheckCircle2 className="size-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{t("orderPlaced")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("orderNumber")}</p>
        <p dir="ltr" className="mt-1 w-fit rounded-xl bg-primary-soft px-4 py-2 text-xl font-extrabold tracking-wider text-primary">
          {order.code}
        </p>
        <p className="mt-4 leading-8 text-foreground/80">{t("orderSavedText")}</p>
        <p className="mt-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground">{t("paymentNote")}</p>

        <h2 className="mt-8 font-bold">{t("orderSummary")}</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {order.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {l.nameFa} <span className="text-muted-foreground">× {num(l.qty)}</span>
                {Object.values(l.options).length > 0 && (
                  <span className="block text-xs text-muted-foreground">{Object.values(l.options).join("، ")}</span>
                )}
              </span>
              <span className="shrink-0 font-semibold">{price(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t pt-4 font-bold">
          <span>{t("total")}</span>
          <span>{price(order.total)}</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {tg && (
            <Button
              variant="outline"
              onClick={async () => {
                await copy();
                window.open(tg, "_blank", "noopener,noreferrer");
              }}
            >
              <Send />
              {t("sendTelegram")}
            </Button>
          )}
          {wa && (
            <Button asChild variant="outline">
              <a href={wa} target="_blank" rel="noreferrer">
                <MessageCircle />
                {t("sendWhatsapp")}
              </a>
            </Button>
          )}
          <Button variant="ghost" onClick={copy}>
            <Copy />
            {t("copySummary")}
          </Button>
          <Button asChild variant="link">
            <Link to="/">{t("backHome")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
