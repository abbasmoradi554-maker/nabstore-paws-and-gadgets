import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getProduct } from "@/data/products";
import { normalizeOptions, type CartItemInput } from "./order-pricing";

const STORAGE_KEY = "nabstore-cart";
const MAX_QTY = 20;

export type CartItem = CartItemInput & { key: string };

export function cartKey(id: string, options: Record<string, string>) {
  const opts = Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join("|");
  return `${id}::${opts}`;
}

/** Drops unknown products / options and clamps quantities. */
export function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const { id, qty, options } = r as Record<string, unknown>;
    if (typeof id !== "string") continue;
    const product = getProduct(id);
    if (!product) continue;
    const opts = normalizeOptions(product, (options && typeof options === "object" ? options : {}) as Record<string, string>);
    if (!opts) continue;
    const q = typeof qty === "number" ? Math.max(1, Math.min(MAX_QTY, Math.floor(qty))) : 1;
    out.push({ key: cartKey(id, opts), id, qty: q, options: opts });
  }
  return out;
}

type CartValue = {
  items: CartItem[];
  count: number;
  total: number;
  ready: boolean;
  add: (id: string, options: Record<string, string>, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setItems(sanitizeCart(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")));
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(({ id, qty, options }) => ({ id, qty, options }))));
  }, [items, ready]);

  const add = useCallback((id: string, options: Record<string, string>, qty = 1) => {
    const product = getProduct(id);
    if (!product) return;
    const opts = normalizeOptions(product, options);
    if (!opts) return;
    const key = cartKey(id, opts);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) } : i));
      }
      return [...prev, { key, id, qty: Math.min(MAX_QTY, Math.max(1, qty)), options: opts }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : i)));
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + (getProduct(i.id)?.price ?? 0) * i.qty, 0);
    return { items, count, total, ready, add, setQty, remove, clear };
  }, [items, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const CART_MAX_QTY = MAX_QTY;
