// Upload processing (02 §5, 09 §6): decode with sharp (never trust extension or MIME), apply EXIF
// rotation, strip metadata, and produce WebP variants at 480/960/1600 px. Runs once per upload.
import sharp, { type Metadata } from "sharp";
import { IMAGE_VARIANT_WIDTHS } from "@/lib/image-variants";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_DIMENSION = 8000;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);
const WEBP_QUALITY = 78;

export class ImageValidationError extends Error {
  override name = "ImageValidationError";
}

export type ImageVariant = { width: number; buffer: Buffer };

export type ProcessedImage = {
  /** Size of the largest variant, stored on the image row for aspect ratio (zero CLS). */
  width: number;
  height: number;
  variants: ImageVariant[];
};

// Keep sharp's memory use small on shared hosting: one image at a time, small cache.
sharp.cache({ memory: 32, files: 0, items: 20 });
sharp.concurrency(1);

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  if (input.byteLength === 0) throw new ImageValidationError("The file is empty.");
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError("Images must be 10 MB or smaller.");
  }

  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_DIMENSION * MAX_DIMENSION }).metadata();
  } catch {
    throw new ImageValidationError("This file isn't a readable image.");
  }
  if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) {
    throw new ImageValidationError("Use a JPEG, PNG or WebP image.");
  }
  if (!meta.width || !meta.height) throw new ImageValidationError("The image has no size.");
  if (meta.width > MAX_DIMENSION || meta.height > MAX_DIMENSION) {
    throw new ImageValidationError(`Images can be at most ${MAX_DIMENSION} px on each side.`);
  }

  // Rotate once using EXIF orientation; re-encoding to WebP drops all metadata (EXIF/GPS).
  const upright = await sharp(input).rotate().toBuffer({ resolveWithObject: true });
  const sourceWidth = upright.info.width;
  const sourceHeight = upright.info.height;

  const variants: ImageVariant[] = [];
  let largest = { width: 0, height: 0 };
  for (const width of IMAGE_VARIANT_WIDTHS) {
    const { data, info } = await sharp(upright.data)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    variants.push({ width, buffer: data });
    if (info.width >= largest.width) largest = { width: info.width, height: info.height };
  }

  return {
    width: largest.width || sourceWidth,
    height: largest.height || sourceHeight,
    variants,
  };
}
