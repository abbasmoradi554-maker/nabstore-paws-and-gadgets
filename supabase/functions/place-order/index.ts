import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const provinces = new Set([
  "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام", "بوشهر", "تهران",
  "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی", "خراسان شمالی", "خوزستان", "زنجان", "سمنان",
  "سیستان و بلوچستان", "فارس", "قزوین", "قم", "کردستان", "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد",
  "گلستان", "گیلان", "لرستان", "مازندران", "مرکزی", "هرمزگان", "همدان", "یزد",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

function validString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

function allowedPublishableKeys(): Set<string> {
  const result = new Set<string>();
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const value of Object.values(parsed)) {
        if (typeof value === "string" && value.startsWith("sb_publishable_")) result.add(value);
      }
    } catch {
      // Invalid platform configuration is handled as an unavailable service below.
    }
  }
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) result.add(legacy);
  return result;
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const legacyServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  let serviceKey = legacyServiceKey;
  if (!serviceKey) {
    const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const candidate = parsed.default;
        if (typeof candidate === "string" && candidate.startsWith("sb_secret_")) serviceKey = candidate;
      } catch {
        // Fall through to the explicit configuration error.
      }
    }
  }
  if (!url || !serviceKey) throw new Error("server_configuration_missing");

  const fetchWithSecretKey: typeof fetch = (input, init) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (serviceKey!.startsWith("sb_secret_") && headers.get("Authorization") === `Bearer ${serviceKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", serviceKey!);
    return fetch(input, { ...init, headers });
  };

  return createClient(url, serviceKey, {
    global: { fetch: fetchWithSecretKey },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function makeOrderCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return `NB-${String((bytes[0] ?? 0) % 100000000).padStart(8, "0")}`;
}

type CatalogOption = { type: string; values: Array<{ fa: string; en?: string }> };

function normalizeOptions(options: CatalogOption[], selected: Record<string, string>) {
  const normalized: Record<string, string> = {};
  for (const option of options) {
    if (!option || typeof option.type !== "string" || !Array.isArray(option.values)) {
      throw new Error("invalid_catalog_product");
    }
    const chosen = selected[option.type];
    const match = option.values.find((value) => value && value.fa === chosen);
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

function validateCustomer(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("invalid_customer");
  const customer = value as Record<string, unknown>;
  const name = typeof customer.name === "string" ? customer.name.trim() : "";
  const mobile = typeof customer.mobile === "string" ? latinDigits(customer.mobile).replace(/[\s-]/g, "") : "";
  const province = typeof customer.province === "string" ? customer.province.trim() : "";
  const city = typeof customer.city === "string" ? customer.city.trim() : "";
  const address = typeof customer.address === "string" ? customer.address.trim() : "";
  const postalCode = typeof customer.postalCode === "string" ? latinDigits(customer.postalCode).replace(/[\s-]/g, "") : "";
  const notes = typeof customer.notes === "string" ? customer.notes.trim() : "";

  if (!validString(name, 2, 80) || !/^09\d{9}$/.test(mobile) || !provinces.has(province) ||
      !validString(city, 2, 60) || !validString(address, 10, 400) ||
      !/^\d{10}$/.test(postalCode) || notes.length > 500) {
    throw new Error("invalid_customer");
  }
  return { name, mobile, province, city, address, postalCode, notes };
}

async function createOrder(body: Record<string, unknown>) {
  if (typeof body.honeypot === "string" && body.honeypot.trim()) throw new Error("spam_detected");
  const customer = validateCustomer(body.customer);
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) {
    throw new Error("invalid_items");
  }

  const items = body.items.map((value) => {
    if (!value || typeof value !== "object") throw new Error("invalid_items");
    const item = value as Record<string, unknown>;
    if (typeof item.id !== "string" || !/^[a-z0-9-]{1,60}$/.test(item.id) ||
        !Number.isSafeInteger(item.qty) || Number(item.qty) < 1 || Number(item.qty) > 20 ||
        !item.options || typeof item.options !== "object" || Array.isArray(item.options)) {
      throw new Error("invalid_items");
    }
    const options = item.options as Record<string, unknown>;
    if (Object.values(options).some((entry) => typeof entry !== "string" || entry.length > 60)) {
      throw new Error("invalid_items");
    }
    return { id: item.id, qty: Number(item.qty), options: options as Record<string, string> };
  });

  const db = serviceClient();
  const ids = [...new Set(items.map((item) => item.id))];
  const { data: products, error: catalogError } = await db
    .from("products")
    .select("id, name, price, active, options")
    .in("id", ids)
    .eq("active", true);
  if (catalogError) throw new Error("catalog_unavailable");

  const byId = new Map((products ?? []).map((product) => [product.id, product]));
  const lines = items.map((item) => {
    const product = byId.get(item.id);
    if (!product || product.active !== true) throw new Error("product_not_available");
    const unitPrice = Number(product.price);
    if (!Number.isSafeInteger(unitPrice) || unitPrice < 1 ||
        !product.name || typeof product.name.fa !== "string" || !product.name.fa.trim()) {
      throw new Error("invalid_catalog_product");
    }
    const options = normalizeOptions((product.options ?? []) as CatalogOption[], item.options);
    const lineTotal = unitPrice * item.qty;
    if (!Number.isSafeInteger(lineTotal)) throw new Error("invalid_catalog_product");
    return {
      id: product.id,
      nameFa: product.name.fa.trim(),
      qty: item.qty,
      options,
      unitPrice,
      lineTotal,
    };
  });
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error("invalid_items");

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = makeOrderCode();
    const { error } = await db.rpc("place_order_with_rate_limit", {
      p_order_code: code,
      p_customer_name: customer.name,
      p_mobile: customer.mobile,
      p_province: customer.province,
      p_city: customer.city,
      p_address: customer.address,
      p_postal_code: customer.postalCode,
      p_notes: customer.notes,
      p_items: lines,
      p_total_toman: total,
    });
    if (!error) return { code, lines, total };
    if (error.message?.includes("rate_limited")) throw new Error("rate_limited");
    if (error.code !== "23505") {
      console.error("place-order RPC failed", error.message);
      throw new Error("save_failed");
    }
  }
  throw new Error("save_failed");
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = request.headers.get("apikey") ?? "";
  const allowedKeys = allowedPublishableKeys();
  if (allowedKeys.size === 0) return json({ error: "service_unavailable" }, 503);
  if (!allowedKeys.has(apiKey)) return json({ error: "unauthorized" }, 401);

  try {
    const length = Number(request.headers.get("content-length") ?? "0");
    if (length > 64 * 1024) return json({ error: "request_too_large" }, 413);
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_request" }, 400);
    const result = await createOrder(body as Record<string, unknown>);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "save_failed";
    if (message === "rate_limited") return json({ error: "rate_limited" }, 429);
    if (message === "product_not_available") return json({ error: "product_not_available" }, 409);
    if (["invalid_customer", "invalid_items", "invalid_option", "invalid_catalog_product", "spam_detected"].includes(message)) {
      return json({ error: message === "spam_detected" ? "invalid_request" : message }, 400);
    }
    if (message === "server_configuration_missing") {
      console.error("place-order server configuration is incomplete");
      return json({ error: "service_unavailable" }, 503);
    }
    console.error("place-order failed", message);
    return json({ error: "save_failed" }, 500);
  }
});
