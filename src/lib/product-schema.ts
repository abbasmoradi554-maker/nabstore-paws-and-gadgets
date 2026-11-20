import { z } from "zod";

import { categories, optionTypes, productTags, type Product } from "@/data/products";
import type { Localized } from "@/lib/i18n";

// Shared by the admin form (browser) and admin server functions.

const text = (max: number) => z.string().trim().max(max);
const localized = (max: number, requireFa = false) =>
  z.object({ fa: requireFa ? text(max).min(1, "faRequired") : text(max), en: text(max).default("") });

export const productInputSchema = z
  .object({
    id: z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9-]{1,79}$/, "idInvalid"),
    name: localized(120, true),
    price: z.number().int("priceInvalid").positive("priceInvalid").max(10_000_000_000, "priceInvalid"),
    oldPrice: z.number().int().positive().max(10_000_000_000).nullable().default(null),
    category: z.enum(categories.map((c) => c.slug) as [string, ...string[]], { errorMap: () => ({ message: "categoryInvalid" }) }),
    subcategory: z.string().trim().max(40).nullable().default(null),
    short: localized(200),
    description: localized(4000),
    images: z.array(z.string().trim().url("imageInvalid").startsWith("https://", "imageInvalid").max(1000)).max(8).default([]),
    specs: z.array(z.object({ label: localized(80, true), value: localized(200, true) })).max(30).default([]),
    options: z
      .array(
        z.object({
          type: z.enum(optionTypes),
          values: z.array(localized(60, true)).min(1, "optionValuesRequired").max(30),
        }),
      )
      .max(4)
      .default([]),
    tags: z.array(z.enum(productTags)).max(3).default([]),
    sortOrder: z.number().int().min(-100000).max(100000).default(0),
    active: z.boolean().default(false),
    inStock: z.boolean().default(true),
  })
  .superRefine((p, ctx) => {
    if (p.oldPrice != null && p.oldPrice <= p.price) {
      ctx.addIssue({ code: "custom", path: ["oldPrice"], message: "oldPriceInvalid" });
    }
    if (p.subcategory) {
      const cat = categories.find((c) => c.slug === p.category);
      if (!cat?.subcategories?.some((s) => s.slug === p.subcategory)) {
        ctx.addIssue({ code: "custom", path: ["subcategory"], message: "subcategoryInvalid" });
      }
    }
    const types = p.options.map((o) => o.type);
    if (new Set(types).size !== types.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "optionDuplicate" });
    }
  });

export type ProductInput = z.input<typeof productInputSchema>;
export type ProductInputParsed = z.output<typeof productInputSchema>;

/** Maps a validated admin input to a database row. */
export function inputToRow(p: ProductInputParsed) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    old_price: p.oldPrice,
    category: p.category,
    subcategory: p.subcategory || null,
    short: p.short,
    description: p.description,
    images: p.images,
    specs: p.specs,
    options: p.options,
    tags: p.tags,
    sort_order: p.sortOrder,
    active: p.active,
    in_stock: p.inStock,
  };
}

export type ProductRow = {
  id: string;
  name: unknown;
  price: number;
  old_price: number | null;
  category: string;
  subcategory: string | null;
  short: unknown;
  description: unknown;
  images: unknown;
  specs: unknown;
  options: unknown;
  tags: string[] | null;
  sort_order: number;
  in_stock: boolean;
  created_at: string;
};

function toLocalized(v: unknown): Localized {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const fa = typeof o["fa"] === "string" ? o["fa"] : "";
    const en = typeof o["en"] === "string" ? o["en"] : "";
    return { fa: fa || en, en: en || fa };
  }
  if (typeof v === "string") return { fa: v, en: v };
  return { fa: "", en: "" };
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Defensive mapping of a database row to the storefront Product shape. Malformed parts are dropped. */
export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: toLocalized(row.name),
    price: Number(row.price),
    oldPrice: row.old_price != null ? Number(row.old_price) : undefined,
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    short: toLocalized(row.short),
    description: toLocalized(row.description),
    images: arr(row.images).filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u)),
    specs: arr(row.specs)
      .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
      .map((s) => ({ label: toLocalized(s["label"]), value: toLocalized(s["value"]) }))
      .filter((s) => s.label.fa && s.value.fa),
    options: arr(row.options)
      .filter((o): o is Record<string, unknown> => !!o && typeof o === "object")
      .filter((o) => (optionTypes as readonly unknown[]).includes(o["type"]))
      .map((o) => ({
        type: o["type"] as Product["options"][number]["type"],
        values: arr(o["values"]).map(toLocalized).filter((v) => v.fa),
      }))
      .filter((o) => o.values.length > 0),
    tags: (row.tags ?? []).filter((t): t is Product["tags"][number] => (productTags as readonly string[]).includes(t)),
    sortOrder: row.sort_order ?? 0,
    inStock: row.in_stock !== false,
    createdAt: row.created_at,
  };
}

/** Converts a stored Product back into the admin form shape. */
export function productToInput(p: Product & { active: boolean }): ProductInputParsed {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    category: p.category,
    subcategory: p.subcategory ?? null,
    short: p.short,
    description: p.description,
    images: p.images,
    specs: p.specs,
    options: p.options,
    tags: p.tags,
    sortOrder: p.sortOrder,
    active: p.active,
    inStock: p.inStock,
  };
}

export const PRODUCT_COLUMNS =
  "id, name, price, old_price, category, subcategory, short, description, images, specs, options, tags, sort_order, in_stock, created_at";
