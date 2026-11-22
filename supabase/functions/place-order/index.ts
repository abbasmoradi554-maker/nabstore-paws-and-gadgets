import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://feature-store-admin-cms-nabstore-paws-and-gadgets.abbasmoradi554.workers.dev",
  "https://nabstore-paws-and-gadgets.nabstore.workers.dev",
]);
function corsHeadersFor(request: Request) {
  const origin = request.headers.get("Origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

const provinces = new Set([
  "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام", "بوشهر", "تهران",
  "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی", "خراسان شمالی", "خوزستان", "زنجان", "سمنان",
  "سیستان و بلوچستان", "فارس", "قزوین", "قم", "کردستان", "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد",
  "گلستان", "گیلان", "لرستان", "مازندران", "مرکزی", "هرمزگان", "همدان", "یزد",
]);

function json(body: unknown, request: Request, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeadersFor(request) });
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

async function createOrder(body: Record<string, unknown>, userId: string | null) {
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
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (!Number.isSafeInteger(subtotal) || subtotal <= 0) throw new Error("invalid_items");

  const { data: shippingRow, error: shippingError } = await db
    .from("store_content").select("value").eq("key", "shipping").maybeSingle();
  if (shippingError || !shippingRow?.value || typeof shippingRow.value !== "object") {
    throw new Error("shipping_configuration_missing");
  }
  const shippingConfig = shippingRow.value as Record<string, unknown>;
  const flatFee = Number(shippingConfig.flatFeeToman);
  const freeAbove = Number(shippingConfig.freeAboveToman);
  const shippingEnabled = shippingConfig.enabled !== false;
  if (!Number.isSafeInteger(flatFee) || flatFee < 0 || !Number.isSafeInteger(freeAbove) || freeAbove < 0) {
    throw new Error("shipping_configuration_missing");
  }
  const shippingToman = !shippingEnabled || (freeAbove > 0 && subtotal >= freeAbove) ? 0 : flatFee;
  const total = subtotal + shippingToman;
  if (!Number.isSafeInteger(total)) throw new Error("invalid_items");

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
      p_shipping_toman: shippingToman,
      p_user_id: userId,
    });
    if (!error) return { code, lines, subtotal, shippingToman, total };
    if (error.message?.includes("rate_limited")) throw new Error("rate_limited");
    if (error.message?.includes("invalid_order_total")) throw new Error("invalid_items");
    if (error.message?.includes("insufficient_stock")) throw new Error("insufficient_stock");
    if (error.message?.includes("product_not_available")) throw new Error("product_not_available");
    if (error.code !== "23505") {
      console.error("place-order RPC failed", error.message);
      throw new Error("save_failed");
    }
  }
  throw new Error("save_failed");
}

Deno.serve(async (request: Request) => {
  const headers = corsHeadersFor(request);
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("Origin") ?? "";
    if (origin && !allowedOrigins.has(origin)) return new Response(null, { status: 403, headers });
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, request, 405);

  const apiKey = request.headers.get("apikey") ?? "";
  const allowedKeys = allowedPublishableKeys();
  if (allowedKeys.size === 0) return json({ error: "service_unavailable" }, request, 503);
  if (!allowedKeys.has(apiKey)) return json({ error: "unauthorized" }, request, 401);

  const authorization = request.headers.get("Authorization") ?? "";
  let userId: string | null = null;
  if (authorization) {
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) return json({ error: "unauthorized" }, request, 401);
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, apiKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await authClient.auth.getUser(match[1]);
    if (error || !data.user) return json({ error: "unauthorized" }, request, 401);
    userId = data.user.id;
  }

  try {
    const length = Number(request.headers.get("content-length") ?? "0");
    if (length > 64 * 1024) return json({ error: "request_too_large" }, request, 413);
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_request" }, request, 400);
    const result = await createOrder(body as Record<string, unknown>, userId);
    return json(result, request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "save_failed";
    if (message === "rate_limited") return json({ error: "rate_limited" }, request, 429);
    if (message === "product_not_available") return json({ error: "product_not_available" }, request, 409);
    if (message === "insufficient_stock") return json({ error: "insufficient_stock" }, request, 409);
    if (["invalid_customer", "invalid_items", "invalid_option", "invalid_catalog_product", "spam_detected"].includes(message)) {
      return json({ error: message === "spam_detected" ? "invalid_request" : message }, request, 400);
    }
    if (message === "server_configuration_missing" || message === "shipping_configuration_missing") {
      console.error("place-order server configuration is incomplete");
      return json({ error: "service_unavailable" }, request, 503);
    }
    console.error("place-order failed", message);
    return json({ error: "save_failed" }, request, 500);
  }
});
