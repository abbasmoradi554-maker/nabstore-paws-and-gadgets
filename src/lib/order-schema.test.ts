import { describe, expect, it } from "vitest";
import { customerSchema, orderInputSchema } from "./order-schema";

const validCustomer = {
  name: "علی رضایی",
  mobile: "۰۹۱۲۱۲۳۴۵۶۷",
  province: "تهران",
  city: "تهران",
  address: "خیابان آزادی، پلاک ۱۰، واحد ۲",
  postalCode: "۱۲۳۴۵۶۷۸۹۰",
  notes: "",
};

describe("customerSchema", () => {
  it("normalizes Persian mobile and postal digits", () => {
    const parsed = customerSchema.parse(validCustomer);
    expect(parsed.mobile).toBe("09121234567");
    expect(parsed.postalCode).toBe("1234567890");
  });

  it("rejects an unsupported province and invalid mobile", () => {
    expect(customerSchema.safeParse({ ...validCustomer, province: "کشور دیگر" }).success).toBe(false);
    expect(customerSchema.safeParse({ ...validCustomer, mobile: "0912" }).success).toBe(false);
  });

  it("rejects a postal code that is not exactly ten digits", () => {
    expect(customerSchema.safeParse({ ...validCustomer, postalCode: "12345" }).success).toBe(false);
  });
});

describe("orderInputSchema", () => {
  it("accepts a valid item and applies safe defaults", () => {
    const parsed = orderInputSchema.parse({
      customer: validCustomer,
      items: [{ id: "pet-hair-removal-glove", qty: 2 }],
    });
    expect(parsed.items[0]?.options).toEqual({});
    expect(parsed.honeypot).toBe("");
  });

  it("rejects quantities above the checkout limit", () => {
    const result = orderInputSchema.safeParse({
      customer: validCustomer,
      items: [{ id: "pet-hair-removal-glove", qty: 21, options: {} }],
    });
    expect(result.success).toBe(false);
  });
});
