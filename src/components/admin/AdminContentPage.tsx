import { useEffect, useMemo, useState } from "react";
import { ArrowRight, LoaderCircle, Save, RefreshCw, FileText, Store, Home, MessageCircle, PanelsTopLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { pages, faqs } from "@/data/pages";
import { categories } from "@/data/products";
import { siteConfig } from "@/lib/site-config";

type SectionKey = "store" | "home" | "footer" | "categories" | "pages" | "faq";
const sectionMeta: Record<SectionKey, { title: string; description: string; icon: typeof Store }> = {
  store: { title: "اطلاعات فروشگاه", description: "شماره تماس، ایمیل، نشانی و شبکه‌های اجتماعی", icon: Store },
  home: { title: "صفحه اصلی", description: "تیترها، متن‌ها و پیام بالای سایت", icon: Home },
  footer: { title: "پاورقی سایت", description: "معرفی کوتاه و متن حقوقی پایین سایت", icon: PanelsTopLeft },
  categories: { title: "دسته‌بندی‌ها", description: "عنوان، توضیحات، تصویر و زیر‌دسته‌ها؛ شناسه‌ها را ثابت نگه دارید", icon: PanelsTopLeft },
  pages: { title: "صفحات و قوانین", description: "درباره ما، ارسال، مرجوعی، حریم خصوصی و قوانین", icon: FileText },
  faq: { title: "پرسش‌های متداول", description: "سؤال‌ها و پاسخ‌های قابل نمایش در سایت", icon: MessageCircle },
};
const defaults: Record<SectionKey, unknown> = {
  store: siteConfig,
  home: {
    heroEyebrow: { fa: "مجموعه جدید فصل", en: "New season collection" },
    heroTitle: { fa: "آسایش هوشمند برای همراهان کوچک شما", en: "Smart comfort for your little companions" },
    heroText: { fa: "قاب و لوازم جانبی گوشی، محصولات گربه و سگ و گجت‌های کاربردی — با قیمت‌هایی منصفانه.", en: "Phone cases and accessories, cat & dog essentials and handy gadgets — at fair prices." },
    heroCta: { fa: "خرید کنید", en: "Shop now" }, heroCta2: { fa: "ترندهای روز", en: "See what is trending" },
    promoTechTitle: { fa: "گجت‌های ترند", en: "Trending gadgets" }, promoTechText: { fa: "تکنولوژی کاربردی برای زندگی روزمره", en: "Useful tech for everyday life" },
    promoPhoneTitle: { fa: "قاب گوشی و لوازم جانبی", en: "Phone cases & accessories" }, promoPhoneText: { fa: "قاب، گلس، محافظ لنز و هولدر", en: "Cases, screen guards, lens protectors and holders" },
    announcement: { fa: "محصولات نمونه‌اند — قیمت و موجودی نهایی پس از ثبت سفارش توسط پشتیبانی با شما هماهنگ می‌شود.", en: "Sample products — support confirms final price and availability after ordering." },
  },
  footer: { about: { fa: "ناب استور؛ فروشگاه آنلاین قاب و لوازم جانبی گوشی، محصولات گربه و سگ و گجت‌های ترند.", en: "NABSTORE — an online store for phone accessories, cat & dog products and trending gadgets." }, followUs: { fa: "ما را دنبال کنید", en: "Follow us" }, rights: { fa: "تمامی حقوق برای ناب استور محفوظ است.", en: "All rights reserved." } },
  categories, pages, faq: faqs,
};
const helpText = "ساختار را به صورت JSON نگه دارید. متن‌های فارسی و انگلیسی هر دو قابل ویرایش‌اند. پیش از ذخیره، ساختار JSON بررسی می‌شود.";

export function AdminContentPage({ onBack }: { onBack?: () => void }) {
  const [section, setSection] = useState<SectionKey>("store");
  const [values, setValues] = useState<Record<SectionKey, unknown>>(defaults);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("store_content").select("key,value");
      if (error) throw error;
      const next = { ...defaults } as Record<SectionKey, unknown>;
      for (const row of data ?? []) {
        if (row.key in next) {
          if (row.key === "pages" && (!row.value || Object.keys(row.value).length === 0)) continue;
          next[row.key as SectionKey] = row.value && typeof row.value === "object" && !Array.isArray(row.value)\n            ? { ...(defaults[row.key as SectionKey] as Record<string, unknown>), ...(row.value as Record<string, unknown>) }\n            : row.value ?? defaults[row.key as SectionKey];
        }
      }
      setValues(next);
      setHasSaved(Object.fromEntries((data ?? []).map((row) => [row.key, true])));
    } catch (error) {
      console.error("CMS content load failed", error);
      toast.error("دریافت محتوای سایت انجام نشد؛ اتصال و مجوز پنل را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => { setDraft(JSON.stringify(values[section], null, 2)); }, [section, values]);

  const formatted = useMemo(() => {
    try { return JSON.parse(draft); } catch { return null; }
  }, [draft]);

  const save = async () => {
    if (formatted === null) { toast.error("ساختار JSON معتبر نیست."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("store_content").upsert({ key: section, value: formatted, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
      setValues((current) => ({ ...current, [section]: formatted }));
      setHasSaved((current) => ({ ...current, [section]: true }));
      toast.success("محتوا ذخیره شد.");
    } catch (error) {
      console.error("CMS content save failed", error);
      toast.error("ذخیره انجام نشد؛ سطح دسترسی مدیر را بررسی کنید.");
    } finally {
      setSaving(false);
    }
  };

  const resetDraft = () => setDraft(JSON.stringify(defaults[section], null, 2));
  const active = sectionMeta[section];
  const Icon = active.icon;

  return (
    <section className="container-page max-w-6xl py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-soft p-3 text-primary"><FileText className="size-6" /></div>
          <div><h1 className="text-2xl font-bold">مدیریت محتوای ناب استور</h1><p className="mt-1 text-sm text-muted-foreground">ویرایش اطلاعات و متن‌های قابل نمایش در فروشگاه</p></div>
        </div>
        <div className="flex gap-2">
          {onBack ? <Button variant="outline" onClick={onBack}><ArrowRight className="size-4" /> بازگشت به سفارش‌ها</Button> : null}
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="size-4" /> تازه‌سازی</Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="grid h-fit gap-2 rounded-2xl border bg-card p-2">
          {(Object.keys(sectionMeta) as SectionKey[]).map((key) => {
            const meta = sectionMeta[key]; const ItemIcon = meta.icon;
            return <Button key={key} type="button" variant={section === key ? "default" : "ghost"} className="justify-start" onClick={() => setSection(key)}>
              <ItemIcon className="size-4" /> {meta.title} {hasSaved[key] ? <span className="ms-auto text-xs opacity-70">ذخیره‌شده</span> : null}
            </Button>;
          })}
        </nav>
        <div className="min-w-0 rounded-2xl border bg-card p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3"><Icon className="size-5 text-primary" /><div><h2 className="font-bold">{active.title}</h2><p className="text-sm text-muted-foreground">{active.description}</p></div></div>
          {loading ? <div className="flex min-h-60 items-center justify-center gap-2 text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /> در حال دریافت محتوا…</div> : <>
            <label className="mb-2 block text-sm font-medium" htmlFor="cms-json">محتوای این بخش</label>
            <textarea id="cms-json" dir="ltr" spellCheck={false} value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[420px] w-full rounded-xl border bg-background p-4 font-mono text-xs leading-6 outline-none focus:border-primary" />
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{helpText}</p>
            {formatted === null ? <p className="mt-2 text-sm text-destructive">JSON ناقص یا نامعتبر است.</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => void save()} disabled={saving || formatted === null}><Save className="size-4" /> {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}</Button>
              <Button variant="outline" onClick={resetDraft} disabled={saving}>بازگردانی پیش‌فرض این بخش</Button>
            </div>
          </>}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">محتوای این پنل در دیتابیس نسخه آزمایشی ذخیره می‌شود؛ انتشار در سایت اصلی انجام نشده است.</p>
    </section>
  );
}
