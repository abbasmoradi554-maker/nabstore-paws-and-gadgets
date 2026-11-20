import { getProduct, type Product } from "@/data/products";

export type CartItemInput = { id: string; qty: number; options: Record<string, string> };
export type PricedLine = {
  id: string;
  nameFa: string;
  qty: number;
  options: Record<string, string>;
  unitPrice: number;
  lineTotal: number;
};

export const MAX_QTY = 20;

/** Options left unset fall back to each option's first value. Unknown values are rejected. */
export function normalizeOptions(product: Product, options: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const opt of product.options) {
    const chosen = options[opt.type];
    const valid = opt.values.find((v) => v.fa === chosen);
    if (chosen && !valid) return null;
    const pick = valid ?? opt.values[0];
    if (pick) out[opt.type] = pick.fa;
  }
  return out;
}

/**
 * Display-only pricing for the cart: prices come from the live catalog, never from stored cart data.
 * The database re-prices and validates again when the order is placed.
 */
export function resolveCart(catalog: Product[], items: CartItemInput[]) {
  const lines: (PricedLine & { product: Product })[] = [];
  for (const item of items) {
    const product = getProduct(catalog, item.id);
    if (!product || !product.inStock) continue;
    const options = normalizeOptions(product, item.options);
    if (!options) continue;
    const qty = Math.max(1, Math.min(MAX_QTY, Math.floor(item.qty)));
    lines.push({
      product,
      id: product.id,
      nameFa: product.name.fa,
      qty,
      options,
      unitPrice: product.price,
      lineTotal: product.price * qty,
    });
  }
  return { lines, total: lines.reduce((s, l) => s + l.lineTotal, 0) };
}
