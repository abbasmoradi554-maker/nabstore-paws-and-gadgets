import { createServerFn } from "@tanstack/react-start";

import { orderInputSchema } from "./order-schema";
import type { PricedLine } from "./order-pricing";

export type PlaceOrderResult =
  | { ok: true; code: string; lines: PricedLine[]; total: number }
  | { ok: false; error: "unavailable" | "invalid" | "failed" };

// Public endpoint. The database function `place_order` re-validates the customer,
// re-prices every item from current active, in-stock products and saves the order.
// Client-sent prices are never used; no service-role key is needed.
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderInputSchema.parse(input))
  .handler(async ({ data }): Promise<PlaceOrderResult> => {
    try {
      const { createPublicDb } = await import("./public-db.server");
      const { data: res, error } = await createPublicDb().rpc("place_order", {
        _customer: data.customer,
        _items: data.items,
      });
      if (error) {
        const msg = error.message ?? "";
        if (msg.includes("unavailable_product") || msg.includes("invalid_option")) return { ok: false, error: "unavailable" };
        if (msg.includes("invalid_customer") || msg.includes("invalid_items")) return { ok: false, error: "invalid" };
        console.error("placeOrder failed", msg);
        return { ok: false, error: "failed" };
      }
      const r = res as { code: string; lines: PricedLine[]; total: number };
      return { ok: true, code: r.code, lines: r.lines, total: Number(r.total) };
    } catch (e) {
      console.error("placeOrder failed", e instanceof Error ? e.message : e);
      return { ok: false, error: "failed" };
    }
  });
