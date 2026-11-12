// R2 object keys (02 §5, 09 §6): server-generated, from a fixed folder allow-list, never from user
// filenames. Key base: <folder>/<yyyy>/<mm>/<12-char hash>; variants add "-<width>.webp".
import { randomBytes } from "node:crypto";
import { IMAGE_VARIANT_WIDTHS } from "@/lib/image-variants";

export const MEDIA_FOLDERS = ["products", "categories", "blog", "home", "site"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

const KEY_BASE_PATTERN = new RegExp(
  `^(${MEDIA_FOLDERS.join("|")})/\\d{4}/(0[1-9]|1[0-2])/[a-z0-9]{12}$`,
);
const VARIANT_KEY_PATTERN = new RegExp(
  `^(${MEDIA_FOLDERS.join("|")})/\\d{4}/(0[1-9]|1[0-2])/[a-z0-9]{12}-(${IMAGE_VARIANT_WIDTHS.join("|")})\\.webp$`,
);

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomHash(length = 12): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function isMediaFolder(value: string): value is MediaFolder {
  return (MEDIA_FOLDERS as readonly string[]).includes(value);
}

export function createKeyBase(folder: string, date = new Date(), hash = randomHash()): string {
  if (!isMediaFolder(folder)) throw new Error(`Unknown media folder: ${folder}`);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${folder}/${yyyy}/${mm}/${hash}`;
}

export function variantKey(keyBase: string, width: number): string {
  return `${keyBase}-${width}.webp`;
}

export function isValidKeyBase(value: string): boolean {
  return KEY_BASE_PATTERN.test(value);
}

/** Only keys we could have written are ever deleted (09 §6). */
export function isValidVariantKey(value: string): boolean {
  return VARIANT_KEY_PATTERN.test(value);
}
