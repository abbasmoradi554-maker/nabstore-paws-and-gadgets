import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const ADMIN_EMAIL = "abbasmoradi554@gmail.com";

async function admin(accessToken: string) {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("supabase_configuration_missing");

  const db = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  // Verify the access-token signature from cached JWKS where supported.
  // Unlike getUser(), getClaims() avoids a separate Auth API round-trip on every admin request.
  const { data, error } = await db.auth.getClaims(accessToken);
  const email = String(data?.claims?.email ?? "").trim().toLowerCase();
  if (error || !data?.claims?.sub || email !== ADMIN_EMAIL) {
    throw new Error("admin_forbidden");
  }
  return db;
}


const tokenSchema = z.object({
  accessToken: z.string().min(20).max(4096),
});

const updateSchema = tokenSchema.extend({
  orderId: z.string().uuid(),
  status: z.enum(["pending_review", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
});

async function requireAdmin(accessToken: string) {
  return admin(accessToken);
}

export const getAdminOrders = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => tokenSchema.parse(input))
  .handler(async ({ data }) => {
    const supabaseAdmin = await requireAdmin(data.accessToken);
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_code, customer_name, mobile, city, total_toman, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("getAdminOrders failed", error.message);
      throw new Error("admin_orders_failed");
    }

    return { orders: orders ?? [] };
  });

export const updateAdminOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data }) => {
    const supabaseAdmin = await requireAdmin(data.accessToken);
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId)
      .select("id, status")
      .single();

    if (error || !order) {
      console.error("updateAdminOrderStatus failed", error?.message);
      throw new Error("admin_update_failed");
    }

    return { order };
  });
