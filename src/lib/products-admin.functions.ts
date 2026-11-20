import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  const allowed = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!allowed) throw new Error("admin_not_configured");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || data.user?.email?.trim().toLowerCase() !== allowed) throw new Error("admin_forbidden");
  return supabaseAdmin;
}
export const listAdminProducts = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => z.object({ accessToken: token }).parse(v))
  .handler(async ({ data }) => {
    const db = await admin(data.accessToken);
    const { data: rows, error } = await (db as any).from("products").select("*").order("updated_at", { ascending: false });
    if (error) throw new Error("products_load_failed");
    return { products: rows ?? [] };
  });
export const saveAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => productInput.parse(v))
  .handler(async ({ data }) => {
    const db = await admin(data.accessToken);
    const { accessToken, oldPrice, addedOrder, ...rest } = data;
    const { data: row, error } = await (db as any).from("products").upsert({
      ...rest, old_price: oldPrice, added_order: addedOrder, updated_at: new Date().toISOString(),
    }).select("*").single();
    if (error) { console.error("saveAdminProduct", error.message); throw new Error("product_save_failed"); }
    return { product: row };
  });
export const deleteAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => z.object({ accessToken: token, id: z.string().regex(/^[a-z0-9-]{2,60}$/) }).parse(v))
  .handler(async ({ data }) => {
    const db = await admin(data.accessToken);
    const { error } = await (db as any).from("products").delete().eq("id", data.id);
    if (error) throw new Error("product_delete_failed");
    return { success: true };
  });
