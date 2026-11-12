// Idempotent seed (04 §6): categories, site settings, home hero and the predefined admin.
// Safe to run on every deploy: it never overwrites content the owner has edited in admin.
import { hash } from "bcryptjs";
import { z } from "zod";
import { createPrismaClient } from "../src/lib/prisma";
import { seedDemoCatalogue } from "./seed-demo";

const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    ADMIN_EMAIL: z.email().optional(),
    ADMIN_INITIAL_PASSWORD: z.string().min(12).optional(),
    SEED_DEMO: z.enum(["true", "false"]).optional(),
  })
  .parse(process.env);

const db = createPrismaClient(env.DATABASE_URL, 1);

/** 01 §4. Seeded once; admins can rename, reorder and hide them afterwards. */
const CATEGORIES = [
  { name: "Sofas", slug: "sofas", description: "Deep, comfortable seating for living rooms." },
  {
    name: "Dining Tables",
    slug: "dining-tables",
    description: "Tables for family meals and guests.",
  },
  { name: "Doors", slug: "doors", description: "Solid wood doors, made to your size." },
  { name: "Chairs", slug: "chairs", description: "Dining, lounge and study chairs." },
  { name: "Curtains", slug: "curtains", description: "Curtains tailored to your windows." },
  { name: "Tables", slug: "tables", description: "Coffee, side and study tables." },
  { name: "Beds", slug: "beds", description: "Beds in King, Queen, Semi-double and Single sizes." },
] as const;

async function seedCategories(): Promise<void> {
  for (const [index, category] of CATEGORIES.entries()) {
    await db.category.upsert({
      where: { slug: category.slug },
      update: {}, // never overwrite admin edits
      create: { ...category, sortOrder: index },
    });
  }
}

async function seedSettings(): Promise<void> {
  // Contact details confirmed by the owner on 2026-11-12. Email and opening hours are still
  // defaults (PROGRESS open question #4); everything is editable in admin later.
  await db.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: "Artifex Furniture",
      tagline: "Crafted furniture for modern Bangladeshi homes.",
      phone: "+880 1757-758388",
      whatsappNumber: "8801757758388",
      whatsappDefaultMessage:
        "Hello Artifex Furniture, I'd like to know more about your furniture.",
      whatsappProductTemplate: "Hello {business}, I'm interested in {product}{color}. {url}",
      email: null,
      addressLine: "House 02, Road 05, Sector 01, Uttara",
      city: "Dhaka 1230",
      mapLinkUrl:
        "https://www.google.com/maps/search/?api=1&query=House%2002%2C%20Road%2005%2C%20Sector%2001%2C%20Uttara%2C%20Dhaka%201230",
      facebookUrl: "https://www.facebook.com/artifexfurniturebd",
      instagramUrl: "https://www.instagram.com/artifexdecoryourdreams",
      youtubeUrl: "https://www.youtube.com/@ArtifexFurniture",
      openingHours: [
        { days: "Sat–Thu", open: "10:00", close: "21:00" },
        { days: "Fri", closed: true },
      ],
      aboutShort:
        "Artifex Furniture makes sofas, tables, beds and doors for modern homes in Dhaka.",
      defaultSeoTitle: "Artifex Furniture | Crafted furniture in Dhaka",
      defaultSeoDescription:
        "Sofas, dining tables, beds, doors and more, crafted for modern Bangladeshi homes. Visit our Dhaka showroom or message us on WhatsApp.",
    },
  });
}

async function seedHomeHero(): Promise<void> {
  await db.homeHero.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      eyebrow: "Artifex Furniture",
      heading: "Crafted furniture for modern homes",
      subheading: "Solid materials, honest craft, and comfort that lasts.",
      imagePath: "home/placeholder-hero", // replaced from admin once real photos are uploaded
      imageAlt: "A living room furnished by Artifex Furniture",
      ctaLabel: "Browse products",
      ctaHref: "/products",
      secondaryLabel: "Visit the showroom",
      secondaryHref: "/contact",
    },
  });
}

async function seedAdmin(): Promise<void> {
  const existing = await db.adminUser.count();
  if (existing > 0) {
    console.log("  admin: already exists, left unchanged");
    return;
  }
  if (!env.ADMIN_EMAIL || !env.ADMIN_INITIAL_PASSWORD) {
    throw new Error(
      "No admin exists yet. Set ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD (min 12 chars) and re-run the seed.",
    );
  }
  await db.adminUser.create({
    data: {
      email: env.ADMIN_EMAIL.toLowerCase(),
      name: "Admin",
      passwordHash: await hash(env.ADMIN_INITIAL_PASSWORD, 12), // 09 §2: bcrypt cost 12
      mustChangePassword: true,
    },
  });
  console.log(`  admin: created ${env.ADMIN_EMAIL.toLowerCase()} (must change password)`);
}

async function main(): Promise<void> {
  console.log("Seeding…");
  await seedCategories();
  console.log(`  categories: ${await db.category.count()}`);
  await seedSettings();
  await seedHomeHero();
  console.log("  settings + home hero: ok");
  await seedAdmin();
  if (env.SEED_DEMO === "true") await seedDemoCatalogue(db);
  console.log("Seed complete.");
}

main()
  .catch((err: unknown) => {
    console.error("[seed]", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
