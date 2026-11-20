import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const ADMIN_EMAIL = "abbasmoradi554@gmail.com";
const token = z.string().min(20).max(4096);
const localized = z.object({ fa: z.string().trim().min(1).max(180), en: z.string().trim().max(180) }).transform((v) => ({ ...v, en: v.en || v.fa }));
const option = z.object({ type: z.enum(["model", "color", "size", "design"]), values: z.array(localized).min(1).max(100) });
const spec = z.object({ label: localized, value: localized });
const productInput = z.object({
  accessToken: token,
  id: z.string().regex(/^[a-z0-9-]{2,60}$/),
  name: localized,
  price: z.number().int().min(1).max(1_000_000_000),
  oldPrice: z.number().int().min(0).max(1_000_000_000).nullable(),
  category: z.enum(["phone-cases","food-water","toys","collars","hygiene","beds-carriers","gadgets"]),
  subcategory: z.string().max(80).nullable().optional(),
  short: z.object({ fa: z.string().max(300), en: z.string().max(300) }).transform((v) => ({ ...v, en: v.en || v.fa })),
  description: z.object({ fa: z.string().max(5000), en: z.string().max(5000) }).transform((v) => ({ ...v, en: v.en || v.fa })),
  specs: z.array(spec).max(100).default([]),
  options: z.array(option).max(20).default([]),
  tags: z.array(z.enum(["trending","pick","recommended"])).max(10).default([]),
  addedOrder: z.number().int().min(0).max(1_000_000).default(0),
  images: z.array(z.string().url().max(2000)).max(8),
  active: z.boolean(),
});

async function admin(accessToken: string) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("supabase_configuration_missing");
  const db = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  // Verify the JWT through Supabase JWKS when supported; avoid an Auth API round-trip on every product operation.
  const { data, error } = await db.auth.getClaims(accessToken);
  const email = String(data?.claims?.email ?? "").trim().toLowerCase();
  if (error || !data?.claims?.sub || email !== ADMIN_EMAIL) throw new Error("admin_forbidden");
  return db;
}

export const listAdminProducts = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => z.object({ accessToken: token }).parse(v))
  .handler(async ({ data }) => {
    const db = await admin(data.accessToken);
    const { data: rows, error } = await db.from("products").select("*").order("updated_at", { ascending: false });
    if (error) throw new Error("products_load_failed");
    return { products: rows ?? [] };
  });

export const saveAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => productInput.parse(v))
  .handler(async ({ data }) => {
    const db = await admin(data.accessToken);
    const { accessToken, oldPrice, addedOrder, ...rest } = data;
    const { data: row, error } = await db.from("products").upsert({
      ...rest, old_price: oldPrice, added_order: addedOrder, updated_at: new Date().toISOString(),
    }).select("*").single();
    if (error) { console.error("saveAdminProduct", error.message); throw new Error("product_save_failed"); }
    return { product: row };
  });

export const deleteAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => z.object({ accessToken: token, id: z.string().regex(/^[a-z0-9-]{2,60}$/) }).parse(v))
  .handler(async ({ data }) => {
    const db = await admin(data.accessToken);
    const { error } = await db.from("products").delete().eq("id", data.id);
    if (error) throw new Error("product_delete_failed");
    return { success: true };
  });

const imageUploadInput = z.object({
  accessToken: token,
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  base64: z.string().min(4).max(5_600_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
});

export const uploadAdminProductImage = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => imageUploadInput.parse(v))
  .handler(async ({ data }) => {
    const db = await admin(data.accessToken);
    const binary = atob(data.base64);
    if (binary.length === 0 || binary.length > 4 * 1024 * 1024) throw new Error("image_size_invalid");
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const extensionByType: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
    };
    const path = `products/${crypto.randomUUID()}.${extensionByType[data.contentType]}`;
    const { error } = await db.storage.from("product-images").upload(path, bytes, {
      contentType: data.contentType, cacheControl: "31536000", upsert: false,
    });
    if (error) { console.error("uploadAdminProductImage", error.message); throw new Error("product_image_upload_failed"); }
    const { data: publicData } = db.storage.from("product-images").getPublicUrl(path);
    return { url: publicData.publicUrl };
  });
