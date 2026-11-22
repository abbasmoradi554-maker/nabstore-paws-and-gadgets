import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { KeyRound, LoaderCircle, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Defensive route fallback: some Workers preview builds have served the /admin
// component at /admin/products even while resolving the products route metadata.
const LazyAdminProductsPage = lazy(() =>
  import("./admin.products").then((module) => ({ default: module.AdminProductsPage })),
);
const LazyAdminContentPage = lazy(() =>
  import("@/components/admin/AdminContentPage").then((module) => ({ default: module.AdminContentPage })),
);


export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab === "products" ? "products" as const : search.tab === "content" ? "content" as const : "orders" as const,
    recovery: search.recovery === "1",
  }),
  head: () => ({
    meta: [
      { title: "مدیریت سفارش‌ها | ناب استور" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  mobile: string;
  city: string;
  total_toman: number;
  status: string;
  created_at: string;
  province: string;
  address: string;
  postal_code: string;
  notes: string;
  items: unknown;
};

const statusLabels: Record<string, string> = {
  pending_review: "در انتظار بررسی",
  pending: "در انتظار بررسی",
  confirmed: "تأیید شده",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

const statusOptions = Object.entries(statusLabels);

function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string): Promise<T> {
  let timer: number | undefined;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => { timer = window.setTimeout(() => reject(new Error(message)), ms); }),
  ]).finally(() => { if (timer !== undefined) window.clearTimeout(timer); });
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function AdminPage() {
  const { tab, recovery: recoverySearch } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin" });
  const selectTab = (next: "orders" | "products" | "content") => {
    setActiveTab(next);
    void navigate({ search: (current) => ({ ...current, tab: next }), replace: true });
  };
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem("nabstore-admin-username") ?? ""; } catch { return ""; }
  });
  const [rememberUsername, setRememberUsername] = useState(() => {
    try { return localStorage.getItem("nabstore-admin-remember-username") === "true"; } catch { return false; }
  });
  const [password, setPassword] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(() => recoverySearch || new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "products">(tab);

  // Keep the visible tab synchronized with browser back/forward navigation.
  useEffect(() => setActiveTab(tab), [tab]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      setOrdersError(false);
      const { data, error } = await withTimeout(
        supabase.from("orders")
          .select("id, order_code, customer_name, mobile, province, city, address, postal_code, notes, items, total_toman, status, created_at")
          .order("created_at", { ascending: false })
          .range(0, 49)
          .abortSignal(AbortSignal.timeout(10000)),
        11000,
        "orders_timeout",
      );
      if (error) throw error;
      setOrders((data ?? []) as Order[]);
      setHasMoreOrders((data?.length ?? 0) === 50);
      setOrdersError(false);
      setLoggedIn(true);
    } catch (error) {
      setOrdersError(true);
      throw error;
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string) =>
      Promise.race<T>([
        promise,
        new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error(label)), ms)),
      ]);

    void (async () => {
      try {
        // Session restoration is local-storage based; don't hold the whole page
        // behind the orders API request.
        const { data } = await withTimeout(supabase.auth.getSession(), 1800, "session_timeout");
        const token = data.session?.access_token;
        if (token && active && !recoveryMode) {
          setLoggedIn(true);
          setLoading(false);
          void withTimeout(loadOrders(), 10000, "orders_timeout").catch((error) => {
            if (active) {
              console.error("Admin orders initial load failed", error);
              toast.error("دریافت سفارش‌ها طول کشید؛ از دکمه به‌روزرسانی استفاده کنید.");
            }
          });
        }
      } catch (error) {
        if (active) {
          console.error("Admin session restore failed", error);
          toast.error("بازیابی نشست انجام نشد؛ لطفاً دوباره وارد شوید.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [recoveryMode]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    if (!email.trim() || !password) {
      setLoginError("لطفاً ایمیل و رمز عبور را وارد کنید.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLoginError("فرمت ایمیل صحیح نیست؛ ایمیل را به شکل name@example.com وارد کنید.");
      return;
    }
    setSubmitting(true);
    try {
      // A stalled auth request must never leave the login form spinning forever.
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        12000,
        "login_timeout",
      );
      if (error || !data.session?.access_token) {
        setLoggedIn(false);
        setLoginError(error
          ? "ورود رد شد؛ ایمیل یا رمز عبور را بررسی کنید."
          : "ورود تأیید نشد؛ نشست معتبری از سرور دریافت نشد. دوباره تلاش کنید.");
        setPassword("");
        return;
      }
      setLoggedIn(true);
      try {
        if (rememberUsername) {
          localStorage.setItem("nabstore-admin-username", email.trim());
          localStorage.setItem("nabstore-admin-remember-username", "true");
        } else {
          localStorage.removeItem("nabstore-admin-username");
          localStorage.removeItem("nabstore-admin-remember-username");
        }
      } catch {
        // Storage may be disabled; browser password managers can still offer to save credentials.
      }
      setPassword("");
      // Complete authentication before loading the dashboard data. The admin
      // screen becomes usable immediately while orders load independently.
      setSubmitting(false);
      try {
        await loadOrders();
        toast.success("با موفقیت وارد پنل مدیریت شدید");
      } catch {
        toast.error("ورود موفق بود، اما دریافت سفارش‌ها ناموفق بود؛ از به‌روزرسانی استفاده کنید.");
      }
    } catch (error) {
      console.error("Admin login failed", error);
      const message = error instanceof Error ? error.message : "";
      setLoginError(message === "login_timeout"
        ? "پاسخی از سرور ورود دریافت نشد (بیش از ۱۲ ثانیه). اتصال یا درخواست احراز هویت را بررسی کنید و دوباره تلاش کنید."
        : "ارتباط با سرویس ورود برقرار نشد. اینترنت یا مسدودشدن درخواست را بررسی کنید و دوباره تلاش کنید.");
      setPassword("");
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const requestPasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecoveryError("");
    setRecoverySent(false);
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setRecoveryError("ابتدا ایمیل معتبر حساب مدیر را وارد کنید.");
      return;
    }
    setSendingRecovery(true);
    try {
      const redirectTo = new URL("/admin?recovery=1", window.location.origin).toString();
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo }),
        15000,
        "recovery_timeout",
      );
      if (error) throw error;
      setRecoverySent(true);
    } catch (error) {
      console.error("Admin password recovery request failed", error);
      setRecoveryError(error instanceof Error && error.message === "recovery_timeout"
        ? "پاسخ سرویس بازیابی دیر رسید. کمی بعد دوباره تلاش کنید."
        : "ارسال ایمیل بازیابی انجام نشد. تنظیمات ایمیل و اتصال سرویس را بررسی کنید.");
    } finally {
      setSendingRecovery(false);
    }
  };

  const saveNewPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecoveryError("");
    if (newPassword.length < 8) {
      setRecoveryError("رمز جدید باید حداقل ۸ نویسه داشته باشد.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setRecoveryError("تکرار رمز عبور با رمز جدید یکسان نیست.");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { data: sessionData, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        7000,
        "recovery_session_timeout",
      );
      if (sessionError || !sessionData.session?.access_token) throw new Error("recovery_session_missing");
      const { error } = await withTimeout(
        supabase.auth.updateUser({ password: newPassword }),
        15000,
        "password_update_timeout",
      );
      if (error) throw error;
      setPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setRecoveryMode(false);
      setForgotPassword(false);
      void navigate({ search: (current) => ({ ...current, recovery: false, tab: "orders" }), replace: true });
      setLoggedIn(true);
      setSubmitting(true);
      try {
        await loadOrders();
        toast.success("رمز عبور با موفقیت تغییر کرد و وارد پنل شدید.");
      } catch {
        toast.success("رمز عبور تغییر کرد؛ دریافت سفارش‌ها را می‌توانید با به‌روزرسانی دوباره انجام دهید.");
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Admin password update failed", error);
      const message = error instanceof Error ? error.message : "";
      setRecoveryError(message === "recovery_session_missing"
        ? "لینک بازیابی معتبر نیست یا منقضی شده است. از صفحه ورود دوباره درخواست لینک بدهید."
        : message === "recovery_session_timeout" || message === "password_update_timeout"
          ? "پاسخ سرویس بازیابی دیر رسید. صفحه را تازه‌سازی و در صورت نیاز لینک جدید درخواست کنید."
          : "تغییر رمز انجام نشد؛ ممکن است لینک منقضی شده باشد. یک لینک بازیابی تازه درخواست کنید.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const visibleOrders = orders.filter((order) => {
    const query = orderSearch.trim().toLocaleLowerCase();
    const matchesText = !query || [order.order_code, order.customer_name, order.mobile, order.city].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesText && matchesStatus;
  });

  const loadMoreOrders = async () => {
    if (loadingMore || !hasMoreOrders) return;
    setLoadingMore(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) throw new Error("session_expired");
      const from = orders.length;
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_code, customer_name, mobile, province, city, address, postal_code, notes, items, total_toman, status, created_at")
        .order("created_at", { ascending: false })
        .range(from, from + 49)
        .abortSignal(AbortSignal.timeout(10000));
      if (error) throw error;
      const page = (data ?? []) as Order[];
      setOrders((current) => {
        const seen = new Set(current.map((order) => order.id));
        return [...current, ...page.filter((order) => !seen.has(order.id))];
      });
      setHasMoreOrders(page.length === 50);
    } catch (error) {
      console.error("Admin older orders load failed", error);
      toast.error("دریافت سفارش‌های قدیمی‌تر انجام نشد.");
    } finally {
      setLoadingMore(false);
    }
  };

  const refresh = async () => {
    setSubmitting(true);
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 5000, "session_timeout");
      if (!data.session?.access_token) throw new Error("session_expired");
      await loadOrders();
      toast.success("فهرست سفارش‌ها به‌روز شد");
    } catch {
      toast.error("دریافت سفارش‌ها انجام نشد؛ اتصال را بررسی و دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (orderId: string, status: string) => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error("session_expired");
      const { data: updated, error } = await withTimeout(supabase
        .from("orders")
        .update({ status: status as keyof typeof statusLabels & string })
        .eq("id", orderId)
        .select("id, status")
        .single()
        .abortSignal(AbortSignal.timeout(10000)), 11000, "order_update_timeout");
      if (error || !updated) throw error ?? new Error("order_update_failed");
      setOrders((current) => current.map((order) =>
        order.id === orderId ? { ...order, status: updated.status } : order
      ));
      toast.success("وضعیت سفارش تغییر کرد");
    } catch {
      toast.error("تغییر وضعیت سفارش انجام نشد.");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    setOrders([]);
    setLoggedIn(false);
  };

  if (loading) {
    return <section className="container-page flex min-h-[50vh] items-center justify-center"><LoaderCircle className="size-7 animate-spin text-primary" /></section>;
  }

  return (
    <section className="container-page max-w-6xl py-8">
      {loggedIn ? (
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border bg-card p-2">
          <Button type="button" variant={activeTab === "orders" ? "default" : "ghost"} onClick={() => selectTab("orders")}>مدیریت سفارش‌ها</Button>
          <Button type="button" variant={activeTab === "products" ? "default" : "ghost"} onClick={() => selectTab("products")}>مدیریت محصولات</Button>
          <Button type="button" variant={activeTab === "content" ? "default" : "ghost"} onClick={() => selectTab("content")}>مدیریت محتوای سایت</Button>
        </div>
      ) : null}
      {activeTab === "content" && loggedIn ? (
        <Suspense fallback={<div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /> در حال باز کردن مدیریت محتوا…</div>}>
          <LazyAdminContentPage onBack={() => selectTab("orders")} />
        </Suspense>
      ) : activeTab === "products" && loggedIn ? (
        <Suspense fallback={<div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /> در حال باز کردن مدیریت محصولات…</div>}>
          <LazyAdminProductsPage onBack={() => selectTab("orders")} />
        </Suspense>
      ) : (
      <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-soft p-3 text-primary"><ShieldCheck className="size-6" /></div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">مدیریت سفارش‌های ناب استور</h1>
            <p className="mt-1 text-sm text-muted-foreground">پنل خصوصی مدیریت فروشگاه</p>
          </div>
        </div>
        {loggedIn ? <span className="text-sm text-muted-foreground">داشبورد یکپارچه ناب استور</span> : null}
      </div>

      {recoveryMode ? (
        <form noValidate onSubmit={saveNewPassword} className="mx-auto grid max-w-md gap-4 rounded-3xl border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-soft p-3 text-primary"><KeyRound className="size-5" /></div>
            <div>
              <h2 className="text-lg font-bold">تعیین رمز عبور جدید</h2>
              <p className="text-sm text-muted-foreground">پس از بازکردن لینک ایمیل، رمز تازه را وارد کنید.</p>
            </div>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            رمز عبور جدید
            <input type="password" name="new-password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="h-11 rounded-xl border bg-background px-4 outline-none focus:border-ring" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            تکرار رمز عبور جدید
            <input type="password" name="confirm-new-password" autoComplete="new-password" minLength={8} required value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} className="h-11 rounded-xl border bg-background px-4 outline-none focus:border-ring" />
          </label>
          {recoveryError ? <p role="alert" aria-live="assertive" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">{recoveryError}</p> : null}
          <Button type="submit" size="lg" disabled={updatingPassword}>
            {updatingPassword ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {updatingPassword ? "در حال ذخیره رمز جدید…" : "ذخیره رمز جدید"}
          </Button>
        </form>
      ) : !loggedIn ? (
        <>
        <form noValidate autoComplete="on" onSubmit={login} className="mx-auto grid max-w-md gap-4 rounded-3xl border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold">ورود مدیر</h2>
          <label className="grid gap-2 text-sm font-medium">
            ایمیل
            <input type="email" name="username" inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="username" dir="ltr" value={email} onChange={(event) => { const nextEmail = event.target.value; setEmail(nextEmail); if (rememberUsername) { try { localStorage.setItem("nabstore-admin-username", nextEmail); } catch { /* Browser storage may be disabled. */ } } }} className="h-11 rounded-xl border bg-background px-4 text-left outline-none focus:border-ring" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            رمز عبور
            <input type="password" name="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border bg-background px-4 outline-none focus:border-ring" />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberUsername}
              onChange={(event) => { const checked = event.target.checked; setRememberUsername(checked); try { if (checked) { if (email.trim()) localStorage.setItem("nabstore-admin-username", email.trim()); localStorage.setItem("nabstore-admin-remember-username", "true"); } else { localStorage.removeItem("nabstore-admin-username"); localStorage.removeItem("nabstore-admin-remember-username"); } } catch { /* Browser storage may be disabled. */ } }}
              className="size-4 accent-primary"
            />
            مرا به خاطر بسپار (ذخیره ایمیل و پیشنهاد ذخیره رمز در مرورگر)
          </label>
          {loginError ? <p role="alert" aria-live="assertive" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium leading-6 text-destructive">{loginError}</p> : null}
          {submitting ? <p role="status" aria-live="polite" className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> درخواست ورود ارسال شد؛ در حال دریافت پاسخ سرور…</p> : null}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {submitting ? "در حال بررسی اطلاعات…" : "ورود به پنل"}
          </Button>
          <p className="text-xs leading-6 text-muted-foreground">دسترسی فقط برای ایمیل مدیر تعریف‌شده در تنظیمات امن سرور امکان‌پذیر است.</p>
          <button type="button" onClick={() => { setForgotPassword((value) => !value); setRecoverySent(false); setRecoveryError(""); }} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            {forgotPassword ? "بازگشت به ورود" : "رمز عبور را فراموش کرده‌ام"}
          </button>
        </form>
        {forgotPassword ? (
          <form noValidate onSubmit={requestPasswordReset} className="mx-auto mt-4 grid max-w-md gap-3 rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">بازیابی رمز عبور مدیر</h3>
            <p className="text-sm leading-6 text-muted-foreground">لینک امن تغییر رمز به ایمیل همین حساب ارسال می‌شود. اگر ایمیل را پیدا نکردید، پوشه هرزنامه را هم بررسی کنید.</p>
            {recoveryError ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{recoveryError}</p> : null}
            {recoverySent ? <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm leading-6">اگر این ایمیل به حساب مدیر متصل باشد، لینک بازیابی ارسال شده است. ایمیل را باز کنید و لینک را روی همین مرورگر دنبال کنید.</p> : null}
            <Button type="submit" variant="outline" disabled={sendingRecovery || recoverySent}>
              {sendingRecovery ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {sendingRecovery ? "در حال ارسال لینک…" : recoverySent ? "لینک ارسال شد" : "ارسال لینک بازیابی"}
            </Button>
          </form>
        ) : null}
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
            <div>
              <p className="font-semibold">آخرین سفارش‌ها</p>
              <p className="text-xs text-muted-foreground">۵۰ سفارش اخیر در هر مرحله · دریافت تدریجی سوابق</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={refresh} disabled={submitting}>
                <RefreshCw className={submitting ? "size-4 animate-spin" : "size-4"} /> به‌روزرسانی
              </Button>
              <Button type="button" variant="ghost" onClick={logout}><LogOut className="size-4" /> خروج</Button>
            </div>
          </div>

          <div className="mb-4 grid gap-2 rounded-2xl border bg-card p-3 sm:grid-cols-[1fr_220px]">
            <input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="جست‌وجوی کد سفارش، نام، موبایل یا شهر…" className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-ring" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:border-ring"><option value="all">همه وضعیت‌ها</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <p className="text-xs text-muted-foreground sm:col-span-2">{visibleOrders.length} سفارش از {orders.length} سفارش بارگذاری‌شده</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[980px] text-right text-sm">
              <thead className="bg-secondary/70 text-muted-foreground">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">کد سفارش</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">نام مشتری</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">موبایل</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">شهر</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">مبلغ کل</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">وضعیت سفارش</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">تاریخ ثبت</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">جزئیات</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <>
                  <tr key={order.id} className="border-t align-middle">
                    <td dir="ltr" className="whitespace-nowrap px-4 py-3 font-semibold">{order.order_code}</td>
                    <td className="whitespace-nowrap px-4 py-3">{order.customer_name}</td>
                    <td dir="ltr" className="whitespace-nowrap px-4 py-3">{order.mobile}</td>
                    <td className="whitespace-nowrap px-4 py-3">{order.city}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatMoney(order.total_toman)}</td>
                    <td className="px-4 py-3">
                      <select aria-label={`وضعیت سفارش ${order.order_code}`} value={order.status} onChange={(event) => void changeStatus(order.id, event.target.value)} className="h-10 min-w-36 rounded-lg border bg-background px-3 outline-none focus:border-ring">
                        {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        {!statusLabels[order.status] && <option value={order.status}>{order.status}</option>}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3"><Button type="button" size="sm" variant="outline" onClick={() => setExpandedOrderId((current) => current === order.id ? null : order.id)}>{expandedOrderId === order.id ? "بستن" : "مشاهده"}</Button></td>
                  </tr>
                  {expandedOrderId === order.id ? <tr className="border-t bg-muted/20"><td colSpan={8} className="p-4"><div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><span className="text-muted-foreground">استان:</span> {order.province || "—"}</div><div><span className="text-muted-foreground">کد پستی:</span> <b dir="ltr">{order.postal_code || "—"}</b></div>
                    <div className="sm:col-span-2"><span className="text-muted-foreground">نشانی:</span> {order.address || "—"}</div><div className="sm:col-span-2"><span className="text-muted-foreground">توضیحات مشتری:</span> {order.notes || "—"}</div>
                    <div className="sm:col-span-2"><b>اقلام سفارش</b>{Array.isArray(order.items) && order.items.length ? <ul className="mt-2 grid gap-1">{order.items.map((rawItem, index) => { const item = rawItem && typeof rawItem === "object" ? rawItem as Record<string, unknown> : {}; const itemName = String(item.nameFa ?? item.name ?? item.title ?? item.product_name ?? item.productName ?? "محصول"); const quantity = Number(item.quantity ?? item.qty ?? 1); const price = Number(item.price ?? item.unit_price ?? item.unitPrice ?? 0); const lineTotal = Number(item.lineTotal ?? 0); return <li key={index} className="flex flex-wrap justify-between gap-2 rounded-lg border bg-background px-3 py-2"><span>{itemName} × {Number.isFinite(quantity) ? quantity : 1}</span><span className="text-muted-foreground">{lineTotal > 0 ? formatMoney(lineTotal) : price > 0 ? formatMoney(price) : ""}</span></li>; })}</ul> : <p className="mt-2 text-muted-foreground">جزئیات اقلام در داده این سفارش موجود نیست.</p>}</div>
                  </div></td></tr> : null}
                  </>
                ))}
                {ordersLoading && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground"><span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" /> در حال دریافت سفارش‌ها…</span></td></tr>
                )}
                {!ordersLoading && ordersError && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-destructive">دریافت سفارش‌ها ناموفق بود. اتصال را بررسی و «به‌روزرسانی» را انتخاب کنید.</td></tr>
                )}
                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">هنوز سفارشی ثبت نشده است.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {hasMoreOrders && (
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="outline" onClick={() => void loadMoreOrders()} disabled={loadingMore}>
                {loadingMore ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {loadingMore ? "در حال دریافت..." : "نمایش ۵۰ سفارش قدیمی‌تر"}
              </Button>
            </div>
          )}
        </>
      )}
      </>
      )}
    </section>
  );
}
