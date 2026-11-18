import { createServerFn } from "@tanstack/react-start";

import { orderInputSchema } from "./order-schema";
import { priceOrder } from "./order-pricing";
import type { Json } from "@/integrations/supabase/types";

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
    // Reject automated submissions without revealing the honeypot to the client.
    if (data.honeypot?.trim()) throw new Error("save_failed");

    let priced: ReturnType<typeof priceOrder>;
    try {
      priced = priceOrder(data.items);
    } catch {
      throw new Error("invalid_items");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const c = data.customer;

    // The database function takes a per-mobile advisory transaction lock,
    // checks both windows, and inserts the order in the same transaction.
    // This is atomic across Cloudflare Worker instances.
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = makeOrderCode();
      const { error } = await supabaseAdmin.rpc("place_order_with_rate_limit", {
        p_order_code: code,
        p_customer_name: c.name,
        p_mobile: c.mobile,
        p_province: c.province,
        p_city: c.city,
        p_address: c.address,
        p_postal_code: c.postalCode,
        p_notes: c.notes ?? "",
        p_items: priced.lines as unknown as Json,
        p_total_toman: priced.total,
      });

      if (!error) return { code, lines: priced.lines, total: priced.total };
      if (error.message.includes("rate_limited")) throw new Error("rate_limited");
      if (error.code !== "23505") {
        console.error("placeOrder database operation failed", error.message);
        throw new Error("save_failed");
      }
    }
    throw new Error("save_failed");
  });
