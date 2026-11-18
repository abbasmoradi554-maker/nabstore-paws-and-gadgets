import { createServerFn } from "@tanstack/react-start";

import { orderInputSchema } from "./order-schema";
import { priceOrder } from "./order-pricing";

function makeOrderCode() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return `NB-${String((buf[0] ?? 0) % 100000000).padStart(8, "0")}`;
}

// Public endpoint: anyone can place an order. Input is validated with zod and
// prices are recalculated from the catalog on the server.
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderInputSchema.parse(input))
  .handler(async ({ data }) => {
    let priced: ReturnType<typeof priceOrder>;
    try {
      priced = priceOrder(data.items);
    } catch {
      throw new Error("invalid_items");
    }
    // Reject automated submissions without revealing the honeypot to the client.
    if (data.honeypot?.trim()) throw new Error("save_failed");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const c = data.customer;

    // Database-backed limits work across Cloudflare Worker instances.
    // Fail closed if the database cannot verify the counts.
    const now = Date.now();
    const [lastHour, lastDay] = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true })
        .eq("mobile", c.mobile).gte("created_at", new Date(now - 60 * 60 * 1000).toISOString()),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true })
        .eq("mobile", c.mobile).gte("created_at", new Date(now - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    if (lastHour.error || lastDay.error) {
      console.error("placeOrder rate-limit lookup failed", lastHour.error?.message, lastDay.error?.message);
      throw new Error("save_failed");
    }
    if ((lastHour.count ?? 0) >= 3 || (lastDay.count ?? 0) >= 10) {
      throw new Error("rate_limited");
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const code = makeOrderCode();
      const { error } = await supabaseAdmin.from("orders").insert({
        order_code: code,
        customer_name: c.name,
        mobile: c.mobile,
        province: c.province,
        city: c.city,
        address: c.address,
        postal_code: c.postalCode,
        notes: c.notes ?? "",
        items: priced.lines,
        total_toman: priced.total,
      });
      if (!error) return { code, lines: priced.lines, total: priced.total };
      if (error.code !== "23505") {
        console.error("placeOrder insert failed", error.message);
        throw new Error("save_failed");
      }
    }
    throw new Error("save_failed");
  });
