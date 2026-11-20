import { createServerFn } from "@tanstack/react-start";

import type { Product } from "@/data/products";
import { PRODUCT_COLUMNS, rowToProduct, type ProductRow } from "./product-schema";

export type CatalogResult = { products: Product[]; error: boolean };

// Public read: only active products are visible to visitors (enforced by RLS).
export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<CatalogResult> => {
  try {
    const { createPublicDb } = await import("./public-db.server");
    const { data, error } = await createPublicDb()
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      console.error("getCatalog failed", error.message);
      return { products: [], error: true };
    }
    return { products: (data as ProductRow[]).map(rowToProduct), error: false };
  } catch (e) {
    console.error("getCatalog failed", e instanceof Error ? e.message : e);
    return { products: [], error: true };
  }
});
