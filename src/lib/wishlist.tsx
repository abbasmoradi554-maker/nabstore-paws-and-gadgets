import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "nabstore-wishlist";

export function sanitizeWishlist(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string =>
    typeof item === "string" && /^[a-z0-9-]{1,80}$/.test(item),
  ))].slice(0, 200);
}

export function toggleWishlistId(ids: string[], id: string): string[] {
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return ids;
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id].slice(-200);
}

type WishlistValue = {
  ids: string[];
  ready: boolean;
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistValue | null>(null);

function readWishlist(): string[] {
  try {
    return sanitizeWishlist(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(readWishlist());
    setReady(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setIds(readWishlist());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: string[]) => {
    setIds(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Keep the in-memory wishlist usable when browser storage is unavailable.
    }
  }, []);

  const toggle = useCallback((id: string) => commit(toggleWishlistId(ids, id)), [ids, commit]);
  const remove = useCallback((id: string) => commit(ids.filter((item) => item !== id)), [ids, commit]);
  const clear = useCallback(() => commit([]), [commit]);
  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const value = useMemo(() => ({ ids, ready, count: ids.length, has, toggle, remove, clear }),
    [ids, ready, has, toggle, remove, clear]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}
