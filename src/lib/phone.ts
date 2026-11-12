// tel: links from display-formatted phone numbers.

/** "+880 1757-758388" → "tel:+8801757758388". Keeps a leading + and digits only. */
export function toTelHref(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}
