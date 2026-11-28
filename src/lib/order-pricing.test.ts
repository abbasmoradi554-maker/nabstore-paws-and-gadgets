import { describe, expect, it } from "vitest";
import { getProduct } from "@/data/products";
import { normalizeOptions, priceOrder } from "./order-pricing";

describe("order pricing and options", () => {
  it("uses the catalog price and calculates line totals", () => {
    const result = priceOrder([{ id: "knit-sweater", qty: 2, options: { size: "M", color: "کرم" } }]);
    expect(result.total).toBe(1_040_000);
    expect(result.lines[0]?.lineTotal).toBe(1_040_000);
    expect(result.lines[0]?.options).toEqual({ size: "M", color: "کرم" });
  });

  it("defaults omitted options to the first catalog values", () => {
    const product = getProduct("knit-sweater");
    expect(product).toBeDefined();
    expect(normalizeOptions(product!, {})).toEqual({ size: "S", color: "کرم" });
  });

  it("rejects options that are not in the catalog", () => {
    const product = getProduct("knit-sweater");
    expect(normalizeOptions(product!, { size: "XXL" })).toBeNull();
  });

  it("rejects unknown products", () => {
    expect(() => priceOrder([{ id: "not-a-real-product", qty: 1, options: {} }])).toThrow("unknown_product");
  });
});
