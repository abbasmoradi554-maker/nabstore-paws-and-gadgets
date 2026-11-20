import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const ADMIN_EMAIL = "abbasmoradi554@gmail.com";

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
    if (binary.length === 0 || binary.length > 4 * 1024 * 1024) {
      throw new Error("image_size_invalid");
    }
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const extensionByType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
    };
    const path = `products/${crypto.randomUUID()}.${extensionByType[data.contentType]}`;
    const { error } = await db.storage.from("product-images").upload(path, bytes, {
      contentType: data.contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) {
      console.error("uploadAdminProductImage", error.message);
      throw new Error("product_image_upload_failed");
    }
    const { data: publicData } = db.storage.from("product-images").getPublicUrl(path);
    return { url: publicData.publicUrl };
  });
