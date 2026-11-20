import { createServerFn } from "@tanstack/react-start";

import { orderInputSchema } from "./order-schema";
import type { Json } from "@/integrations/supabase/types";

function makeOrderCode() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return `NB-${String((buf[0] ?? 0) % 100000000).padStart(8, "0")}`;
}

type Localized = { fa: string; en: string };
type CatalogOption = { type: string; values: Localized[] };

function normalizeCatalogOptions(options: CatalogOption[], selected: Record<string, string>) {
  const normalized: Record<string, string> = {};
  for (const option of options) {
    if (!option || typeof option.type !== "string" || !Array.isArray(option.values)) {
      throw new Error("invalid_catalog_product");
    }
    const chosen = selected[option.type];
    const match = option.values.find((v) => v && typeof v.fa === "string" && v.fa === chosen);
    if (chosen && !match) throw new Error("invalid_option");
    const fallback = option.values[0];
    if (!match && !fallback?.fa) throw new Error("invalid_catalog_product");
    normalized[option.type] = match?.fa ?? fallback.fa;
  }
  if (Object.keys(selected).some((key) => !options.some((option) => option.type === key))) {
    throw new Error("invalid_option");
  }
  return normalized;
}

/** All product identity, option validation and pricing come exclusively from active DB rows. */
async function priceOrderFromCatalog(items: Array<{ id: string; qty: number; options: Record<string, string> }>) {
  if (!items.length || items.length > 30) throw new Error("invalid_items");
  const ids = [...new Set(items.map((item) => item.id))];
  if (ids.length !== items.length && items.length > 1) {
    // Duplicate product lines are allowed; IDs are deduplicated for the lookup.
  }
  if (ids.some((id) => typeof id !== "string" || !/^[a-z0-9-]{2,80}$/.test(id))) throw new Error("invalid_items");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows, error } = await (supabaseAdmin as any)
    .from("products")
    .select("id,name,price,active,options")
    .in("id", ids);

  if (error) {
    console.error("Order catalog lookup failed", error.message);
    throw new Error("catalog_unavailable");
  }

  const byId = new Map<string, any>((rows ?? []).map((row: any) => [row.id, row]));
  const lines = items.map((item) => {
    const row = byId.get(item.id);
    if (!row || row.active !== true) throw new Error("product_not_available");
    if (!Number.isSafeInteger(row.price) || row.price < 0) throw new Error("invalid_catalog_product");
    const qty = Number.isSafeInteger(item.qty) ? Math.max(1, Math.min(20, item.qty)) : 0;
    if (!qty) throw new Error("invalid_items");
    const options = normalizeCatalogOptions((row.options ?? []) as CatalogOption[], item.options ?? {});
    const nameFa = typeof row.name?.fa === "string" && row.name.fa.trim() ? row.name.fa.trim() : "";
    if (!nameFa) throw new Error("invalid_catalog_product");
    const lineTotal = row.price * qty;
    if (!Number.isSafeInteger(lineTotal)) throw new Error("invalid_catalog_product");
    return { id: row.id, nameFa, qty, options, unitPrice: row.price, lineTotal };
  });
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error("invalid_items");
  return { lines, total };
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderInputSchema.parse(input))
  .handler(async ({ data }) => {
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
