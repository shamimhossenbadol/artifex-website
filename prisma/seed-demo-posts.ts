// Optional demo Journal posts (SEED_DEMO=true only). Practical starter articles on the 06 F4 topics,
// adapted to the current range (ADR-026). They make no claims about the business beyond what the
// owner has confirmed; edit or replace them in admin before launch. Slugs start with "demo-".
import type { PrismaClient } from "../src/generated/prisma/client";

type DemoPost = { title: string; excerpt: string; tags: string; content: string };

const POSTS: DemoPost[] = [
  {
    title: "How to choose the right sofa size for a Dhaka flat",
    excerpt:
      "Measure twice, buy once: a simple way to pick a sofa that fits your living room and still leaves space to move.",
    tags: "sofas, living room, buying guide",
    content: `Most living rooms in Dhaka flats are compact, and the most common sofa mistake is buying one that looks right in a showroom but crowds the room at home.

## Start with the wall, not the sofa

Measure the wall you want the sofa against. A comfortable rule is to leave **at least 45 cm** at each end, so the sofa doesn't look squeezed and you can still reach switches and windows.

## Keep walkways clear

Leave about **75–90 cm** between the front of the sofa and the next piece of furniture, or a walkway. Around **45 cm** to a coffee table is enough to reach a cup without stretching.

## Choose depth for how you sit

- **85–95 cm deep:** upright seating, easier to get up from, better for smaller rooms
- **95–105 cm deep:** lounging and naps, needs more floor space

## L-shape or straight?

An L-shape uses a corner well and seats more people, but check door swings and window lines first. A three-seater plus one armchair is often more flexible if you might move flats.

## Bring the room to us

Send us your room measurements and a photo on WhatsApp, and we'll suggest sizes that fit.`,
  },
  {
    title: "Caring for solid wood furniture in humid weather",
    excerpt:
      "Monsoon humidity makes wood swell and shrink. A few simple habits keep tables, beds and frames looking good for years.",
    tags: "care, wood, maintenance",
    content: `Wood is a natural material that moves with the air around it. In humid months it takes on moisture and swells slightly; in dry, air-conditioned rooms it gives moisture back. Gentle, steady conditions are what keep it healthy.

## Everyday care

- Dust with a **soft, dry cloth**. Avoid wet mops on wooden legs.
- Wipe spills straight away, especially water and tea.
- Use coasters and placemats; heat and moisture leave rings.

## During the monsoon

- Keep furniture **a few centimetres away from walls** so air can circulate.
- Avoid placing wood right next to windows that let rain spray in.
- If drawers start to stick, don't force them. They usually ease as the weather dries.

## Air conditioning and sunlight

- Don't point AC vents directly at wooden furniture.
- Strong afternoon sun fades finishes; a light curtain helps.

## Polish sparingly

A suitable wood polish every few months is plenty. Too much builds up a sticky layer that attracts dust.

Not sure what finish your piece has? Ask us on WhatsApp before using any new product on it.`,
  },
  {
    title: "Dining tables: 4, 6 or 8 seater?",
    excerpt:
      "How many people you seat every day matters more than how many you seat twice a year. Here's how to decide.",
    tags: "dining, buying guide",
    content: `A dining table is used every day, so choose it for everyday life first and for guests second.

## Give each person enough space

Allow about **60 cm of table edge per person**. Less than that and elbows start to meet.

## Typical sizes

| Seats | Rectangular table |
|---|---|
| 4 | about 120 × 80 cm |
| 6 | about 160–180 × 90 cm |
| 8 | about 200–220 × 100 cm |

## Leave room to pull out chairs

Keep **at least 90 cm** between the table edge and the wall, so people can get in and out comfortably.

## Round or rectangular?

Round tables suit smaller rooms and conversation, and nobody gets stuck at a corner. Rectangular tables fit long rooms and seat more people.

## Think about guests

If you host big family dinners only a few times a year, a six-seater with two extra chairs is often a better fit than an eight-seater that fills the room every day.`,
  },
  {
    title: "How to size a chandelier for your living or dining room",
    excerpt:
      "A quick formula for choosing chandelier diameter and hanging height, so it feels grand without overwhelming the room.",
    tags: "chandeliers, lighting, buying guide",
    content: `A chandelier is a statement piece. The right size makes a room feel finished; the wrong size makes it look crowded or underdressed.

## Diameter: a simple formula

Add the room's **length and width in feet**, and use that number in **inches** as the chandelier's diameter.

*Example:* a 12 × 14 ft living room → 12 + 14 = **26 inches** (about 65 cm).

## Over a dining table

Choose a chandelier about **half to two-thirds the width of the table**, so people don't bump into it when they stand up.

## Hanging height

- **Over a dining table:** the bottom of the chandelier about **75–85 cm above the tabletop**
- **In a living room or hallway:** at least **2.1 m clear** below it so nobody walks into it

## Higher ceilings

For ceilings above about 2.7 m, add around 7–8 cm of height for each extra 30 cm of ceiling, or choose a longer, layered design.

## Brightness

Pick warm white LED bulbs and, if you can, a dimmer: bright for dinner, softer for evenings.

Send us your room size and ceiling height on WhatsApp and we'll suggest sizes that suit the space.`,
  },
];

function slugify(title: string): string {
  return `demo-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export async function seedDemoPosts(db: PrismaClient): Promise<void> {
  const now = Date.now();
  for (const [index, post] of POSTS.entries()) {
    const slug = slugify(post.title);
    await db.blogPost.upsert({
      where: { slug },
      update: {}, // never overwrite edits
      create: {
        title: post.title,
        slug,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags,
        authorName: "Artifex Furniture",
        status: "PUBLISHED",
        publishedAt: new Date(now - index * 86_400_000),
      },
    });
  }
  console.log(
    `  demo posts: ${await db.blogPost.count({ where: { slug: { startsWith: "demo-" } } })}`,
  );
}
