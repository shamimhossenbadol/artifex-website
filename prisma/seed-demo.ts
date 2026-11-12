// Optional demo catalogue (04 §6), only when SEED_DEMO=true: CI, local development and test
// servers. Never enable it in production. Products have no photos yet (the image pipeline needs
// R2), so they render with the sand placeholder. Slugs start with "demo-" so they're easy to remove.
import type { PrismaClient } from "../src/generated/prisma/client";
import { buildSearchText, effectivePrice } from "../src/lib/search-text";

type DemoProduct = {
  title: string;
  category: string;
  regularPrice: number | null;
  discountPrice?: number;
  material?: string;
  dimensions?: string;
  isMadeToOrder?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  colors?: [string, string][];
  specs?: [string, string][];
  keywords?: string;
};

const WOODS: [string, string][] = [
  ["Walnut Brown", "#5C4033"],
  ["Natural Teak", "#B68A5A"],
  ["Ebony", "#2B2622"],
];
const FABRICS: [string, string][] = [
  ["Linen Beige", "#D8CBB3"],
  ["Slate Grey", "#6E6E6A"],
  ["Forest Green", "#3F5A47"],
];

const HANDMADE: DemoProduct[] = [
  {
    title: "Signature L-Shape Sofa",
    category: "sofas",
    regularPrice: 145000,
    discountPrice: 125000,
    material: "Mahogany frame, linen-blend fabric",
    dimensions: "W 280 × D 180 × H 85 cm",
    isFeatured: true,
    isPopular: true,
    isNewArrival: true,
    colors: FABRICS,
    specs: [
      ["Seating capacity", "5–6 people"],
      ["Frame", "Kiln-dried mahogany"],
      ["Cushions", "High-density foam with fibre wrap"],
      ["Warranty", "5 years on the frame"],
    ],
    keywords: "sectional, corner sofa, couch",
  },
  {
    title: "Milano 3-Seater Sofa",
    category: "sofas",
    regularPrice: 78500,
    material: "Teak frame, velvet",
    dimensions: "W 210 × D 90 × H 82 cm",
    isPopular: true,
    colors: FABRICS,
    specs: [["Seating capacity", "3 people"]],
    keywords: "couch, settee",
  },
  {
    title: "Oakline 6-Seater Dining Table",
    category: "dining-tables",
    regularPrice: 92000,
    discountPrice: 82800,
    material: "Solid oak",
    dimensions: "L 180 × W 90 × H 76 cm",
    isFeatured: true,
    colors: WOODS,
    specs: [
      ["Seats", "6"],
      ["Top", "Solid oak, oil finish"],
    ],
  },
  {
    // Covers "Price on request" + "Made to order" in the demo data.
    title: "Aurelia Crystal Chandelier",
    category: "chandeliers",
    regularPrice: null,
    material: "K9 crystal, brushed brass",
    dimensions: "Ø 80 × H 95 cm (custom sizes available)",
    isMadeToOrder: true,
    isFeatured: true,
    colors: [
      ["Brushed Brass", "#B08D57"],
      ["Polished Chrome", "#C9CCCE"],
    ],
    specs: [
      ["Lights", "12 × E14 (LED compatible)"],
      ["Drop", "Adjustable chain up to 150 cm"],
      ["Lead time", "3–4 weeks"],
    ],
    keywords: "lighting, pendant light, jhar bati",
  },
  {
    title: "Arc Lounge Chair",
    category: "chairs",
    regularPrice: 28500,
    material: "Ash wood, bouclé",
    isNewArrival: true,
    colors: [
      ["Ivory Bouclé", "#EEE8DC"],
      ["Charcoal", "#3A3A38"],
    ],
  },
  {
    title: "Halo Brass Ring Chandelier",
    category: "chandeliers",
    regularPrice: 48500,
    discountPrice: 42500,
    material: "Brass, opal glass",
    dimensions: "Ø 60 × H 40 cm",
    isPopular: true,
    isNewArrival: true,
    specs: [
      ["Lights", "8 × G9 LED"],
      ["Dimmable", "Yes"],
    ],
    keywords: "lighting, ceiling light, jhar bati",
  },
  {
    title: "Haven King Bed with Storage",
    category: "beds",
    regularPrice: 135000,
    discountPrice: 119000,
    material: "Mahogany, upholstered headboard",
    dimensions: "King (76 × 80 in)",
    isFeatured: true,
    colors: FABRICS,
    specs: [
      ["Size", "King"],
      ["Storage", "Hydraulic lift-up"],
    ],
  },
  // "curtains" intentionally has no demo products, to show the empty state.
];

/** 24 generated sofas on top of the 2 above, so the sofa listing has 26 items (2 pages). */
const GENERATED_SOFAS: DemoProduct[] = Array.from({ length: 24 }, (_, i) => {
  const n = i + 1;
  const regular = 45000 + n * 2500;
  return {
    title: `Demo Sofa ${String(n).padStart(2, "0")}`,
    category: "sofas",
    regularPrice: n % 7 === 0 ? null : regular,
    ...(n % 4 === 0 ? { discountPrice: Math.round(regular * 0.85) } : {}),
    material: n % 2 ? "Teak frame, fabric" : "Mahogany frame, leatherette",
    isNewArrival: n <= 3,
  };
});

function slugify(title: string): string {
  return `demo-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export async function seedDemoCatalogue(db: PrismaClient): Promise<void> {
  const categories = await db.category.findMany({ select: { id: true, slug: true, name: true } });
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const products = [...HANDMADE, ...GENERATED_SOFAS];
  const now = Date.now();

  for (const [index, p] of products.entries()) {
    const category = bySlug.get(p.category);
    if (!category) continue;
    const slug = slugify(p.title);
    const shortDescription = `${p.title} by Artifex Furniture, crafted in Dhaka for modern homes.`;
    await db.product.upsert({
      where: { slug },
      update: {}, // never overwrite edits
      create: {
        title: p.title,
        slug,
        categoryId: category.id,
        shortDescription,
        description: `## Crafted for everyday life\n\n${shortDescription} Solid materials, honest joinery and a finish that lasts.\n\n- Made in our Dhaka workshop\n- Custom sizes and finishes on request\n- Free consultation on WhatsApp`,
        regularPrice: p.regularPrice,
        discountPrice: p.discountPrice ?? null,
        effectivePrice: effectivePrice(p.regularPrice, p.discountPrice ?? null),
        material: p.material ?? null,
        dimensions: p.dimensions ?? null,
        isMadeToOrder: p.isMadeToOrder ?? false,
        isNewArrival: p.isNewArrival ?? false,
        isFeatured: p.isFeatured ?? false,
        isPopular: p.isPopular ?? false,
        keywords: p.keywords ?? null,
        searchText: buildSearchText({
          title: p.title,
          categoryName: category.name,
          keywords: p.keywords,
          material: p.material,
          colorNames: p.colors?.map(([name]) => name),
        }),
        status: "PUBLISHED",
        // Spread publish dates so "Newest" ordering is stable and meaningful.
        publishedAt: new Date(now - index * 3600_000),
        colors: {
          create: (p.colors ?? []).map(([name, hex], sortOrder) => ({ name, hex, sortOrder })),
        },
        specs: {
          create: (p.specs ?? []).map(([label, value], sortOrder) => ({ label, value, sortOrder })),
        },
      },
    });
  }
  console.log(
    `  demo catalogue: ${await db.product.count({ where: { slug: { startsWith: "demo-" } } })} products`,
  );
}
