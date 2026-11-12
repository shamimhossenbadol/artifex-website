import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createKeyBase, isValidKeyBase, isValidVariantKey, variantKey } from "@/server/media/keys";
import { ImageValidationError, processImage } from "@/server/media/image.processor";
import {
  IMMUTABLE_CACHE_CONTROL,
  deleteObject,
  resetR2ForTests,
  uploadVariants,
} from "@/server/media/r2.storage";

describe("media keys", () => {
  it("builds <folder>/<yyyy>/<mm>/<hash> and -<w>.webp variants", () => {
    const base = createKeyBase("products", new Date(Date.UTC(2026, 10, 12)), "ab12cd34ef56");
    expect(base).toBe("products/2026/11/ab12cd34ef56");
    expect(variantKey(base, 960)).toBe("products/2026/11/ab12cd34ef56-960.webp");
    expect(isValidKeyBase(base)).toBe(true);
  });

  it("generates a random 12-char lowercase hash", () => {
    const base = createKeyBase("blog");
    expect(base).toMatch(/^blog\/\d{4}\/\d{2}\/[a-z0-9]{12}$/);
  });

  it("rejects unknown folders", () => {
    expect(() => createKeyBase("../etc")).toThrow(/Unknown media folder/);
  });

  it.each(["products/2026/11/ab12cd34ef56-960.webp", "home/2027/01/zzzzzzzzzzzz-1600.webp"])(
    "accepts variant key %s",
    (key) => {
      expect(isValidVariantKey(key)).toBe(true);
    },
  );

  it.each([
    "products/2026/11/ab12cd34ef56-800.webp",
    "products/2026/13/ab12cd34ef56-960.webp",
    "other/2026/11/ab12cd34ef56-960.webp",
    "products/2026/11/../../x-960.webp",
    "products/2026/11/ab12cd34ef56-960.png",
    "index.html",
  ])("rejects key %s", (key) => {
    expect(isValidVariantKey(key)).toBe(false);
  });
});

async function makeJpeg(width: number, height: number, withExif = false): Promise<Buffer> {
  let image = sharp({
    create: { width, height, channels: 3, background: { r: 120, g: 82, b: 53 } },
  }).jpeg();
  if (withExif) image = image.withExif({ IFD0: { Copyright: "secret-owner", Make: "TestCam" } });
  return image.toBuffer();
}

describe("processImage", () => {
  it("produces 480/960/1600 WebP variants without enlarging", async () => {
    const result = await processImage(await makeJpeg(2000, 2500));
    expect(result.variants.map((v) => v.width)).toEqual([480, 960, 1600]);
    expect(result.width).toBe(1600);
    expect(result.height).toBe(2000);
    for (const v of result.variants) {
      const meta = await sharp(v.buffer).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBeLessThanOrEqual(v.width);
    }
  });

  it("keeps small images at their own size", async () => {
    const result = await processImage(await makeJpeg(600, 750));
    const widths = await Promise.all(
      result.variants.map(async (v) => (await sharp(v.buffer).metadata()).width),
    );
    expect(widths).toEqual([480, 600, 600]);
  });

  it("strips EXIF metadata", async () => {
    const input = await makeJpeg(800, 1000, true);
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const result = await processImage(input);
    for (const v of result.variants) {
      expect((await sharp(v.buffer).metadata()).exif).toBeUndefined();
    }
  });

  it("rejects a non-image buffer", async () => {
    await expect(
      processImage(Buffer.from("<html><script>alert(1)</script></html>")),
    ).rejects.toThrow(ImageValidationError);
  });

  it("rejects unsupported formats", async () => {
    const gif = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "#fff" },
    })
      .gif()
      .toBuffer();
    await expect(processImage(gif)).rejects.toThrow(/JPEG, PNG or WebP/);
  });
});

describe("R2 storage", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "mysql://u:p@localhost:3306/x");
    vi.stubEnv("AUTH_SECRET", "x".repeat(40));
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    vi.stubEnv("NEXT_PUBLIC_MEDIA_URL", "https://media.example.com");
    vi.stubEnv("R2_ACCOUNT_ID", "0123456789abcdef0123456789abcdef");
    vi.stubEnv("R2_ACCESS_KEY_ID", "key");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "secret");
    vi.stubEnv("R2_BUCKET", "artifex-media-dev");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    resetR2ForTests();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const base = "products/2026/11/ab12cd34ef56";
  const variants = [480, 960, 1600].map((width) => ({
    width,
    buffer: Buffer.from(`img-${width}`),
  }));

  function requestOf(call: unknown[]): Request {
    return call[0] as Request;
  }

  it("uploads each variant as image/webp with an immutable cache header", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    const keys = await uploadVariants(base, variants);
    expect(keys).toEqual([480, 960, 1600].map((w) => `${base}-${w}.webp`));
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const req = requestOf(fetchMock.mock.calls[0]!);
    expect(req.method).toBe("PUT");
    expect(req.url).toBe(
      "https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com/artifex-media-dev/products/2026/11/ab12cd34ef56-480.webp",
    );
    expect(req.headers.get("content-type")).toBe("image/webp");
    expect(req.headers.get("cache-control")).toBe(IMMUTABLE_CACHE_CONTROL);
    expect(req.headers.get("authorization")).toMatch(/^AWS4-HMAC-SHA256 /);
  });

  it("rolls back uploaded variants when one fails", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 })) // PUT 480
      .mockResolvedValueOnce(new Response(null, { status: 403 })) // PUT 960 fails (not retried)
      .mockResolvedValue(new Response(null, { status: 204 })); // DELETE 480
    await expect(uploadVariants(base, variants)).rejects.toThrow(/failed with 403/);
    const methods = fetchMock.mock.calls.map((c) => requestOf(c).method);
    expect(methods).toEqual(["PUT", "PUT", "DELETE"]);
    expect(requestOf(fetchMock.mock.calls[2]!).url).toContain(`${base}-480.webp`);
  });

  it("refuses to delete keys that don't match our pattern", async () => {
    await expect(deleteObject("site/../../secret.txt")).rejects.toThrow(/unexpected key/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("explains a missing R2 configuration", async () => {
    vi.stubEnv("R2_BUCKET", "");
    resetR2ForTests();
    await expect(uploadVariants(base, variants)).rejects.toThrow(/isn't configured/);
  });
});
