import { createServerFn } from "@tanstack/react-start";
import { orderInputSchema } from "./order-schema";

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderInputSchema.parse(input))
  .handler(async ({ data }) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !publishableKey) {
      console.error("[placeOrder] Supabase public configuration is missing at build time");
      throw new Error("save_failed");
    }

    // Keep all privileged database work inside Supabase Edge Functions.
    // Only the publishable key crosses this Cloudflare Worker boundary.
    const response = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/functions/v1/place-order`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json().catch(() => null) as
      | { code: string; lines: Array<{ id: string; nameFa: string; qty: number; options: Record<string, string>; unitPrice: number; lineTotal: number }>; subtotal: number; shippingToman: number; total: number; error?: string }
      | null;

    if (!response.ok || !result || !result.code || !Array.isArray(result.lines) || typeof result.total !== "number" || typeof result.shippingToman !== "number") {
      const reason = result?.error;
      if (reason === "rate_limited") throw new Error("rate_limited");
      if (reason === "product_not_available") throw new Error("invalid_items");
      if (reason === "insufficient_stock") throw new Error("insufficient_stock");
      console.error("[placeOrder] Edge Function rejected order", response.status, reason ?? "unknown");
      throw new Error("save_failed");
    }

    return result;
  });
