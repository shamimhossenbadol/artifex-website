// Admin image uploads (02 §5, 09 §6): one file per request → sharp → three WebP variants on R2.
// Callers save the returned key base in the database, then call discardImage() on the old one.
import { IMAGE_VARIANT_WIDTHS } from "@/lib/image-variants";
import {
  ImageValidationError,
  MAX_UPLOAD_BYTES,
  processImage,
} from "@/server/media/image.processor";
import { createKeyBase, isValidKeyBase, type MediaFolder } from "@/server/media/keys";
import { StorageError, deleteVariants, uploadVariants } from "@/server/media/r2.storage";

export type StoredImage = { path: string; width: number; height: number };

export type UploadResult = { ok: true; image: StoredImage } | { ok: false; error: string };

/** A form's file input: a non-empty File, or null when nothing was chosen. */
export function pickFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

export async function storeImage(file: File, folder: MediaFolder): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Images must be 10 MB or smaller." };
  try {
    const processed = await processImage(Buffer.from(await file.arrayBuffer()));
    const keyBase = createKeyBase(folder);
    await uploadVariants(keyBase, processed.variants);
    return { ok: true, image: { path: keyBase, width: processed.width, height: processed.height } };
  } catch (err) {
    if (err instanceof ImageValidationError) return { ok: false, error: err.message };
    console.error("[media.storeImage]", err);
    if (err instanceof StorageError && err.message.includes("isn't configured")) {
      return { ok: false, error: "Image storage isn't set up on the server yet." };
    }
    return { ok: false, error: "The image couldn't be uploaded. Please try again." };
  }
}

/** Deletes an image's variants if it's one we stored (seed placeholders and demo paths are skipped). */
export async function discardImage(path: string | null | undefined): Promise<void> {
  if (!path || !isValidKeyBase(path)) return;
  await deleteVariants(path, IMAGE_VARIANT_WIDTHS);
}
