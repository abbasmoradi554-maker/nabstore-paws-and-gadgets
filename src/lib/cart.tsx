import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Product } from "@/data/products";
import { catalogQueryOptions } from "./catalog-query";
import { MAX_QTY, normalizeOptions, resolveCart, type CartItemInput } from "./order-pricing";

const STORAGE_KEY = "nabstore-cart";

export type CartItem = CartItemInput & { key: string };
export type CartLine = ReturnType<typeof resolveCart>["lines"][number] & { key: string };

export function cartKey(id: string, options: Record<string, string>) {
  const opts = Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join("|");
  return `${id}::${opts}`;
}

/** Keeps only well-formed entries from storage; product checks happen against the live catalog. */
export function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const { id, qty, options } = r as Record<string, unknown>;
    if (typeof id !== "string" || id.length > 80) continue;
    const opts: Record<string, string> = {};
    if (options && typeof options === "object") {
      for (const [k, v] of Object.entries(options as Record<string, unknown>)) if (typeof v === "string") opts[k] = v;
    }
    const q = typeof qty === "number" ? Math.max(1, Math.min(MAX_QTY, Math.floor(qty))) : 1;
    out.push({ key: cartKey(id, opts), id, qty: q, options: opts });
  }
  return out.slice(0, 30);
}

type CartValue = {
  items: CartItem[];
  /** Items resolved against the live catalog (missing, inactive or out-of-stock items are left out). */
  lines: CartLine[];
  count: number;
  total: number;
  /** True once the saved cart and the live catalog have both loaded. */
  ready: boolean;
  catalogError: boolean;
  add: (product: Product, options: Record<string, string>, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const catalog = useQuery(catalogQueryOptions);

  useEffect(() => {
    try {
      setItems(sanitizeCart(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")));
    } catch {
      setItems([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(({ id, qty, options }) => ({ id, qty, options }))));
  }, [items, loaded]);

  // Drop items whose product was removed, hidden or sold out since they were added.
  const products = catalog.data && !catalog.data.error ? catalog.data.products : undefined;
  useEffect(() => {
    if (!loaded || !products) return;
    const keep = new Set(resolveCart(products, items).lines.map((l) => cartKey(l.id, l.options)));
    if (items.some((i) => !keep.has(cartKey(i.id, normalizedOrRaw(products, i))))) {
      setItems((prev) => prev.filter((i) => keep.has(cartKey(i.id, normalizedOrRaw(products, i)))));
    }
  }, [loaded, products, items]);

  const add = useCallback((product: Product, options: Record<string, string>, qty = 1) => {
    if (!product.inStock) return;
    const opts = normalizeOptions(product, options);
    if (!opts) return;
    const key = cartKey(product.id, opts);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) } : i));
      }
      return [...prev, { key, id: product.id, qty: Math.min(MAX_QTY, Math.max(1, qty)), options: opts }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : i)));
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(() => {
    const resolved = products ? resolveCart(products, items) : { lines: [], total: 0 };
    const lines: CartLine[] = resolved.lines.map((l) => ({ ...l, key: cartKey(l.id, l.options) }));
    const count = items.reduce((s, i) => s + i.qty, 0);
    return {
      items,
      lines,
      count,
      total: resolved.total,
      ready: loaded && (!!products || !!catalog.data?.error || catalog.isError),
      catalogError: !!catalog.data?.error || catalog.isError,
      add,
      setQty,
      remove,
      clear,
    };
  }, [items, products, loaded, catalog.data, catalog.isError, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function normalizedOrRaw(products: Product[], item: CartItem) {
  const p = products.find((x) => x.id === item.id);
  return (p && normalizeOptions(p, item.options)) || item.options;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const CART_MAX_QTY = MAX_QTY;
