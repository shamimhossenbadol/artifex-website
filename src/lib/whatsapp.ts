// WhatsApp inquiry links (F3).

/** Keeps digits only, so "+880 1757-758388" becomes "8801757758388". */
export function sanitizeWhatsAppNumber(number: string): string {
  return number.replace(/\D/g, "");
}

/** `https://wa.me/<digits>?text=<encoded message>`; opens the app on mobile, WhatsApp Web on desktop. */
export function buildWhatsAppUrl({
  number,
  message,
}: {
  number: string;
  message?: string;
}): string {
  const digits = sanitizeWhatsAppNumber(number);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export type ProductMessageInput = {
  template: string;
  business: string;
  product: string;
  url: string;
  price?: string | null;
};

/**
 * Fills the admin-editable product template. Placeholders: {business}, {product},
 * {price}, {url}. Products have no colour choice (ADR-054).
 */
export function buildProductMessage(input: ProductMessageInput): string {
  const values: Record<string, string> = {
    business: input.business,
    product: input.product,
    price: input.price ?? "",
    url: input.url,
  };
  return input.template.replace(
    /\{(business|product|price|url)\}/g,
    (_, key: string) => values[key] ?? "",
  );
}
