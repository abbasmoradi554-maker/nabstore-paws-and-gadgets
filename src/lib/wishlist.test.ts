import { describe, expect, it } from "vitest";
import { sanitizeWishlist, toggleWishlistId } from "./wishlist";

describe("wishlist state", () => {
  it("keeps unique valid product ids only", () => {
    expect(sanitizeWishlist(["cat-toy", "cat-toy", "../bad", 12, "phone-case"])).toEqual(["cat-toy", "phone-case"]);
  });

  it("adds and removes a product id", () => {
    expect(toggleWishlistId(["cat-toy"], "phone-case")).toEqual(["cat-toy", "phone-case"]);
    expect(toggleWishlistId(["cat-toy", "phone-case"], "cat-toy")).toEqual(["phone-case"]);
  });

  it("does not add invalid ids", () => {
    const current = ["cat-toy"];
    expect(toggleWishlistId(current, "../admin")).toBe(current);
  });

  it("limits the stored list to 200 products", () => {
    const ids = Array.from({ length: 205 }, (_, index) => `product-${index}`);
    expect(sanitizeWishlist(ids)).toHaveLength(200);
    expect(toggleWishlistId(ids, "last-product")).toHaveLength(200);
  });
});
