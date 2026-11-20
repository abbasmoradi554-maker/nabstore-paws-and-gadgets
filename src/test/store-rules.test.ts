import { describe, expect, it } from "vitest";

import { categories, filterProducts, type Product } from "@/data/products";
import { customerSchema } from "@/lib/order-schema";
import { resolveCart } from "@/lib/order-pricing";
import { productInputSchema } from "@/lib/product-schema";
import { jalaliYear } from "@/lib/i18n";

const validCustomer = {
  name: "علی رضایی",
  mobile: "09121234567",
  province: "تهران",
  city: "تهران",
  address: "خیابان آزادی، کوچه اول، پلاک ۱۲",
  postalCode: "1234567890",
  notes: "",
};

describe("catalog rules", () => {
  it("lists exactly the seven requested categories with phone cases first", () => {
    expect(categories.map((c) => c.name.fa)).toEqual([
      "قاب گوشی و لوازم جانبی",
      "غذا و آبخوری",
      "اسباب‌بازی",
      "قلاده و اکسسوری",
      "بهداشت و نظافت",
      "تخت و حمل",
      "گجت‌های ترند",
    ]);
  });

  it("phone cases have the five requested subcategories", () => {
    expect(categories[0]?.subcategories?.map((s) => s.name.fa)).toEqual([
      "قاب سیلیکونی",
      "قاب شفاف",
      "قاب طرح‌دار",
      "گلس و محافظ لنز",
      "پاپ‌سوکت و هولدر",
    ]);
  });

});

const product = (over: Partial<Product>): Product => ({
  id: "real-case", name: { fa: "قاب", en: "Case" }, price: 290_000, category: "phone-cases",
  short: { fa: "", en: "" }, description: { fa: "", en: "" }, specs: [],
  options: [{ type: "model", values: [{ fa: "iPhone 13", en: "iPhone 13" }] }],
  images: [], tags: [], sortOrder: 0, inStock: true, createdAt: "2026-01-01T00:00:00Z", ...over,
});
const catalog = [product({}), product({ id: "sold-out", inStock: false })];

describe("checkout rules", () => {
  it("accepts a mobile in 09xxxxxxxxx form, including Persian digits", () => {
    expect(customerSchema.safeParse(validCustomer).success).toBe(true);
    const r = customerSchema.safeParse({ ...validCustomer, mobile: "۰۹۱۲۱۲۳۴۵۶۷" });
    expect(r.success && r.data.mobile).toBe("09121234567");
  });

  it("rejects mobiles that are not 11 digits starting with 09", () => {
    for (const mobile of ["9121234567", "0912123456", "08121234567", "091212345678"]) {
      expect(customerSchema.safeParse({ ...validCustomer, mobile }).success).toBe(false);
    }
  });

  it("requires a 10-digit postal code", () => {
    expect(customerSchema.safeParse({ ...validCustomer, postalCode: "123456789" }).success).toBe(false);
    expect(customerSchema.safeParse({ ...validCustomer, postalCode: "۱۲۳۴۵۶۷۸۹۰" }).success).toBe(true);
  });

  it("prices the cart from the live catalog and skips out-of-stock or missing items", () => {
    const { total, lines } = resolveCart(catalog, [
      { id: "real-case", qty: 2, options: {} },
      { id: "sold-out", qty: 1, options: {} },
      { id: "nope", qty: 1, options: {} },
    ]);
    expect(lines.map((l) => l.id)).toEqual(["real-case"]);
    expect(total).toBe(580_000);
  });

  it("drops cart items with an unknown option value", () => {
    expect(resolveCart(catalog, [{ id: "real-case", qty: 1, options: { model: "Nokia 3310" } }]).lines).toEqual([]);
  });
});

describe("admin product rules", () => {
  const base = { id: "case-a", name: { fa: "قاب", en: "Case" }, price: 100_000, category: "phone-cases" };
  it("rejects an old price that is not higher than the price", () => {
    expect(productInputSchema.safeParse({ ...base, oldPrice: 100_000 }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, oldPrice: 120_000 }).success).toBe(true);
  });
  it("rejects a subcategory that does not belong to the category", () => {
    expect(productInputSchema.safeParse({ ...base, category: "toys", subcategory: "silicone" }).success).toBe(false);
  });
  it("only accepts https image links", () => {
    expect(productInputSchema.safeParse({ ...base, images: ["http://x.com/a.jpg"] }).success).toBe(false);
  });
  it("filters search results from the provided catalog only", () => {
    expect(filterProducts([], { q: "case" })).toEqual([]);
  });
});

describe("footer year", () => {
  it("shows the Jalali year in Persian digits without a thousands separator", () => {
    expect(jalaliYear("fa", new Date("2026-11-15T00:00:00Z"))).toBe("۱۴۰۵");
  });
});
