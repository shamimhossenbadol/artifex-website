import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  bannerSchema,
  dhakaEndOfDay,
  dhakaStartOfDay,
  heroSchema,
  isSafeLink,
  toDhakaDateInput,
} from "@/lib/validation/home";
import {
  extractMapEmbedSrc,
  normalizeWhatsAppNumber,
  settingsFormSchema,
} from "@/lib/validation/settings";

// --- Service mocks (repositories + media), hoisted by Vitest ------------------------------------
const repo = vi.hoisted(() => ({
  findHomeHero: vi.fn(),
  saveHomeHero: vi.fn(),
  findAllBanners: vi.fn(),
  findBannerById: vi.fn(),
  createBanner: vi.fn(),
  updateBanner: vi.fn(),
  deleteBanner: vi.fn(),
  reorderBanners: vi.fn(),
  findActiveBanners: vi.fn(),
}));
const media = vi.hoisted(() => ({ storeImage: vi.fn(), discardImage: vi.fn(), pickFile: vi.fn() }));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("next/cache", () => ({ cacheTag: () => undefined, cacheLife: () => undefined }));
vi.mock("@/server/repositories/home.repo", () => repo);
vi.mock("@/server/services/media.service", () => media);

const { bannerState, deleteBanner, moveBanner, saveHero, updateBanner } =
  await import("@/server/services/home-admin.service");

const settings = (data: Record<string, string>) => settingsFormSchema.safeParse(data);

describe("WhatsApp number", () => {
  it.each([
    ["01757-758388", "8801757758388"],
    ["+880 1757 758388", "8801757758388"],
    ["8801757758388", "8801757758388"],
  ])("normalises %s", (input, expected) => {
    expect(normalizeWhatsAppNumber(input)).toBe(expected);
  });

  const contact = (whatsappNumber: string, template = "Hi {business}, about {product}. {url}") =>
    settings({
      section: "contact",
      phone: "+880 1757-758388",
      whatsappNumber,
      email: "",
      whatsappDefaultMessage: "Hello",
      whatsappProductTemplate: template,
    });

  it("accepts a Bangladeshi mobile and stores digits", () => {
    const r = contact("01757-758388");
    expect(r.success && r.data.section === "contact" && r.data.whatsappNumber).toBe(
      "8801757758388",
    );
  });

  it.each(["12345", "8800123456789", "abc"])("rejects %s", (n) => {
    expect(contact(n).success).toBe(false);
  });

  it("requires {product} in the product template", () => {
    expect(contact("01757758388", "Hello there").success).toBe(false);
  });

  it("turns a blank email into null and rejects a bad one", () => {
    const ok = contact("01757758388");
    expect(ok.success && ok.data.section === "contact" && ok.data.email).toBeNull();
    expect(
      settings({
        section: "contact",
        phone: "1",
        whatsappNumber: "01757758388",
        email: "not-an-email",
        whatsappDefaultMessage: "Hi",
        whatsappProductTemplate: "{product}",
      }).success,
    ).toBe(false);
  });
});

describe("location settings", () => {
  const embed = "https://www.google.com/maps/embed?pb=!1m18!1m12";
  const location = (overrides: Record<string, string> = {}) =>
    settings({
      section: "location",
      addressLine: "House 02, Road 05",
      city: "Dhaka 1230",
      mapEmbedUrl: "",
      mapLinkUrl: "",
      latitude: "",
      longitude: "",
      openingHours: JSON.stringify([{ days: "Every day", open: "10:00", close: "22:00" }]),
      ...overrides,
    });

  it("extracts the src from a pasted <iframe>", () => {
    expect(extractMapEmbedSrc(`<iframe src="${embed}&amp;x=1" width="600"></iframe>`)).toBe(
      `${embed}&x=1`,
    );
    const r = location({ mapEmbedUrl: `<iframe src="${embed}" loading="lazy"></iframe>` });
    expect(r.success && r.data.section === "location" && r.data.mapEmbedUrl).toBe(embed);
  });

  it("rejects embeds from other hosts", () => {
    expect(location({ mapEmbedUrl: "https://evil.example/maps/embed?x" }).success).toBe(false);
    expect(location({ mapEmbedUrl: '<iframe src="javascript:alert(1)">' }).success).toBe(false);
  });

  it("parses coordinates and rejects out-of-range ones", () => {
    const r = location({ latitude: "23.857", longitude: "90.4001" });
    expect(r.success && r.data.section === "location" && r.data.latitude).toBe(23.857);
    expect(location({ latitude: "123" }).success).toBe(false);
    expect(location({ longitude: "east" }).success).toBe(false);
  });

  it("validates the opening hours JSON", () => {
    expect(location({ openingHours: "[]" }).success).toBe(true);
    expect(
      location({ openingHours: JSON.stringify([{ days: "Fri", closed: true }]) }).success,
    ).toBe(true);
    expect(location({ openingHours: JSON.stringify([{ days: "", open: "10:00" }]) }).success).toBe(
      false,
    );
    expect(location({ openingHours: "{not json" }).success).toBe(false);
  });
});

describe("social settings", () => {
  const social = (facebookUrl: string) =>
    settings({ section: "social", facebookUrl, instagramUrl: "", youtubeUrl: "" });

  it.each(["https://www.facebook.com/artifexfurniturebd", "https://facebook.com/x", ""])(
    "accepts %s",
    (url) => expect(social(url).success).toBe(true),
  );

  it.each([
    "http://www.facebook.com/x",
    "https://evilfacebook.com/x",
    "https://facebook.com.evil.example/x",
    "javascript:alert(1)",
  ])("rejects %s", (url) => expect(social(url).success).toBe(false));
});

describe("homepage links", () => {
  it.each(["/products", "/categories/sofas?sort=new", "https://wa.me/8801757758388"])(
    "allows %s",
    (href) => expect(isSafeLink(href)).toBe(true),
  );

  it.each(["//evil.example", "javascript:alert(1)", "http://example.com", "/\\evil", "products"])(
    "blocks %s",
    (href) => expect(isSafeLink(href)).toBe(false),
  );

  const hero = (overrides: Record<string, string> = {}) =>
    heroSchema.safeParse({
      eyebrow: "",
      heading: "Crafted furniture",
      subheading: "",
      imageAlt: "",
      ctaLabel: "Explore",
      ctaHref: "/products",
      secondaryLabel: "",
      secondaryHref: "",
      ...overrides,
    });

  it("needs both or neither of the second button's label and link", () => {
    expect(hero().success).toBe(true);
    expect(hero({ secondaryLabel: "Visit", secondaryHref: "/contact" }).success).toBe(true);
    expect(hero({ secondaryLabel: "Visit" }).success).toBe(false);
  });
});

describe("banner dates (Dhaka, UTC+6)", () => {
  it("maps calendar days to the start and end of the Dhaka day", () => {
    expect(dhakaStartOfDay("2026-12-01").toISOString()).toBe("2026-11-30T18:00:00.000Z");
    expect(dhakaEndOfDay("2026-12-01").toISOString()).toBe("2026-12-01T17:59:59.999Z");
    expect(toDhakaDateInput(dhakaStartOfDay("2026-12-01"))).toBe("2026-12-01");
    expect(toDhakaDateInput(dhakaEndOfDay("2026-12-01"))).toBe("2026-12-01");
    expect(toDhakaDateInput(null)).toBe("");
  });

  const banner = (startsAt: string, endsAt: string) =>
    bannerSchema.safeParse({
      title: "Eid sale",
      subtitle: "",
      imageAlt: "Sofa",
      linkHref: "",
      linkLabel: "",
      isActive: "on",
      startsAt,
      endsAt,
    });

  it("allows a one-day window and rejects an end before the start", () => {
    const r = banner("2026-12-01", "2026-12-01");
    expect(r.success && r.data.isActive).toBe(true);
    expect(banner("2026-12-02", "2026-12-01").success).toBe(false);
    expect(banner("2026-13-40", "").success).toBe(false);
  });

  it("derives the banner's state", () => {
    const now = new Date("2026-12-05T00:00:00Z");
    const base = { isActive: true, startsAt: null, endsAt: null };
    expect(bannerState(base, now)).toBe("live");
    expect(bannerState({ ...base, isActive: false }, now)).toBe("hidden");
    expect(bannerState({ ...base, startsAt: new Date("2026-12-06T00:00:00Z") }, now)).toBe(
      "scheduled",
    );
    expect(bannerState({ ...base, endsAt: new Date("2026-12-04T00:00:00Z") }, now)).toBe("ended");
  });
});

describe("homepage image changes", () => {
  const OLD = "home/2026/11/oldoldoldold";
  const NEW = "home/2026/11/newnewnewnew";
  const file = new File([new Uint8Array([1])], "photo.jpg", { type: "image/jpeg" });
  const heroInput = {
    eyebrow: null,
    heading: "Heading",
    subheading: null,
    imageAlt: "A sofa",
    ctaLabel: "Explore",
    ctaHref: "/products",
    secondaryLabel: null,
    secondaryHref: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    repo.findHomeHero.mockResolvedValue({ ...heroInput, imagePath: OLD, imageAlt: "Old" });
    media.storeImage.mockResolvedValue({
      ok: true,
      image: { path: NEW, width: 1600, height: 900 },
    });
  });

  it("uploads, saves, then deletes the old image", async () => {
    const order: string[] = [];
    media.storeImage.mockImplementation(async () => {
      order.push("upload");
      return { ok: true, image: { path: NEW, width: 1600, height: 900 } };
    });
    repo.saveHomeHero.mockImplementation(async () => void order.push("save"));
    media.discardImage.mockImplementation(async (p: string) => void order.push(`discard ${p}`));

    expect(await saveHero(heroInput, file)).toEqual({ ok: true, data: undefined });
    expect(order).toEqual(["upload", "save", `discard ${OLD}`]);
    expect(repo.saveHomeHero.mock.calls[0]?.[0]).toMatchObject({ imagePath: NEW });
  });

  it("removes the new upload again if saving fails", async () => {
    repo.saveHomeHero.mockRejectedValue(new Error("db down"));
    await expect(saveHero(heroInput, file)).rejects.toThrow("db down");
    expect(media.discardImage).toHaveBeenCalledWith(NEW);
    expect(media.discardImage).not.toHaveBeenCalledWith(OLD);
  });

  it("keeps the current image when no file is chosen", async () => {
    await saveHero(heroInput, null);
    expect(media.storeImage).not.toHaveBeenCalled();
    expect(repo.saveHomeHero.mock.calls[0]?.[0]).toMatchObject({ imagePath: OLD });
    expect(media.discardImage).not.toHaveBeenCalled();
  });

  it("asks for a description when the hero has a photo", async () => {
    const result = await saveHero({ ...heroInput, imageAlt: null }, null);
    expect(result).toMatchObject({ ok: false, field: "imageAlt" });
    expect(repo.saveHomeHero).not.toHaveBeenCalled();
  });

  it("reports upload errors on the image field without saving", async () => {
    media.storeImage.mockResolvedValue({ ok: false, error: "Use a JPEG, PNG or WebP image." });
    const result = await saveHero(heroInput, file);
    expect(result).toMatchObject({ ok: false, field: "image" });
    expect(repo.saveHomeHero).not.toHaveBeenCalled();
  });

  it("replaces a banner image and deletes the banner's image on delete", async () => {
    repo.findBannerById.mockResolvedValue({ id: 3, imagePath: OLD });
    const input = {
      title: "Sale",
      subtitle: null,
      imageAlt: "Sofa",
      linkHref: null,
      linkLabel: null,
      isActive: true,
      startsAt: null,
      endsAt: null,
    };
    await updateBanner(3, input, file);
    expect(repo.updateBanner).toHaveBeenCalledWith(3, { ...input, imagePath: NEW });
    expect(media.discardImage).toHaveBeenCalledWith(OLD);

    media.discardImage.mockClear();
    await deleteBanner(3);
    expect(repo.deleteBanner).toHaveBeenCalledWith(3);
    expect(media.discardImage).toHaveBeenCalledWith(OLD);
  });

  it("moves banners by rewriting the order", async () => {
    repo.findAllBanners.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
    await moveBanner(3, "up");
    expect(repo.reorderBanners).toHaveBeenCalledWith([1, 3, 2]);
    repo.reorderBanners.mockClear();
    await moveBanner(1, "up");
    expect(repo.reorderBanners).not.toHaveBeenCalled();
  });
});
