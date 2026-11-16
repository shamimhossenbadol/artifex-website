import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NOT_DELIVERED_MESSAGE,
  TOO_LARGE_MESSAGE,
  UPLOAD_MAX_EDGE,
  fitWithin,
  prepareFormImages,
  sendImageWithRetry,
} from "@/lib/prepare-upload";

// In Node there is no canvas, so prepareImageForUpload() returns the original file unchanged; these
// tests cover the sizing maths and the retry/delivery logic (ADR-058).
const photo = (bytes = 10) => new File([new Uint8Array(bytes)], "sofa.jpg", { type: "image/jpeg" });

afterEach(() => vi.useRealTimers());

describe("fitWithin", () => {
  it("keeps small images as they are", () => {
    expect(fitWithin(1200, 900)).toEqual({ width: 1200, height: 900 });
  });

  it("scales the longest side down to the limit, keeping the ratio", () => {
    expect(fitWithin(6000, 4000)).toEqual({ width: UPLOAD_MAX_EDGE, height: 1600 });
    expect(fitWithin(3000, 6000)).toEqual({ width: 1200, height: UPLOAD_MAX_EDGE });
    expect(fitWithin(4800, 4800)).toEqual({ width: UPLOAD_MAX_EDGE, height: UPLOAD_MAX_EDGE });
  });
});

describe("sendImageWithRetry", () => {
  it("returns the server's answer on the first try", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    const attempts: number[] = [];
    expect(await sendImageWithRetry(photo(), send, (n) => attempts.push(n))).toEqual({
      ok: true,
      result: { ok: true },
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(attempts).toEqual([1]);
  });

  it("retries when the request fails, then succeeds", async () => {
    vi.useFakeTimers();
    const send = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({ ok: true });
    const pending = sendImageWithRetry(photo(), send);
    await vi.runAllTimersAsync();
    expect(await pending).toEqual({ ok: true, result: { ok: true } });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("gives up after three failed requests with a clear message", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const pending = sendImageWithRetry(photo(), send);
    await vi.runAllTimersAsync();
    expect(await pending).toEqual({
      ok: false,
      reason: "not-delivered",
      message: NOT_DELIVERED_MESSAGE,
    });
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("doesn't retry errors the server reports", async () => {
    const send = vi.fn().mockResolvedValue({ ok: false, error: "Use a JPEG, PNG or WebP image." });
    const delivery = await sendImageWithRetry(photo(), send);
    expect(delivery).toEqual({
      ok: true,
      result: { ok: false, error: "Use a JPEG, PNG or WebP image." },
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("refuses files still over 10 MB without sending them", async () => {
    const send = vi.fn();
    const delivery = await sendImageWithRetry(photo(10 * 1024 * 1024 + 1), send);
    expect(delivery).toEqual({ ok: false, reason: "too-large", message: TOO_LARGE_MESSAGE });
    expect(send).not.toHaveBeenCalled();
  });
});

describe("prepareFormImages", () => {
  it("copies every field and flags chosen images", async () => {
    const form = new FormData();
    form.set("name", "Sofas");
    form.set("image", photo());
    form.set("empty", new File([], "", { type: "application/octet-stream" }));
    const { formData, hasImages } = await prepareFormImages(form);
    expect(hasImages).toBe(true);
    expect(formData.get("name")).toBe("Sofas");
    expect((formData.get("image") as File).name).toBe("sofa.jpg");
    expect(formData.has("empty")).toBe(true);
  });

  it("reports no images for a plain form", async () => {
    const form = new FormData();
    form.set("name", "Sofas");
    expect((await prepareFormImages(form)).hasImages).toBe(false);
  });
});
