import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Public catalog reader.
 * Uses only the publishable key; RLS limits this query to active products.
 * Admin/service-role credentials are intentionally not required for storefront reads.
 */
export const listActiveProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
  const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

  if (!supabaseUrl || !publishableKey) {
    console.error("[catalog] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY at build time");
    throw new Error("products_configuration_missing");
  }

  const supabase = createClient<Database>(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase
    .from("products")
    .select("id,name,price,old_price,stock_quantity,category,subcategory,short,description,specs,options,images,tags,added_order,updated_at")
    .eq("active", true)
    .order("added_order", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listActiveProducts failed", error.message);
    throw new Error("products_load_failed");
  }

  return { products: data ?? [] };
});
