// Single source for store contact details, used by the header, footer, contact,
// checkout and policy pages. Replace each [PLACEHOLDER] with the real value.
// Values still in [BRACKETS] are treated as "not set" and shown as "to be announced".
export const siteConfig = {
  nameFa: "ناب استور",
  nameEn: "NABSTORE",
  phone: "[PHONE]", // e.g. 021-12345678 or 09121234567
  email: "[EMAIL]",
  address: "[ADDRESS]",
  instagram: "[INSTAGRAM]", // full URL, e.g. https://instagram.com/nabstore
  telegram: "[TELEGRAM]", // username without @, e.g. nabstore_support
  whatsapp: "", // optional: number in international format without +, e.g. 989121234567
};

export function isSet(value: string | undefined | null): value is string {
  return !!value && !/^\[.*\]$/.test(value.trim());
}

export function telegramUrl() {
  return isSet(siteConfig.telegram) ? `https://t.me/${siteConfig.telegram.replace(/^@/, "")}` : "";
}

export function instagramUrl() {
  if (!isSet(siteConfig.instagram)) return "";
  return siteConfig.instagram.startsWith("http")
    ? siteConfig.instagram
    : `https://instagram.com/${siteConfig.instagram.replace(/^@/, "")}`;
}

export function whatsappUrl(text?: string) {
  if (!isSet(siteConfig.whatsapp)) return "";
  const base = `https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
