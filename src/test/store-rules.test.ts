import { describe, expect, it } from "vitest";

import { categories, products } from "@/data/products";
import { customerSchema } from "@/lib/order-schema";
import { priceOrder } from "@/lib/order-pricing";
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

  it("has at least 3 products in every category", () => {
    for (const c of categories) {
      expect(products.filter((p) => p.category === c.slug).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("prices every product under 3,000,000 Toman", () => {
    for (const p of products) expect(p.price).toBeLessThan(3_000_000);
  });

  it("keeps prices inside each category's range", () => {
    const ranges: Record<string, [number, number]> = {
      case: [150_000, 650_000],
      phoneAccessory: [100_000, 900_000],
      "food-water": [200_000, 1_500_000],
      toys: [80_000, 600_000],
      collars: [120_000, 700_000],
      hygiene: [90_000, 800_000],
      "beds-carriers": [400_000, 2_000_000],
      gadgets: [150_000, 1_800_000],
    };
    for (const p of products) {
      const key =
        p.category === "phone-cases"
          ? ["silicone", "clear", "printed"].includes(p.subcategory ?? "")
            ? "case"
            : "phoneAccessory"
          : p.category;
      const [min, max] = ranges[key] ?? [0, 0];
      expect(p.price, p.id).toBeGreaterThanOrEqual(min);
      expect(p.price, p.id).toBeLessThanOrEqual(max);
    }
  });
});

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

  it("prices orders from the catalog, not from the client", () => {
    const { total, lines } = priceOrder([{ id: "silicone-case", qty: 2, options: {} }]);
    expect(lines[0]?.unitPrice).toBe(290_000);
    expect(total).toBe(580_000);
  });

  it("rejects unknown products and invalid options", () => {
    expect(() => priceOrder([{ id: "nope", qty: 1, options: {} }])).toThrow();
    expect(() => priceOrder([{ id: "silicone-case", qty: 1, options: { model: "Nokia 3310" } }])).toThrow();
  });
});

describe("footer year", () => {
  it("shows the Jalali year in Persian digits without a thousands separator", () => {
    expect(jalaliYear("fa", new Date("2026-11-15T00:00:00Z"))).toBe("۱۴۰۵");
  });
});
