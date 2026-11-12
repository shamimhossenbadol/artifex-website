// Cloudflare R2 storage over its S3-compatible API, signed with aws4fetch (ADR-014).
// Only image/webp objects are ever written, always with an immutable Cache-Control (09 §6).
import { AwsClient } from "aws4fetch";
import { resetServerEnvForTests, serverEnv } from "@/lib/env";
import { isValidVariantKey, variantKey } from "./keys";
import type { ImageVariant } from "./image.processor";

export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

export class StorageError extends Error {
  override name = "StorageError";
}

type R2Config = { endpoint: string; bucket: string; client: AwsClient };

let config: R2Config | undefined;

/** Validated on first use, so a missing R2 setup only breaks uploads, not the whole site. */
function getR2(): R2Config {
  if (config) return config;
  const env = serverEnv();
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    throw new StorageError(
      "Image storage isn't configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET).",
    );
  }
  config = {
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    bucket: env.R2_BUCKET,
    client: new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
      // aws4fetch retries 5xx up to 10 times with exponential backoff by default (~1 min). Keep
      // admin uploads responsive: two quick retries, then fail and roll back.
      retries: 2,
      initRetryMs: 100,
    }),
  };
  return config;
}

/** Test hook: forget the cached client so a test can change the env. */
export function resetR2ForTests(): void {
  config = undefined;
  resetServerEnvForTests();
}

function objectUrl(r2: R2Config, key: string): string {
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `${r2.endpoint}/${encodeURIComponent(r2.bucket)}/${path}`;
}

export async function putWebp(key: string, body: Buffer): Promise<void> {
  if (!isValidVariantKey(key)) throw new StorageError(`Refusing to write unexpected key: ${key}`);
  const r2 = getR2();
  const res = await r2.client.fetch(objectUrl(r2, key), {
    method: "PUT",
    body: new Uint8Array(body),
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": IMMUTABLE_CACHE_CONTROL,
      "Content-Length": String(body.byteLength),
    },
  });
  if (!res.ok) throw new StorageError(`R2 PUT ${key} failed with ${res.status}`);
}

export async function deleteObject(key: string): Promise<void> {
  if (!isValidVariantKey(key)) throw new StorageError(`Refusing to delete unexpected key: ${key}`);
  const r2 = getR2();
  const res = await r2.client.fetch(objectUrl(r2, key), { method: "DELETE" });
  // 404 is fine: the object is already gone.
  if (!res.ok && res.status !== 404) {
    throw new StorageError(`R2 DELETE ${key} failed with ${res.status}`);
  }
}

/**
 * Uploads all variants one after another (one buffer in flight; low memory). If any upload fails,
 * deletes the variants already uploaded and rethrows (02 §5 step 5).
 */
export async function uploadVariants(keyBase: string, variants: ImageVariant[]): Promise<string[]> {
  const uploaded: string[] = [];
  try {
    for (const variant of variants) {
      const key = variantKey(keyBase, variant.width);
      await putWebp(key, variant.buffer);
      uploaded.push(key);
    }
    return uploaded;
  } catch (err) {
    await Promise.allSettled(uploaded.map((key) => deleteObject(key)));
    throw err;
  }
}

/** Deletes every variant of an image. Failures are logged, not thrown (orphans only cost storage). */
export async function deleteVariants(keyBase: string, widths: readonly number[]): Promise<void> {
  const results = await Promise.allSettled(widths.map((w) => deleteObject(variantKey(keyBase, w))));
  for (const result of results) {
    if (result.status === "rejected")
      console.error("[r2.deleteVariants]", { keyBase }, result.reason);
  }
}
