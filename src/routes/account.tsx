import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LogIn, LogOut, PackageCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "حساب مشتری | ناب استور" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CustomerAccount,
});

type Order = {
  id: string; order_code: string; customer_name: string; mobile: string;
  city: string; province: string; total_toman: number; shipping_toman: number;
  status: string; created_at: string; items: unknown;
};
const statuses: Record<string,string> = {
  pending_review: "در انتظار بررسی", pending: "در انتظار بررسی", confirmed: "تأیید شده",
  processing: "در حال آماده‌سازی", shipped: "ارسال شده", delivered: "تحویل شده", cancelled: "لغو شده",
};
const money = (value:number) => `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;

function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> {
  let timer: number | undefined;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => { timer = window.setTimeout(() => reject(new Error(message)), ms); }),
  ]).finally(() => { if (timer !== undefined) window.clearTimeout(timer); });
}

function CustomerAccount() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [mode, setMode] = useState<"login"|"signup"|"recover"|"reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderCode, setOrderCode] = useState("");
  const [mobile, setMobile] = useState("");
  const [showClaim, setShowClaim] = useState(false);

  const loadOrders = async (userId: string) => {
    const request = supabase.from("orders")
      .select("id,order_code,customer_name,mobile,city,province,total_toman,shipping_toman,status,created_at,items")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(50)
      .abortSignal(AbortSignal.timeout(8000));
    const { data, error } = await withTimeout(request, 9000, "customer_orders_timeout");
    if (error) throw error;
    setOrders((data ?? []) as Order[]);
  };

  useEffect(() => {
    let active = true;
    // Subscribe before restoring the stored session. Otherwise a slow getSession()
    // can resolve with null AFTER signInWithPassword succeeds and overwrite the
    // newly authenticated React state, leaving the customer on the login form.
    let authEventObserved = false;
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      authEventObserved = true;
      if (event === "PASSWORD_RECOVERY") setMode("reset");
      setSession(nextSession);
      if (nextSession) {
        window.setTimeout(() => {
          if (active) void loadOrders(nextSession.user.id).catch((error) => {
            console.error("Customer order history refresh failed", error);
            if (active) toast.error("دریافت سفارش‌ها انجام نشد؛ دوباره تلاش کنید.");
          });
        }, 0);
      } else setOrders([]);
    });

    // Restore an existing session only if no newer auth event has arrived.
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || authEventObserved) return;
      if (error) console.error("Customer session restore failed", error);
      setSession(data.session);
      if (data.session) {
        void loadOrders(data.session.user.id).catch((loadError) => {
          console.error("Customer order history failed", loadError);
          if (active) toast.error("دریافت سفارش‌ها طول کشید؛ می‌توانید بعداً دوباره تلاش کنید.");
        });
      }
    }).catch((error) => {
      if (!active) return;
      console.error("Customer session restore failed", error);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const authenticate = async (event?: FormEvent) => {
    event?.preventDefault();
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFeedback("لطفاً یک ایمیل معتبر وارد کنید.");
      toast.error("ایمیل واردشده معتبر نیست.");
      return;
    }
    if (password.length < (mode === "signup" ? 12 : 8)) {
      const message = mode === "signup" ? "رمز عبور باید حداقل ۱۲ کاراکتر باشد." : "رمز عبور باید حداقل ۸ کاراکتر باشد.";
      setFeedback(message);
      toast.error(message);
      return;
    }
    if (mode === "signup" && !(/\p{Ll}/u.test(password) && /\p{Lu}/u.test(password) && /\d/.test(password) && /[^\p{L}\d]/u.test(password))) {
      const message = "برای امنیت، رمز ثبت‌نام باید شامل حروف کوچک و بزرگ، عدد و نماد باشد.";
      setFeedback(message);
      toast.error(message);
      return;
    }
    setBusy(true);
    setFeedback(mode === "login" ? "در حال بررسی اطلاعات ورود…" : "در حال ساخت حساب مشتری…");
    try {
      if (mode === "login") {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email: normalizedEmail, password }),
          15000,
          "customer_login_timeout",
        );
        if (error) throw error;
        setSession(data.session);
        void loadOrders(data.session.user.id).catch((loadError) => {
          console.error("Customer orders after login failed", loadError);
          toast.error("ورود موفق بود؛ دریافت سفارش‌ها کمی طول کشید و می‌توانید دوباره تلاش کنید.");
        });
        setFeedback("ورود موفق بود؛ حساب شما در حال بارگذاری است.");
        toast.success("با موفقیت وارد حساب شدید.");
      } else {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email: normalizedEmail, password,
            options: { emailRedirectTo: `${window.location.origin}/account` },
          }),
          15000,
          "customer_signup_timeout",
        );
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          void loadOrders(data.session.user.id).catch((loadError) => {
            console.error("Customer orders after signup failed", loadError);
            toast.error("حساب ساخته شد؛ دریافت سفارش‌ها کمی طول کشید.");
          });
          setFeedback("حساب مشتری ساخته شد و وارد حساب شدید.");
          toast.success("حساب مشتری ساخته شد.");
        } else {
          setFeedback("درخواست ثبت‌نام انجام شد. اگر تأیید ایمیل فعال باشد، لینک ورود برایتان ارسال می‌شود.");
          toast.success("لینک تأیید به ایمیل شما ارسال شد؛ پس از تأیید، وارد حساب شوید.");
        }
      }
    } catch (error) {
      console.error("Customer authentication failed", error);
      setFeedback(error instanceof Error ? `خطا: ${error.message}` : "ورود یا ساخت حساب انجام نشد؛ دوباره تلاش کنید.");
      toast.error("ورود یا ساخت حساب انجام نشد؛ ایمیل و رمز عبور را بررسی کنید.");
    } finally { setBusy(false); }
  };

  const requestPasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/account` }),
        15000,
        "customer_recovery_timeout",
      );
      if (error) throw error;
      toast.success("اگر این ایمیل حساب فعالی داشته باشد، لینک بازیابی برای آن ارسال می‌شود.");
      setMode("login");
    } catch (error) {
      console.error("Customer password recovery failed", error);
      toast.error("ارسال لینک بازیابی انجام نشد؛ کمی بعد دوباره تلاش کنید.");
    } finally { setBusy(false); }
  };

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 12 || !(/\p{Ll}/u.test(password) && /\p{Lu}/u.test(password) && /\d/.test(password) && /[^\p{L}\d]/u.test(password))) {
      toast.error("رمز جدید باید حداقل ۱۲ کاراکتر و شامل حروف کوچک و بزرگ، عدد و نماد باشد.");
      return;
    }
    if (password !== confirmPassword) { toast.error("تکرار رمز عبور با رمز جدید مطابقت ندارد."); return; }
    setBusy(true);
    try {
      const { error } = await withTimeout(supabase.auth.updateUser({ password }), 15000, "customer_password_update_timeout");
      if (error) throw error;
      setPassword(""); setConfirmPassword(""); setMode("login");
      toast.success("رمز عبور با موفقیت تغییر کرد.");
    } catch (error) {
      console.error("Customer password update failed", error);
      toast.error("تغییر رمز انجام نشد؛ لینک بازیابی ممکن است منقضی شده باشد.");
    } finally { setBusy(false); }
  };

  const claimOrder = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const normalizedMobile = mobile.replace(/[۰-۹]/g, d => String(d.charCodeAt(0)-0x06f0)).replace(/[٠-٩]/g, d => String(d.charCodeAt(0)-0x0660)).replace(/[\s-]/g, "");
      const { data, error } = await supabase.functions.invoke("claim-order", {
        body: { orderCode: orderCode.trim().toUpperCase(), mobile: normalizedMobile },
      });
      if (error) throw error;
      if (!data?.claimed) throw new Error("order_not_found");
      await loadOrders(session!.user.id);
      setOrderCode(""); setMobile(""); setShowClaim(false);
      toast.success("سفارش قبلی به حساب شما اضافه شد.");
    } catch (error) {
      console.error("Order claim failed", error);
      toast.error("سفارش پیدا نشد یا اطلاعات آن با سفارش ثبت‌شده مطابقت ندارد. پس از چند تلاش ناموفق، ۱۵ دقیقه محدودیت اعمال می‌شود.");
    } finally { setBusy(false); }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null); setOrders([]);
  };

  return (
    <section className="container-page max-w-4xl py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-primary-soft p-3 text-primary"><UserRound className="size-6" /></div>
        <div><h1 className="text-2xl font-bold">حساب مشتری ناب استور</h1><p className="mt-1 text-sm text-muted-foreground">مشاهده سفارش‌های قبلی و پیگیری وضعیت خریدها</p></div>
      </div>
      {mode === "reset" ? (
        <form onSubmit={updatePassword} className="mx-auto grid max-w-lg gap-4 rounded-3xl border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold">تنظیم رمز عبور جدید</h2>
          <label className="grid gap-2 text-sm font-medium">رمز جدید
            <input type="password" required minLength={12} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="h-11 rounded-xl border bg-background px-4" />
          </label>
          <label className="grid gap-2 text-sm font-medium">تکرار رمز جدید
            <input type="password" required minLength={12} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="h-11 rounded-xl border bg-background px-4" />
          </label>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "لطفاً صبر کنید…" : "ذخیره رمز جدید"}</Button>
        </form>
      ) : mode === "recover" ? (
        <form onSubmit={requestPasswordReset} className="mx-auto grid max-w-lg gap-4 rounded-3xl border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold">بازیابی رمز عبور</h2>
          <label className="grid gap-2 text-sm font-medium">ایمیل حساب
            <input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="h-11 rounded-xl border bg-background px-4" />
          </label>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "در حال ارسال…" : "ارسال لینک بازیابی"}</Button>
          <button type="button" className="text-sm text-primary underline" onClick={()=>setMode("login")}>بازگشت به ورود</button>
        </form>
      ) : !session ? (
        <form noValidate onSubmit={authenticate} className="mx-auto grid max-w-lg gap-4 rounded-3xl border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold">{mode === "login" ? "ورود به حساب" : "ساخت حساب مشتری"}</h2>
          <label className="grid gap-2 text-sm font-medium">ایمیل
            <input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="h-11 rounded-xl border bg-background px-4" />
          </label>
          <label className="grid gap-2 text-sm font-medium">رمز عبور (ثبت‌نام: حداقل ۱۲ کاراکتر، حروف کوچک و بزرگ، عدد و نماد)
            <input type="password" required minLength={mode==="signup" ? 12 : 8} autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} className="h-11 rounded-xl border bg-background px-4" />
          </label>
          <Button type="button" disabled={busy} onClick={() => void authenticate()} className="w-full">{busy ? "لطفاً صبر کنید…" : mode==="login" ? <><LogIn className="size-4" /> ورود</> : "ساخت حساب"}</Button>
          <p role="status" aria-live="polite" className="min-h-6 text-center text-sm text-muted-foreground">{feedback}</p>
          {mode === "login" && <button type="button" className="text-sm text-primary underline" onClick={()=>setMode("recover")}>رمز عبور را فراموش کرده‌اید؟</button>}
          <button type="button" className="text-sm text-primary underline" onClick={()=>{setFeedback("");setMode(mode==="login"?"signup":"login");}}>{mode==="login"?"حساب ندارید؟ ثبت‌نام کنید":"قبلاً حساب ساخته‌اید؟ وارد شوید"}</button>
          <p className="text-xs leading-6 text-muted-foreground">برای فعال‌سازی حساب ممکن است لازم باشد ایمیل خود را تأیید کنید. در ثبت‌نام رمز قوی با حداقل ۱۲ کاراکتر، حروف کوچک و بزرگ، عدد و نماد انتخاب کنید. رمز عبور شما در ناب استور ذخیره یا قابل مشاهده نیست؛ مدیریت آن بر عهده سرویس امن Supabase Auth است.</p>
        </form>
      ) : (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
            <div><p className="text-sm text-muted-foreground">واردشده با</p><p className="font-semibold" dir="ltr">{session.user.email}</p></div>
            <Button variant="outline" onClick={()=>void signOut()}><LogOut className="size-4" /> خروج</Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">سفارش‌های من</h2>
            <Button variant="outline" onClick={()=>setShowClaim(v=>!v)}>بازیابی سفارش قبلی</Button>
          </div>
          {showClaim && <form onSubmit={claimOrder} className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">شماره سفارش<input required value={orderCode} onChange={e=>setOrderCode(e.target.value)} placeholder="NB-12345678" dir="ltr" className="h-11 rounded-lg border bg-background px-3" /></label>
            <label className="grid gap-1 text-sm">موبایل ثبت‌شده در سفارش<input required value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="09xxxxxxxxx" dir="ltr" inputMode="tel" className="h-11 rounded-lg border bg-background px-3" /></label>
            <div className="flex items-end"><Button type="submit" disabled={busy} className="w-full">{busy?"در حال بررسی…":"افزودن سفارش قبلی"}</Button></div>
            <p className="text-xs leading-6 text-muted-foreground sm:col-span-3">برای اتصال سفارش قدیمی، شماره سفارش و همان موبایلی را وارد کنید که هنگام خرید ثبت کرده‌اید. برای جلوگیری از حدس‌زدن اطلاعات، پس از ۵ تلاش ناموفق تا ۱۵ دقیقه محدودیت اعمال می‌شود.</p>
          </form>}
          {orders.length === 0 ? <div className="rounded-2xl border bg-card p-8 text-center"><PackageCheck className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-semibold">هنوز سفارشی به حساب شما متصل نیست.</p><p className="mt-2 text-sm text-muted-foreground">اگر قبلاً مهمان خرید کرده‌اید، از گزینه بازیابی سفارش قبلی استفاده کنید.</p><Button asChild className="mt-5"><Link to="/shop">مشاهده محصولات</Link></Button></div> :
            <div className="grid gap-4">{orders.map(order=><article key={order.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-muted-foreground">شماره سفارش</p><p className="font-bold" dir="ltr">{order.order_code}</p></div><span className="rounded-full bg-accent px-3 py-1 text-sm">{statuses[order.status]??order.status}</span></div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3"><p>تاریخ: {new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium"}).format(new Date(order.created_at))}</p><p>مقصد: {order.province}، {order.city}</p><p>مبلغ: {money(order.total_toman)}</p><p>هزینه ارسال: {order.shipping_toman===0?"رایگان":money(order.shipping_toman)}</p></div>
              <div className="mt-3 border-t pt-3 text-sm"><b>اقلام سفارش</b><ul className="mt-2 grid gap-1">{Array.isArray(order.items)&&order.items.map((raw,index)=>{const item=raw&&typeof raw==="object"?raw as Record<string,unknown>:{};return <li key={index} className="flex justify-between gap-2"><span>{String(item["nameFa"]??item["id"]??"محصول")} × {Number(item["qty"]??1)}</span><span>{money(Number(item["lineTotal"]??0))}</span></li>;})}</ul></div>
            </article>)}</div>}
        </div>
      )}
    </section>
  );
}
