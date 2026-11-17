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

/** Options left unset fall back to each option's first value. Unknown values are rejected. */
export function normalizeOptions(product: Product, options: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const opt of product.options) {
    const chosen = options[opt.type];
    const valid = opt.values.find((v) => v.fa === chosen);
    if (chosen && !valid) return null;
    const fallback = opt.values[0];
    if (!valid && !fallback) return null;
    out[opt.type] = valid ? valid.fa : fallback!.fa;
  }
  return out;
}

/** Prices an order from the catalog only; client-sent prices are never trusted. */
export function priceOrder(items: CartItemInput[]) {
  const lines: PricedLine[] = [];
  for (const item of items) {
    const product = getProduct(item.id);
    if (!product) throw new Error(`unknown_product:${item.id}`);
    const options = normalizeOptions(product, item.options);
    if (!options) throw new Error(`invalid_option:${item.id}`);
    const qty = Math.max(1, Math.min(20, Math.floor(item.qty)));
    lines.push({
      id: product.id,
      nameFa: product.name.fa,
      qty,
      options,
      unitPrice: product.price,
      lineTotal: product.price * qty,
    });
  }
  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  return { lines, total };
}
