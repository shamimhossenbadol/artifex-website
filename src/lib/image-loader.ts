"use client";
// Custom next/image loader (02 §5, ADR-005/014). Maps a stored R2 key base to the nearest
// pre-generated WebP variant on the media domain. Images never touch the shared host.
import type { ImageLoaderProps } from "next/image";

export const IMAGE_VARIANT_WIDTHS = [480, 960, 1600] as const;
const LARGEST_VARIANT = 1600;

const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");

/** Smallest variant that is at least `width`, capped at the largest variant. */
export function pickVariantWidth(width: number): number {
  return IMAGE_VARIANT_WIDTHS.find((w) => w >= width) ?? LARGEST_VARIANT;
}

export function buildImageUrl(src: string, width: number, mediaUrl: string = MEDIA_URL): string {
  // Static files from /public (logo, favicon, default OG image) and absolute URLs pass through.
  if (src.startsWith("/") || /^https?:\/\//.test(src) || src.startsWith("data:")) return src;
  const keyBase = src.replace(/^\/+/, "");
  return `${mediaUrl}/${keyBase}-${pickVariantWidth(width)}.webp`;
}

export default function imageLoader({ src, width }: ImageLoaderProps): string {
  return buildImageUrl(src, width);
}
