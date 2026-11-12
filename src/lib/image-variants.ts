// Pre-generated WebP variants (ADR-005/014): widths and URL building. Shared by the client image
// loader and server code (JSON-LD, Open Graph, uploads), so it must not be a "use client" module.
export const IMAGE_VARIANT_WIDTHS = [480, 960, 1600] as const;
export const LARGEST_VARIANT_WIDTH = 1600;

const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");

/** Smallest variant that is at least `width`, capped at the largest variant. */
export function pickVariantWidth(width: number): number {
  return IMAGE_VARIANT_WIDTHS.find((w) => w >= width) ?? LARGEST_VARIANT_WIDTH;
}

/**
 * Maps a stored R2 key base (e.g. "products/2026/11/ab12cd34ef56") to the nearest variant URL on the
 * media domain. Static /public paths, absolute URLs and data URIs pass through unchanged.
 */
export function buildImageUrl(src: string, width: number, mediaUrl: string = MEDIA_URL): string {
  if (src.startsWith("/") || /^https?:\/\//.test(src) || src.startsWith("data:")) return src;
  const keyBase = src.replace(/^\/+/, "");
  return `${mediaUrl}/${keyBase}-${pickVariantWidth(width)}.webp`;
}
