import { createServerFn } from "@tanstack/react-start";

/**
 * Public storefront catalog reader.
 *
 * Only explicitly public product fields are selected, and inactive products
 * are never returned. The service-role client stays inside this server handler.
 *
 * This first version intentionally targets the columns already present in the
 * manually-created products table. Optional catalog fields (subcategory,
 * specs, options and tags) are added only after the matching migration is
 * applied, so this endpoint remains compatible with the current database.
 */
export const listActiveProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any)
    .from("products")
    .select("id,name,price,old_price,category,short,description,images,active,updated_at")
    .eq("active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listActiveProducts failed", error.message);
    throw new Error("products_load_failed");
  }

  return { products: data ?? [] };
});
