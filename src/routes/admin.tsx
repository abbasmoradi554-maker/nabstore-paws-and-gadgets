import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Defensive route fallback: some Workers preview builds have served the /admin
// component at /admin/products even while resolving the products route metadata.
const LazyAdminProductsPage = lazy(() =>
  import("./admin.products").then((module) => ({ default: module.AdminProductsPage })),
);


export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab === "products" ? "products" as const : "orders" as const,
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
  const { tab } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "products">(tab);

  const loadOrders = async (accessToken: string) => {
    setOrdersLoading(true);
    try {
      setOrdersError(false);
      const { data, error } = await withTimeout(
        supabase.from("orders")
          .select("id, order_code, customer_name, mobile, city, total_toman, status, created_at")
          .order("created_at", { ascending: false })
          .range(0, 49),
        9000,
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
        if (token && active) {
          setLoggedIn(true);
          setLoading(false);
          void withTimeout(loadOrders(token), 10000, "orders_timeout").catch((error) => {
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
  }, []);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session?.access_token) throw new Error("login_failed");
      setLoggedIn(true);
      setPassword("");
      setLoggedIn(true);
      await loadOrders(data.session.access_token);
      toast.success("با موفقیت وارد پنل مدیریت شدید");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("admin_forbidden") || message.includes("Invalid login credentials")) {
        setLoggedIn(false);
        await supabase.auth.signOut();
        toast.error("ایمیل یا رمز عبور مجاز نیست.");
      } else {
        toast.error("ورود انجام شد، اما دریافت سفارش‌ها ناموفق بود؛ دوباره به‌روزرسانی کنید.");
      }
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const loadMoreOrders = async () => {
    if (loadingMore || !hasMoreOrders) return;
    setLoadingMore(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) throw new Error("session_expired");
      const from = orders.length;
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_code, customer_name, mobile, city, total_toman, status, created_at")
        .order("created_at", { ascending: false })
        .range(from, from + 49);
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
      await loadOrders(data.session.access_token);
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
      const { data: updated, error } = await supabase
        .from("orders")
        .update({ status: status as keyof typeof statusLabels & string })
        .eq("id", orderId)
        .select("id, status")
        .single();
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
    await supabase.auth.signOut();
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
          <Button type="button" variant={activeTab === "orders" ? "default" : "ghost"} onClick={() => setActiveTab("orders")}>مدیریت سفارش‌ها</Button>
          <Button type="button" variant={activeTab === "products" ? "default" : "ghost"} onClick={() => setActiveTab("products")}>مدیریت محصولات</Button>
        </div>
      ) : null}
      {activeTab === "products" && loggedIn ? (
        <Suspense fallback={<div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /> در حال باز کردن مدیریت محصولات…</div>}>
          <LazyAdminProductsPage onBack={() => setActiveTab("orders")} />
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

      {!loggedIn ? (
        <form onSubmit={login} className="mx-auto grid max-w-md gap-4 rounded-3xl border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-bold">ورود مدیر</h2>
          <label className="grid gap-2 text-sm font-medium">
            ایمیل
            <input type="email" required autoComplete="username" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl border bg-background px-4 text-left outline-none focus:border-ring" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            رمز عبور
            <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border bg-background px-4 outline-none focus:border-ring" />
          </label>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            ورود به پنل
          </Button>
          <p className="text-xs leading-6 text-muted-foreground">دسترسی فقط برای ایمیل مدیر تعریف‌شده در تنظیمات امن سرور امکان‌پذیر است.</p>
        </form>
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

          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead className="bg-secondary/70 text-muted-foreground">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">کد سفارش</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">نام مشتری</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">موبایل</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">شهر</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">مبلغ کل</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">وضعیت سفارش</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">تاریخ ثبت</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
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
                  </tr>
                ))}
                {ordersLoading && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground"><span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" /> در حال دریافت سفارش‌ها…</span></td></tr>
                )}
                {!ordersLoading && ordersError && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-destructive">دریافت سفارش‌ها ناموفق بود. اتصال را بررسی و «به‌روزرسانی» را انتخاب کنید.</td></tr>
                )}
                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">هنوز سفارشی ثبت نشده است.</td></tr>
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
