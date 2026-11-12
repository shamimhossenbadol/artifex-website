// Static site constants that don't come from the database (02 §2).
export const SITE_NAME = "Artifex Furniture";
export const SITE_TAGLINE = "Crafted furniture for modern Bangladeshi homes.";

/** Secondary links: desktop utility bar, mobile menu and footer (05 §2). */
export const COMPANY_LINKS = [
  { label: "Journal", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

/** Categories shown directly in the desktop header; the rest go under "More" (05 §2). */
export const MAX_HEADER_CATEGORIES = 7;

/** Shorter header labels for long category names. */
export const HEADER_CATEGORY_LABELS: Record<string, string> = {
  "dining-tables": "Dining",
};

export const WHATSAPP_FAB_LABEL = `Chat with ${SITE_NAME} on WhatsApp`;
