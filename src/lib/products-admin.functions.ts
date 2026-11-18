import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const token = z.string().min(20).max(4096);
const localized = z.object({ fa: z.string().trim().min(1).max(180), en: z.string().trim().min(1).max(180) });
const productInput = z.object({
  accessToken: token,
  id: z.string().regex(/^[a-z0-9-]{2,80}$/),
  name: localized,
  price: z.number().int().min(0).max(1_000_000_000),
  oldPrice: z.number().int().min(0).max(1_000_000_000).nullable(),
  category: z.enum(["phone-cases","food-water","toys","collars","hygiene","beds-carriers","gadgets"]),
  short: z.object({ fa: z.string().max(300), en: z.string().max(300) }),
  description: z.object({ fa: z.string().max(5000), en: z.string().max(5000) }),
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
    const { accessToken, oldPrice, ...rest } = data;
    const { data: row, error } = await (db as any).from("products").upsert({
      ...rest, old_price: oldPrice, updated_at: new Date().toISOString(),
    }).select("*").single();
    if (error) { console.error("saveAdminProduct", error.message); throw new Error("product_save_failed"); }
    return { product: row };
  });
export const deleteAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => z.object({ accessToken: token, id: z.string().regex(/^[a-z0-9-]{2,80}$/) }).parse(v))
  .handler(async ({ data }) => {
    const db = await admin(data.accessToken);
    const { error } = await (db as any).from("products").delete().eq("id", data.id);
    if (error) throw new Error("product_delete_failed");
    return { success: true };
  });
