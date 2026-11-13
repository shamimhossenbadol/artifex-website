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
  findHeroSlides: vi.fn(),
  findHeroSlide: vi.fn(),
  countHeroSlides: vi.fn(),
  insertHeroSlide: vi.fn(),
  updateHeroSlideAlt: vi.fn(),
  deleteHeroSlide: vi.fn(),
  reorderHeroSlides: vi.fn(),
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

const {
  addHeroSlide,
  bannerState,
  deleteBanner,
  moveBanner,
  moveHeroSlide,
  removeHeroSlide,
  saveHero,
  updateBanner,
} = await import("@/server/services/home-admin.service");
const { MAX_HERO_SLIDES } = await import("@/server/services/home.service");

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
    ctaLabel: "Explore",
    ctaHref: "/products",
    secondaryLabel: null,
    secondaryHref: null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    media.storeImage.mockResolvedValue({
      ok: true,
      image: { path: NEW, width: 1600, height: 900 },
    });
    repo.countHeroSlides.mockResolvedValue(1);
    repo.insertHeroSlide.mockImplementation(async (d: { imagePath: string; imageAlt: string }) => ({
      id: 9,
      ...d,
    }));
  });

  it("saves the hero text without touching images", async () => {
    expect(await saveHero(heroInput)).toEqual({ ok: true, data: undefined });
    expect(repo.saveHomeHero).toHaveBeenCalledWith(heroInput);
    expect(media.storeImage).not.toHaveBeenCalled();
  });

  it("uploads a hero slide, then saves it with a default description", async () => {
    const order: string[] = [];
    media.storeImage.mockImplementation(async () => {
      order.push("upload");
      return { ok: true, image: { path: NEW, width: 1600, height: 900 } };
    });
    repo.insertHeroSlide.mockImplementation(async (d: { imagePath: string; imageAlt: string }) => {
      order.push("save");
      return { id: 9, ...d };
    });
    const result = await addHeroSlide(file);
    expect(order).toEqual(["upload", "save"]);
    expect(result).toMatchObject({ ok: true, data: { id: 9, path: NEW } });
    expect(result.ok && result.data.alt.length).toBeGreaterThan(0);
  });

  it("removes the uploaded slide again if saving fails", async () => {
    repo.insertHeroSlide.mockRejectedValue(new Error("db down"));
    await expect(addHeroSlide(file)).rejects.toThrow("db down");
    expect(media.discardImage).toHaveBeenCalledWith(NEW);
  });

  it("refuses more than the maximum number of slides without uploading", async () => {
    repo.countHeroSlides.mockResolvedValue(MAX_HERO_SLIDES);
    expect(await addHeroSlide(file)).toMatchObject({ ok: false });
    expect(media.storeImage).not.toHaveBeenCalled();
  });

  it("deletes the slide row before its image", async () => {
    const order: string[] = [];
    repo.findHeroSlide.mockResolvedValue({ id: 4, imagePath: OLD, imageAlt: "Sofa" });
    repo.deleteHeroSlide.mockImplementation(async () => void order.push("delete"));
    media.discardImage.mockImplementation(async (p: string) => void order.push(`discard ${p}`));
    await removeHeroSlide(4);
    expect(order).toEqual(["delete", `discard ${OLD}`]);
  });

  it("moves a slide one place and ignores moves past the ends", async () => {
    repo.findHeroSlides.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
    await moveHeroSlide(3, "up");
    expect(repo.reorderHeroSlides).toHaveBeenCalledWith([1, 3, 2]);
    repo.reorderHeroSlides.mockClear();
    await moveHeroSlide(1, "up");
    expect(repo.reorderHeroSlides).not.toHaveBeenCalled();
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
