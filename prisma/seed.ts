// Idempotent seed (04 §6): categories, site settings, home hero and the predefined admin.
// Safe to run on every deploy: it never overwrites content the owner has edited in admin.
import { hash } from "bcryptjs";
import { z } from "zod";
import { createPrismaClient } from "../src/lib/prisma";
import { seedDemoCatalogue } from "./seed-demo";
import { seedDemoPosts } from "./seed-demo-posts";

const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    ADMIN_EMAIL: z.email().optional(),
    ADMIN_INITIAL_PASSWORD: z.string().min(12).optional(),
    SEED_DEMO: z.enum(["true", "false"]).optional(),
  })
  .parse(process.env);

const db = createPrismaClient(env.DATABASE_URL, 1);

/** 01 §4 (product range updated 2026-11-12, ADR-026). Seeded once; admins can rename, reorder and hide them. */
const CATEGORIES = [
  { name: "Sofas", slug: "sofas", description: "Deep, comfortable seating for living rooms." },
  {
    name: "Dining Tables",
    slug: "dining-tables",
    description: "Tables for family meals and guests.",
  },
  { name: "Chairs", slug: "chairs", description: "Dining, lounge and study chairs." },
  { name: "Beds", slug: "beds", description: "Beds in King, Queen, Semi-double and Single sizes." },
  { name: "Curtains", slug: "curtains", description: "Curtains tailored to your windows." },
  {
    name: "Chandeliers",
    slug: "chandeliers",
    description: "Statement lighting in brass and crystal for living and dining rooms.",
  },
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

const SHOWROOM_MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3648.919045102521!2d90.40010057491315!3d23.85700827859821!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c7005163b74b%3A0xaf2051d6a1ae9f48!2sArtifex%20Furniture!5e0!3m2!1sen!2sbd!4v1794503735595!5m2!1sen!2sbd";

/** Starter About text (F7): only facts the owner has confirmed. Edit in admin. */
const DEFAULT_ABOUT = `Artifex Furniture brings crafted furniture to modern homes in Dhaka: sofas, dining tables, chairs, beds, curtains and chandeliers.

We believe good furniture should be **comfortable, well made and built to last**, and that it should fit the way you actually live. That's why many of our pieces can be made to your size, fabric and finish.

Visit our showroom in Uttara to see and feel the pieces in person, or message us on WhatsApp with a photo of your room. We're happy to help you choose.`;

async function seedSettings(): Promise<void> {
  // Contact details, hours and map confirmed by the owner on 2026-11-12. Email is still unknown
  // (PROGRESS open question #4); everything is editable in admin later.
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
      email: "artifexdecoryourdreams@gmail.com",
      addressLine: "House 02, Road 05, Sector 01, Uttara",
      city: "Dhaka 1230",
      // Directions to the showroom's Google Maps place (owner-supplied 2026-11-13), not just the address.
      mapLinkUrl:
        "https://www.google.com/maps/dir//Artifex+Furniture,+House+02+Road-05,+Dhaka+1230",
      facebookUrl: "https://www.facebook.com/artifexfurniturebd",
      instagramUrl: "https://www.instagram.com/artifexdecoryourdreams",
      youtubeUrl: "https://www.youtube.com/@ArtifexFurniture",
      // Confirmed by the owner on 2026-11-12: every day, 10:00 AM – 10:00 PM.
      openingHours: [{ days: "Every day", open: "10:00", close: "22:00" }],
      // Showroom map (owner's Google Maps embed, 2026-11-12) and its coordinates.
      mapEmbedUrl: SHOWROOM_MAP_EMBED,
      latitude: 23.8570083,
      longitude: 90.4001006,
      aboutContent: DEFAULT_ABOUT,
      aboutShort:
        "Artifex Furniture makes sofas, dining tables, beds and chandeliers for modern homes in Dhaka.",
      defaultSeoTitle: "Artifex Furniture | Crafted furniture in Dhaka",
      defaultSeoDescription:
        "Sofas, dining tables, beds, chairs, curtains and chandeliers, crafted for modern Bangladeshi homes. Visit our Dhaka showroom or message us on WhatsApp.",
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
  if (env.SEED_DEMO === "true") {
    await seedDemoCatalogue(db);
    await seedDemoPosts(db);
  }
  console.log("Seed complete.");
}

main()
  .catch((err: unknown) => {
    console.error("[seed]", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
