// Static site constants that don't come from the database (02 §2).
export const SITE_NAME = "Artifex Furniture";
export const SITE_TAGLINE = "Crafted furniture for modern Bangladeshi homes.";

/** Company links: desktop header (after the categories) and mobile menu (05 §2, ADR-035). */
export const COMPANY_LINKS = [
  { label: "Journal", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

/** Categories shown directly in the desktop header; the rest go under "More" (05 §2). */
export const MAX_HEADER_CATEGORIES = 6;

/**
 * Categories left out of the header and mobile menu (owner request 2026-11-13). They keep their
 * page, homepage tile and search results.
 */
export const HEADER_HIDDEN_CATEGORIES: readonly string[] = ["chairs"];

/** Shorter header labels for long category names. */
export const HEADER_CATEGORY_LABELS: Record<string, string> = {
  "dining-tables": "Dining",
};

export const WHATSAPP_FAB_LABEL = `Chat with ${SITE_NAME} on WhatsApp`;
export const MESSENGER_FAB_LABEL = `Message ${SITE_NAME} on Facebook Messenger`;

/** Developer credit in the footer, linked to the developer's WhatsApp (not counted as an inquiry). */
export const DEVELOPER = {
  name: "Shamim Hossen Badol",
  href: "https://wa.me/8801630133873",
} as const;
