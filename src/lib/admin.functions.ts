import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.object({
  accessToken: z.string().min(20).max(4096),
});

const updateSchema = tokenSchema.extend({
  orderId: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
});

async function requireAdmin(accessToken: string) {
  const allowedEmail = process.env["ADMIN_EMAIL"]?.trim().toLowerCase();
  if (!allowedEmail) throw new Error("admin_not_configured");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user?.email || data.user.email.trim().toLowerCase() !== allowedEmail) {
    throw new Error("admin_forbidden");
  }

  return supabaseAdmin;
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
