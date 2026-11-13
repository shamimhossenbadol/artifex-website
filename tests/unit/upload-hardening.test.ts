// Upload hardening (Phase 8, 09 §6): size and dimension limits, disguised files, and the guard
// that keeps discardImage() from deleting anything we didn't create.
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ImageValidationError,
  MAX_UPLOAD_BYTES,
  processImage,
} from "@/server/media/image.processor";

const storage = vi.hoisted(() => ({
  uploadVariants: vi.fn(),
  deleteVariants: vi.fn(),
  StorageError: class StorageError extends Error {},
}));
vi.mock("@/server/media/r2.storage", () => storage);

const { discardImage, pickFile, storeImage } = await import("@/server/services/media.service");

describe("processImage limits", () => {
  it("rejects files over 10 MB before decoding", async () => {
    await expect(processImage(Buffer.alloc(MAX_UPLOAD_BYTES + 1))).rejects.toThrow(/10 MB/);
  });

  it("rejects empty files", async () => {
    await expect(processImage(Buffer.alloc(0))).rejects.toThrow(ImageValidationError);
  });

  it("rejects images wider than 8000 px", async () => {
    const wide = await sharp({
      create: { width: 8001, height: 2, channels: 3, background: "#fff" },
    })
      .png()
      .toBuffer();
    await expect(processImage(wide)).rejects.toThrow(/8000 px/);
  });

  it("rejects an SVG renamed to .jpg (decoded, not trusted by name or MIME)", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>');
    await expect(processImage(svg)).rejects.toThrow(ImageValidationError);
  });
});

describe("media service guards", () => {
  beforeEach(() => vi.resetAllMocks());

  it("refuses oversized files without reading them", async () => {
    const big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.jpg", { type: "image/jpeg" });
    expect(await storeImage(big, "products")).toEqual({
      ok: false,
      error: "Images must be 10 MB or smaller.",
    });
    expect(storage.uploadVariants).not.toHaveBeenCalled();
  });

  it("returns a friendly error for a non-image and uploads nothing", async () => {
    const fake = new File(["<script>alert(1)</script>"], "x.jpg", { type: "image/jpeg" });
    const result = await storeImage(fake, "blog");
    expect(result.ok).toBe(false);
    expect(storage.uploadVariants).not.toHaveBeenCalled();
  });

  it.each([
    "home/placeholder-hero",
    "../products/2026/11/abcdefghijkl",
    "products/2026/11/ABCDEFGHIJKL",
    "other/2026/11/abcdefghijkl",
    "https://evil.example/x",
    "",
  ])("never deletes %j", async (path) => {
    await discardImage(path);
    expect(storage.deleteVariants).not.toHaveBeenCalled();
  });

  it("deletes our own key bases", async () => {
    await discardImage("blog/2026/11/abcdefghijkl");
    expect(storage.deleteVariants).toHaveBeenCalledWith(
      "blog/2026/11/abcdefghijkl",
      expect.any(Array),
    );
  });

  it("treats an empty file input as no file", () => {
    expect(pickFile(new File([], "empty.jpg"))).toBeNull();
    expect(pickFile("text")).toBeNull();
    expect(pickFile(null)).toBeNull();
  });
});
