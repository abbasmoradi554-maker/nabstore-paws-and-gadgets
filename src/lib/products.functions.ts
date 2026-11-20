import { createServerFn } from "@tanstack/react-start";

/** Public catalog: expose only active products and explicitly public columns. */
export const listActiveProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any)
    .from("products")
    .select("id,name,price,old_price,category,subcategory,short,description,specs,options,images,tags,added_order,updated_at")
    .eq("active", true)
    .order("added_order", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listActiveProducts failed", error.message);
    throw new Error("products_load_failed");
  }
  return { products: data ?? [] };
});
