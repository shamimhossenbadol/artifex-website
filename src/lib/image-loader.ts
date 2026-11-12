"use client";
// Custom next/image loader (02 §5, ADR-005/014). Maps a stored R2 key base to the nearest
// pre-generated WebP variant on the media domain. Images never touch the shared host.
import type { ImageLoaderProps } from "next/image";
import { buildImageUrl } from "./image-variants";

export default function imageLoader({ src, width }: ImageLoaderProps): string {
  return buildImageUrl(src, width);
}
