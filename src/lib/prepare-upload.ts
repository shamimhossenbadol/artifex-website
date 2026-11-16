// Browser-side image preparation before upload (ADR-058). Phone and camera photos are often
// 5–10 MB and 12–48 MP: slow to send, heavy for sharp on shared hosting, and their raw bytes can
// trip the host's request firewall. Re-encoding in the browser (what "edit and save again" did by
// hand) makes every upload small and fresh. The server still validates and processes each file.

/** Longest side sent to the server. The largest stored variant is 1600 px, so this leaves room. */
export const UPLOAD_MAX_EDGE = 2400;
/** Originals up to this size are accepted in the browser; they're shrunk before sending. */
export const MAX_ORIGINAL_BYTES = 40 * 1024 * 1024;
/** Encoder quality per attempt: a retry re-encodes slightly differently (different bytes). */
export const UPLOAD_QUALITIES = [0.9, 0.86, 0.82] as const;

/** Scales (width, height) down to fit within `max` on the longest side; never enlarges. */
export function fitWithin(
  width: number,
  height: number,
  max: number = UPLOAD_MAX_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** What the server accepts per request (09 §6), checked after the browser has shrunk the photo. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const NOT_DELIVERED_MESSAGE =
  "The photo didn't reach the server after 3 tries. Check your internet connection and try again; " +
  "if only this photo keeps failing, save it again as a JPEG and upload that copy.";
export const TOO_LARGE_MESSAGE = "This photo is too large even after resizing (10 MB max).";

export type Delivery<R> =
  { ok: true; result: R } | { ok: false; reason: "too-large" | "not-delivered"; message: string };

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Prepares the photo and sends it with `send` (a Server Action call). If the request itself fails
 * (network drop, or the host's firewall rejecting the bytes) it tries again up to two more times,
 * each with a fresh re-encode. Whatever the server answers (including its own validation errors)
 * is returned as `result` and not retried.
 */
export async function sendImageWithRetry<R>(
  original: File,
  send: (file: File) => Promise<R>,
  onAttempt?: (attempt: number) => void,
): Promise<Delivery<R>> {
  for (let attempt = 0; attempt < UPLOAD_QUALITIES.length; attempt++) {
    onAttempt?.(attempt + 1);
    const file = await prepareImageForUpload(original, UPLOAD_QUALITIES[attempt]);
    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, reason: "too-large", message: TOO_LARGE_MESSAGE };
    }
    try {
      return { ok: true, result: await send(file) };
    } catch {
      if (attempt < UPLOAD_QUALITIES.length - 1) await pause(1500 * (attempt + 1));
    }
  }
  return { ok: false, reason: "not-delivered", message: NOT_DELIVERED_MESSAGE };
}

/** True for a chosen (non-empty) image file in a form. */
function isImageFile(value: FormDataEntryValue): value is File {
  return value instanceof File && value.size > 0 && value.type.startsWith("image/");
}

/** A copy of the form data with every chosen image prepared for upload (single-image fields). */
export async function prepareFormImages(
  source: FormData,
  quality: number = UPLOAD_QUALITIES[0],
): Promise<{ formData: FormData; hasImages: boolean }> {
  const formData = new FormData();
  let hasImages = false;
  for (const [key, value] of source.entries()) {
    if (isImageFile(value)) {
      hasImages = true;
      formData.append(key, await prepareImageForUpload(value, quality));
    } else {
      formData.append(key, value);
    }
  }
  return { formData, hasImages };
}

export { pause as waitBeforeRetry };

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Returns a resized, re-encoded copy of the photo (WebP; JPEG on a white background where the
 * browser can't encode WebP). EXIF rotation is applied. If anything fails, the original file is
 * returned and the server handles it as before.
 */
export async function prepareImageForUpload(
  file: File,
  quality: number = UPLOAD_QUALITIES[0],
): Promise<File> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let blob = await toBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") {
      // Older Safari can't encode WebP and silently returns PNG: use JPEG, which has no alpha.
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      blob = await toBlob(canvas, "image/jpeg", quality);
    }
    if (!blob || blob.size === 0) return file;

    const base = file.name.replace(/\.[^./\\]+$/, "") || "photo";
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  }
}
