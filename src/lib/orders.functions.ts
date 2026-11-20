import { createServerFn } from "@tanstack/react-start";

import { orderInputSchema } from "./order-schema";
import { priceOrder } from "./order-pricing";
import type { Json } from "@/integrations/supabase/types";

function makeOrderCode() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return `NB-${String((buf[0] ?? 0) % 100000000).padStart(8, "0")}`;
}

/**
 * Reprice against the database on the server whenever a product row exists.
 * Static sample data is a temporary fallback until the real catalog is migrated.
 * The browser never supplies a trusted price, and inactive DB products are rejected.
 */
async function priceOrderFromCatalog(items: Parameters<typeof priceOrder>[0]) {
  const base = priceOrder(items);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ids = [...new Set(items.map((item) => item.id))];
  const { data: rows, error } = await (supabaseAdmin as any)
    .from("products")
    .select("id,name,price,active")
    .in("id", ids);

  if (error) {
    console.error("Order catalog lookup failed", error.message);
    throw new Error("catalog_unavailable");
  }

  const byId = new Map<string, any>((rows ?? []).map((row: any) => [row.id, row]));
  const lines = base.lines.map((line) => {
    const row = byId.get(line.id);
    if (!row) return line; // Existing orders continue during the catalog migration.
    if (row.active !== true || !Number.isSafeInteger(row.price) || row.price < 0) {
      throw new Error("invalid_catalog_product");
    }
    const nameFa = typeof row.name?.fa === "string" && row.name.fa.trim()
      ? row.name.fa.trim()
      : line.nameFa;
    return {
      ...line,
      nameFa,
      unitPrice: row.price,
      lineTotal: row.price * line.qty,
    };
  });

  return { lines, total: lines.reduce((sum, line) => sum + line.lineTotal, 0) };
}

// Public endpoint: anyone can place an order. Input is validated with zod;
// every price is recalculated on the server from the database when available.
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderInputSchema.parse(input))
  .handler(async ({ data }) => {
    // Reject automated submissions without revealing the honeypot to the client.
    if (data.honeypot?.trim()) throw new Error("save_failed");

    let priced: Awaited<ReturnType<typeof priceOrderFromCatalog>>;
    try {
      priced = await priceOrderFromCatalog(data.items);
    } catch (error) {
      if (error instanceof Error && error.message === "catalog_unavailable") throw new Error("save_failed");
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
