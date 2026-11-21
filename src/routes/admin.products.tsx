import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  CheckCircle2, Eye, EyeOff, ImagePlus, LoaderCircle, LogOut, Package,
  Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { optimizedProductImage } from "@/lib/catalog";
import { deleteAdminProduct, saveAdminProduct, uploadAdminProductImage } from "@/lib/products-admin.functions";

export const Route = createFileRoute("/admin/products")({
  component: LegacyProductsAdminRedirect,
  head: () => ({ meta: [{ title: "مدیریت محصولات | ناب استور" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminProductsPage,
});

type Localized = { fa: string; en: string };
type Product = {
  id: string; name: Localized; price: number; old_price: number | null;
  category: string; subcategory: string | null; short: Localized; description: Localized;
  specs: Array<{ label: Localized; value: Localized }>;
  options: Array<{ type: "model" | "color" | "size" | "design"; values: Localized[] }>;
  tags: Array<"trending" | "pick" | "recommended">;
  added_order: number; images: string[]; active: boolean;
};

const categories = [
  ["phone-cases", "قاب و لوازم جانبی"], ["food-water", "غذا و آبخوری"],
  ["toys", "اسباب‌بازی"], ["collars", "قلاده و اکسسوری"],
  ["hygiene", "بهداشت"], ["beds-carriers", "تخت و حمل"], ["gadgets", "گجت‌ها"],
];
const tagLabels: Record<string, string> = {
  trending: "ترند", pick: "انتخاب ناب", recommended: "پیشنهادی",
};
const blank = (): Product => ({
  id: "", name: { fa: "", en: "" }, price: 1, old_price: null,
  category: "phone-cases", subcategory: null,
  short: { fa: "", en: "" }, description: { fa: "", en: "" },
  specs: [], options: [], tags: [], added_order: 0, images: [], active: true,
});
const inputClass = "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const areaClass = "w-full rounded-xl border border-input bg-background p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> {
  let timer: number | undefined;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => { timer = window.setTimeout(() => reject(new Error(message)), ms); }),
  ]).finally(() => { if (timer !== undefined) window.clearTimeout(timer); });
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="grid min-w-0 gap-1.5 text-sm font-medium"><span>{label}</span>{children}{hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}</label>;
}
function formatMoney(value: number) {
  return `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;
}

function LegacyProductsAdminRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/admin", search: { tab: "products" }, replace: true });
  }, [navigate]);
  return <main className="container-page flex min-h-40 items-center justify-center text-sm text-muted-foreground">در حال انتقال به داشبورد یکپارچه…</main>;
}

export function AdminProductsPage({ onBack }: { onBack?: () => void } = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Product>(blank());
  const [specsJson, setSpecsJson] = useState("[]");
  const [optionsJson, setOptionsJson] = useState("[]");
  const [tagsText, setTagsText] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const restoredToken = useRef("");

  const load = async (_token?: string) => {
    setProductsLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.from("products")
          .select("id, name, price, old_price, category, subcategory, short, description, specs, options, tags, added_order, images, active, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200),
        9000,
        "products_timeout",
      );
      if (error) throw error;
      setItems((data ?? []) as Product[]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    let live = true;

    const restoreSession = (token: string | undefined) => {
      if (!live || !token || restoredToken.current === token) return;
      restoredToken.current = token;
      setAccessToken(token);
      // Never block the whole products workspace on session restoration or catalog I/O.
      window.setTimeout(() => {
        if (!live) return;
        void load().catch((error) => {
          console.error("Admin products initial load failed", error);
          if (live) toast.error("ورود انجام شد، اما دریافت محصولات ناموفق بود؛ از تازه‌سازی استفاده کنید.");
        });
      }, 0);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!live) return;
      if (session?.access_token) {
        restoreSession(session.access_token);
      } else if (event === "SIGNED_OUT") {
        restoredToken.current = "";
        setAccessToken("");
        setItems([]);
      }
    });

    // This request is deliberately non-blocking. If storage/auth restoration is slow,
    // the login form remains available instead of leaving the user on an endless spinner.
    void supabase.auth.getSession()
      .then(({ data }) => restoreSession(data.session?.access_token))
      .catch((error) => {
        console.error("Admin session restore failed", error);
      });

    return () => {
      live = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return items.filter((p) => {
      const matchesText = !q || [p.id, p.name?.fa, p.name?.en].some((v) => (v ?? "").toLocaleLowerCase().includes(q));
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? p.active : !p.active);
      return matchesText && matchesCategory && matchesStatus;
    }).sort((a, b) => b.added_order - a.added_order);
  }, [items, search, categoryFilter, statusFilter]);

  const activeCount = items.filter((p) => p.active).length;
  const inactiveCount = items.length - activeCount;

  const clearForm = () => {
    setDraft(blank());
    setSpecsJson("[]");
    setOptionsJson("[]");
    setTagsText("");
    setSubcategory("");
    setImagesText("");
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) throw error ?? new Error("login_failed");
      setAccessToken(data.session.access_token);
      restoredToken.current = data.session.access_token;
      void load().catch((error) => {
        console.error("Admin products login load failed", error);
        toast.error("ورود انجام شد، اما دریافت فهرست محصولات ناموفق بود؛ از تازه‌سازی استفاده کنید.");
      });
      setPassword("");
      toast.success("با موفقیت وارد پنل مدیریت شدید");
    } catch {
      await supabase.auth.signOut();
      toast.error("ورود ناموفق بود؛ ایمیل مدیر و حساب کاربری تأییدشده را بررسی کنید.");
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    try {
      const specs = JSON.parse(specsJson);
      const options = JSON.parse(optionsJson);
      const tags = [...new Set(tagsText.split(",").map((value) => value.trim()).filter(Boolean))];
      const images = [...new Set(imagesText.split(/[\n,]/).map((value) => value.trim()).filter(Boolean))];
      if (!Array.isArray(specs) || !Array.isArray(options) || images.length > 8) throw new Error("invalid_fields");
      if (draft.old_price !== null && draft.old_price <= draft.price) {
        throw new Error("old_price_must_exceed_price");
      }
      await saveAdminProduct({
        data: {
          accessToken, ...draft, oldPrice: draft.old_price,
          subcategory: subcategory.trim() || null, specs, options, tags, images,
          addedOrder: draft.added_order || 0,
        },
      });
      await load();
      clearForm();
      toast.success("محصول با موفقیت ذخیره شد");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "old_price_must_exceed_price") toast.error("قیمت قبلی باید از قیمت فروش بیشتر باشد.");
      else if (message.includes("JSON")) toast.error("ساختار JSON مشخصات یا گزینه‌ها معتبر نیست.");
      else toast.error("ذخیره انجام نشد؛ شناسه، قیمت، آدرس تصاویر و قالب مشخصات را بررسی کنید.");
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const currentImages = imagesText.split(/[\n,]/).map((value) => value.trim()).filter(Boolean);
    if (currentImages.length >= 8) {
      toast.error("حداکثر ۸ تصویر برای هر محصول مجاز است.");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("فرمت تصویر باید JPG، PNG، WEBP یا AVIF باشد.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("حجم هر تصویر نباید بیشتر از ۴ مگابایت باشد.");
      return;
    }
    if (!accessToken) return;
    setUploadingImage(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
      }
      const result = await uploadAdminProductImage({
        data: { accessToken, contentType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/avif", base64: btoa(binary) },
      });
      setImagesText((current) => [...current.split(/[\n,]/).map((value) => value.trim()).filter(Boolean), result.url].slice(0, 8).join("\n"));
      toast.success("تصویر با موفقیت بارگذاری شد.");
    } catch {
      toast.error("بارگذاری تصویر انجام نشد؛ اتصال فضای ذخیره‌سازی را بررسی کنید.");
    } finally {
      setUploadingImage(false);
    }
  };

  const edit = (product: Product) => {
    setDraft({ ...product, images: product.images ?? [] });
    setSpecsJson(JSON.stringify(product.specs ?? [], null, 2));
    setOptionsJson(JSON.stringify(product.options ?? [], null, 2));
    setTagsText((product.tags ?? []).join(", "));
    setSubcategory(product.subcategory ?? "");
    setImagesText((product.images ?? []).join("\n"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!window.confirm("این محصول برای همیشه از فهرست محصولات حذف شود؟")) return;
    try {
      await deleteAdminProduct({ data: { accessToken, id } });
      await load(accessToken);
      if (draft.id === id) clearForm();
      toast.success("محصول حذف شد");
    } catch {
      toast.error("حذف محصول انجام نشد.");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAccessToken("");
    setItems([]);
    clearForm();
  };

  if (!accessToken) {
    return (
      <main className="container-page flex min-h-[65vh] max-w-lg items-center justify-center py-12">
        <form onSubmit={login} className="grid w-full gap-5 rounded-3xl border bg-card p-7 shadow-sm sm:p-9">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="size-7" /></div>
          <div className="text-center"><h1 className="text-2xl font-extrabold">مدیریت ناب استور</h1><p className="mt-2 text-sm text-muted-foreground">برای ورود به پنل خصوصی فروشگاه وارد شوید.</p></div>
          <Field label="ایمیل مدیر"><input required type="email" autoComplete="username" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></Field>
          <Field label="رمز عبور"><input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} /></Field>
          <Button type="submit" size="lg" disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} ورود امن به پنل</Button>
          <a className="text-center text-sm text-primary underline underline-offset-4" href="/admin">رفتن به مدیریت سفارش‌ها</a>
          <p className="text-center text-xs leading-6 text-muted-foreground">دسترسی فقط برای ایمیل مدیر ثبت‌شده در تنظیمات امن سرور مجاز است.</p>
        </form>
      </main>
    );
  }

  return (
    <main className="container-page max-w-7xl py-8">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Package className="size-6" /></div>
          <div><h1 className="text-2xl font-extrabold sm:text-3xl">مدیریت محصولات</h1><p className="mt-1 text-sm text-muted-foreground">کاتالوگ، قیمت، تصاویر و مشخصات NABSTORE</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {onBack ? <Button type="button" variant="outline" onClick={onBack}>بازگشت به سفارش‌ها</Button> : <Button asChild variant="outline"><a href="/admin">مدیریت سفارش‌ها</a></Button>}
          <Button type="button" variant="outline" onClick={() => void load(accessToken)} disabled={busy}><RefreshCw className="size-4" /> تازه‌سازی</Button>
          <Button type="button" variant="ghost" onClick={() => void logout()}><LogOut className="size-4" /> خروج</Button>
        </div>
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4"><p className="text-sm text-muted-foreground">کل محصولات</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{new Intl.NumberFormat("fa-IR").format(items.length)}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="size-4 text-emerald-600" /> محصولات فعال</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{new Intl.NumberFormat("fa-IR").format(activeCount)}</p></div>
        <div className="rounded-2xl border bg-card p-4"><p className="flex items-center gap-2 text-sm text-muted-foreground"><EyeOff className="size-4" /> محصولات غیرفعال</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{new Intl.NumberFormat("fa-IR").format(inactiveCount)}</p></div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
        <form onSubmit={save} className="grid content-start gap-4 rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b pb-4">
            <div><h2 className="text-lg font-bold">{draft.id ? "ویرایش محصول" : "ثبت محصول جدید"}</h2><p className="mt-1 text-xs text-muted-foreground">اطلاعات را دقیق و مطابق کالای واقعی وارد کنید.</p></div>
            {draft.id ? <Button type="button" size="sm" variant="ghost" onClick={clearForm}><X className="size-4" /> انصراف از ویرایش</Button> : <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">محصول جدید</span>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="شناسه انگلیسی محصول" hint="فقط حروف کوچک انگلیسی، عدد و خط تیره">
              <input required pattern="[a-z0-9-]{2,60}" maxLength={60} value={draft.id} disabled={items.some((p) => p.id === draft.id)} onChange={(e) => setDraft({ ...draft, id: e.target.value })} className={inputClass} dir="ltr" placeholder="مثلاً cat-water-bowl" />
            </Field>
            <Field label="دسته‌بندی">
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputClass}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نام فارسی"><input required maxLength={180} value={draft.name.fa} onChange={(e) => setDraft({ ...draft, name: { ...draft.name, fa: e.target.value } })} className={inputClass} /></Field>
            <Field label="نام انگلیسی"><input maxLength={180} dir="ltr" value={draft.name.en} onChange={(e) => setDraft({ ...draft, name: { ...draft.name, en: e.target.value } })} className={inputClass} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="قیمت فروش (تومان)"><input required type="number" min="1" max="1000000000" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} className={inputClass} /></Field>
            <Field label="قیمت قبلی (اختیاری)"><input type="number" min="0" max="1000000000" value={draft.old_price ?? ""} onChange={(e) => setDraft({ ...draft, old_price: e.target.value === "" ? null : Number(e.target.value) })} className={inputClass} /></Field>
            <Field label="ترتیب نمایش"><input type="number" min="0" value={draft.added_order} onChange={(e) => setDraft({ ...draft, added_order: Number(e.target.value) })} className={inputClass} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="زیردسته"><input maxLength={80} value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className={inputClass} placeholder="مثلاً ظرف آب اتوماتیک" /></Field>
            <Field label="برچسب‌ها" hint="با ویرگول انگلیسی جدا کنید: trending, pick, recommended"><input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={inputClass} dir="ltr" placeholder="trending, pick" /></Field>
          </div>

          <div className="grid gap-3 rounded-2xl bg-muted/35 p-4">
            <p className="text-sm font-bold">معرفی محصول</p>
            <Field label="توضیح کوتاه فارسی"><textarea required maxLength={300} rows={2} value={draft.short.fa} onChange={(e) => setDraft({ ...draft, short: { ...draft.short, fa: e.target.value } })} className={areaClass} /></Field>
            <Field label="توضیح کوتاه انگلیسی"><textarea maxLength={300} rows={2} dir="ltr" value={draft.short.en} onChange={(e) => setDraft({ ...draft, short: { ...draft.short, en: e.target.value } })} className={areaClass} /></Field>
            <Field label="توضیحات کامل فارسی"><textarea required maxLength={5000} rows={4} value={draft.description.fa} onChange={(e) => setDraft({ ...draft, description: { ...draft.description, fa: e.target.value } })} className={areaClass} /></Field>
            <Field label="توضیحات کامل انگلیسی"><textarea maxLength={5000} rows={4} dir="ltr" value={draft.description.en} onChange={(e) => setDraft({ ...draft, description: { ...draft.description, en: e.target.value } })} className={areaClass} /></Field>
          </div>

          <Field label="مشخصات فنی (JSON)" hint='نمونه: [{"label":{"fa":"جنس","en":"Material"},"value":{"fa":"استیل","en":"Steel"}}]'>
            <textarea value={specsJson} onChange={(e) => setSpecsJson(e.target.value)} rows={5} dir="ltr" spellCheck={false} className={areaClass + " font-mono text-xs"} />
          </Field>
          <Field label="گزینه‌های قابل انتخاب (JSON)" hint='نوع گزینه: model، color، size یا design'>
            <textarea value={optionsJson} onChange={(e) => setOptionsJson(e.target.value)} rows={5} dir="ltr" spellCheck={false} className={areaClass + " font-mono text-xs"} />
          </Field>
          <Field label="بارگذاری تصویر از دستگاه" hint="JPG، PNG، WEBP یا AVIF · حداکثر ۴ مگابایت برای هر تصویر">
            <div className="flex flex-wrap items-center gap-3"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => void uploadImage(e)} disabled={uploadingImage || imagesText.split(/[\n,]/).filter((v) => v.trim()).length >= 8} className="block w-full text-sm file:ml-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary disabled:opacity-50" />{uploadingImage ? <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> در حال بارگذاری...</span> : null}</div>
          </Field>
          <Field label="آدرس تصاویر (قابل ویرایش)" hint="هر خط یک لینک مستقیم تصویر؛ حداکثر ۸ تصویر.">
            <textarea value={imagesText} onChange={(e) => setImagesText(e.target.value)} rows={3} dir="ltr" className={areaClass} placeholder="https://example.com/product-image.webp" />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="size-4 accent-primary" /> نمایش محصول در فروشگاه</label>
            <span className="text-xs text-muted-foreground">{imagesText.split(/[\n,]/).filter((v) => v.trim()).length} از ۸ تصویر</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy} className="flex-1 sm:flex-none">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{draft.id ? "ذخیره تغییرات" : "ثبت محصول"}</Button>
            <Button type="button" variant="outline" onClick={clearForm}>پاک‌کردن فرم</Button>
          </div>
        </form>

        <section className="min-w-0 rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-bold">فهرست محصولات</h2><p className="mt-1 text-xs text-muted-foreground">{productsLoading ? "در حال دریافت اطلاعات از پایگاه داده…" : "مدیریت محصولات ثبت‌شده در پایگاه داده"}</p></div>
            <Button type="button" size="sm" onClick={clearForm}><Plus className="size-4" /> محصول جدید</Button>
          </div>
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
            <div className="relative sm:col-span-3"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass + " pr-9"} placeholder="جست‌وجوی نام یا شناسه محصول..." /></div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputClass}><option value="all">همه دسته‌ها</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}><option value="all">همه وضعیت‌ها</option><option value="active">فعال</option><option value="inactive">غیرفعال</option></select>
            <div className="flex items-center justify-center rounded-xl bg-muted/50 px-3 text-xs text-muted-foreground">{visibleItems.length} مورد</div>
          </div>

          <div className="grid gap-3">
            {visibleItems.map((product) => (
              <article key={product.id} className="flex min-w-0 gap-3 rounded-2xl border p-3 transition hover:border-primary/40">
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                  {product.images?.[0] ? <img src={optimizedProductImage(product.images[0], 240)} alt={product.name?.fa ?? ""} loading="lazy" decoding="async" width={160} height={160} referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/favicon.svg"; }} className="size-full object-cover" /> : <ImagePlus className="size-6 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold">{product.name?.fa || product.id}</p><span className={product.active ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700" : "rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"}>{product.active ? "فعال" : "غیرفعال"}</span></div>
                  <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">{product.id}</p>
                  <p className="mt-2 text-sm font-semibold">{formatMoney(product.price)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{(product.tags ?? []).map((tag) => <span key={tag} className="rounded-md bg-primary/8 px-2 py-0.5 text-[10px] text-primary">{tagLabels[tag] ?? tag}</span>)}</div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button type="button" size="sm" variant="outline" onClick={() => edit(product)}><Eye className="size-3.5" /> ویرایش</Button>
                  <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => void remove(product.id)}><Trash2 className="size-3.5" /> حذف</Button>
                </div>
              </article>
            ))}
            {visibleItems.length === 0 && (
              <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed p-6 text-center">
                <div><Package className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-semibold">{items.length ? "محصولی با این فیلتر پیدا نشد" : "هنوز محصولی ثبت نشده است"}</p><p className="mt-1 text-sm text-muted-foreground">{items.length ? "عبارت جست‌وجو یا فیلترها را تغییر دهید." : "اولین کالای واقعی فروشگاه را از فرم کنار صفحه ثبت کنید."}</p></div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
