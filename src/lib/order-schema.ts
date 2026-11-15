import { z } from "zod";

export const provinces = [
  "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام", "بوشهر", "تهران",
  "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی", "خراسان شمالی", "خوزستان", "زنجان", "سمنان",
  "سیستان و بلوچستان", "فارس", "قزوین", "قم", "کردستان", "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد",
  "گلستان", "گیلان", "لرستان", "مازندران", "مرکزی", "هرمزگان", "همدان", "یزد",
] as const;

/** Converts Persian/Arabic digits to Latin so "۰۹۱۲…" validates like "0912…". */
export function toLatinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

const digits = (s: string) => toLatinDigits(s).replace(/[\s-]/g, "");

export const customerSchema = z.object({
  name: z.string().trim().min(2, "nameRequired").max(80, "nameTooLong"),
  mobile: z.string().transform(digits).pipe(z.string().regex(/^09\d{9}$/, "mobileInvalid")),
  province: z.enum(provinces, { errorMap: () => ({ message: "provinceRequired" }) }),
  city: z.string().trim().min(2, "cityRequired").max(60, "cityTooLong"),
  address: z.string().trim().min(10, "addressRequired").max(400, "addressTooLong"),
  postalCode: z.string().transform(digits).pipe(z.string().regex(/^\d{10}$/, "postalInvalid")),
  notes: z.string().trim().max(500, "notesTooLong").default(""),
});

export const orderItemSchema = z.object({
  id: z.string().min(1).max(60),
  qty: z.number().int().min(1).max(20),
  options: z.record(z.string().max(30), z.string().max(60)).default({}),
});

export const orderInputSchema = z.object({
  customer: customerSchema,
  items: z.array(orderItemSchema).min(1).max(30),
});

export type CustomerInput = z.input<typeof customerSchema>;
export type OrderInput = z.input<typeof orderInputSchema>;
