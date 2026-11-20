import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getAdminOrders, updateAdminOrderStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
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
  pending: "در انتظار بررسی",
  confirmed: "تأیید شده",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

const statusOptions = Object.entries(statusLabels);

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const loadOrders = async (accessToken: string) => {
    setOrdersLoading(true);
    try {
      const result = await getAdminOrders({ data: { accessToken } });
      setOrders(result.orders as Order[]);
      setLoggedIn(true);
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
        const { data } = await withTimeout(supabase.auth.getSession(), 2500, "session_timeout");
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

  const refresh = async () => {
    setSubmitting(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error("session_expired");
      await loadOrders(data.session.access_token);
      toast.success("فهرست سفارش‌ها به‌روز شد");
    } catch {
      toast.error("دریافت سفارش‌ها انجام نشد؛ دوباره وارد شوید.");
      setLoggedIn(false);
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (orderId: string, status: string) => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error("session_expired");
      const result = await updateAdminOrderStatus({
        data: { accessToken: data.session.access_token, orderId, status: status as keyof typeof statusLabels & string },
      });
      setOrders((current) => current.map((order) =>
        order.id === orderId ? { ...order, status: result.order.status } : order
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
    <section className="container-page max-w-6xl py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-soft p-3 text-primary"><ShieldCheck className="size-6" /></div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">مدیریت سفارش‌های ناب استور</h1>
            <p className="mt-1 text-sm text-muted-foreground">پنل خصوصی مدیریت فروشگاه</p>
          </div>
        </div>
        <Button asChild variant="outline"><a href="/admin/products">مدیریت محصولات</a></Button>
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
              <p className="text-xs text-muted-foreground">۱۰۰ سفارش اخیر · نمایش فقط‌خواندنی اطلاعات</p>
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
                {!ordersLoading && orders.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">هنوز سفارشی ثبت نشده است.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
