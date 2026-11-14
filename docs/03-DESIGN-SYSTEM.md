# 03 — Design System

**Direction: "Quiet luxury, warm materials."** Think of a design studio's lookbook: warm ivory backgrounds, deep ink text, a walnut accent, generous whitespace, and photography doing the talking.
No gradients, no glassmorphism, no heavy shadows, no decorative animation.

## 1. Colour tokens

Defined as CSS variables in `src/styles/globals.css` and exposed to Tailwind (`@theme` in Tailwind v4). **Use only these.**

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#F8F6F2` | Page background (warm ivory) |
| `--color-surface` | `#FFFFFF` | Cards, inputs, admin panels |
| `--color-sand` | `#EFEAE2` | Alternate section background, image placeholders |
| `--color-line` | `#E2DBD0` | Borders, dividers |
| `--color-ink` | `#1C1A17` | Primary text, primary buttons |
| `--color-ink-soft` | `#4A453F` | Body text on light backgrounds |
| `--color-muted` | `#7A7369` | Secondary text, captions, meta |
| `--color-walnut` | `#7A5235` | Brand accent: links, active states, eyebrow text |
| `--color-walnut-dark` | `#5E3E27` | Accent hover |
| `--color-sale` | `#A4472E` | Discount price and "-15%" badge (muted terracotta) |
| `--color-success` | `#3F6B4E` | Admin success messages |
| `--color-danger` | `#B3261E` | Errors, destructive admin actions |
| `--color-whatsapp` | `#25D366` | **Only** the WhatsApp icon/button accent |
| `--color-whatsapp-dark` | `#128C4B` | WhatsApp button background, which passes AA with white text |
| `--color-messenger` | `#0866FF` | Floating Messenger button only (white icon, 4.6:1) |
| `--color-brand` | `#D2161E` | **Only** the logo (refined from the source `#FF0707`; ADR-022) |

Contrast: ink on bg is ≈ 16:1, muted on bg ≈ 4.6:1 (AA for body text), and white on walnut ≈ 6.9:1.
Dark mode: **not in scope** for the public site. Furniture photography is shot for light backgrounds.

## 2. Typography

Loaded with `next/font/google` (self-hosted at build, `display: swap`, subsets `latin`).

| Role | Font | Weights |
|---|---|---|
| Display / headings | **Cormorant Garamond** | 500, 600 |
| Body / UI | **Inter** | 400, 500, 600 |

Fallbacks: `Georgia, serif` and `system-ui, sans-serif`. If Bangla is added later, use `Hind Siliguri` as a fallback family.

### Type scale (mobile → desktop)

| Token | Mobile | Desktop | Font | Use |
|---|---|---|---|---|
| `display` | 40/44 | 72/76 | Cormorant 500 | Hero heading |
| `h1` | 34/40 | 52/58 | Cormorant 500 | Page titles, product title |
| `h2` | 28/34 | 40/46 | Cormorant 500 | Section titles |
| `h3` | 22/28 | 26/32 | Cormorant 600 | Card group titles, blog card |
| `eyebrow` | 12/16, tracking 0.16em, uppercase | same | Inter 500 | Labels above headings ("NEW ARRIVALS") |
| `body-lg` | 17/28 | 18/30 | Inter 400 | Intros, product description |
| `body` | 15/24 | 16/26 | Inter 400 | Default |
| `small` | 13/20 | 14/20 | Inter 400 | Meta, captions |
| `price` | 18/24 | 20/28 | Inter 600, tabular-nums | Prices |

Rules: headings are serif, while everything functional (nav, buttons, prices, forms) is Inter. Keep line length at 60–75 characters for long text (`max-w-prose`).

## 3. Spacing & layout

- **Base unit 4 px** (Tailwind default). Use a constrained set: 2, 3, 4, 6, 8, 12, 16, 20, 24, 32.
- **Container:** `max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10`.
- **Section rhythm:** `py-16 md:py-24`; section heading to content is `mb-8 md:mb-12`.
- **Grid gaps:** product grids use `gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14`.
- **Breakpoints:** Tailwind defaults (sm 640, md 768, lg 1024, xl 1280, 2xl 1536).

## 4. Shape, elevation, motion

- **Radius:** `--radius-sm: 2px` (inputs, badges) and `--radius-md: 4px` (buttons, cards). Images have **no radius** (crisp editorial look). Pills only for colour swatches (full circle).
- **Shadows:** none on the public site. Use borders (`--color-line`) instead. Admin may use `shadow-sm` on popovers.
- **Motion (ADR-021, CSS only):** hover/colour transitions 150–250 ms `ease-out`; image `scale-[1.03]` on card hover (desktop only); menu slide-in. Entrance animations `animate-rise` (fade + rise, staggered with `stagger-1..3`) and `animate-settle` (transform only, for the LCP heading/image); scroll reveal `reveal` (CSS scroll timeline, progressive enhancement). All defined in `globals.css` and disabled under `prefers-reduced-motion`. **No** animation libraries, parallax, looping animations, or autoplay sliders, and never fade the LCP element in. **Exception (ADR-048):** the homepage hero slider autoplays with a 1.2 s crossfade and a slow zoom (`animate-hero-zoom`, transform only, off under reduced motion).

## 5. Core components (in `src/components/ui` unless noted)

| Component | Spec |
|---|---|
| **Button** | Variants: `primary` (ink bg, ivory text), `secondary` (transparent, ink 1px border), `ghost` (text only, underline on hover), `whatsapp` (whatsapp-dark bg, white text, WhatsApp icon). Sizes: `md` h-11 px-6, `lg` h-13 px-8. Inter 500, 14–15 px, tracking 0.02em. Focus: 2 px walnut ring with offset. |
| **ProductCard** (`product/`) | Square (1:1) image (ADR-035) on a sand background, title (Inter 500, 15–16 px, 2-line clamp), category (small, muted), price row. Discount: sale-coloured price, struck-through regular price in muted, and a "-15%" badge top-left. "New" badge optional. The whole card is a link. Hover: image scale 1.03 and title underline. |
| **Price** | Formats `৳ 45,500`. Handles regular-only, discounted, and "Price on request". |
| **Badge** | 11–12 px uppercase Inter 500, tracking 0.08em, 2 px radius. Variants: `sale`, `new`, `neutral`. |
| **ColorSwatches** (`product/`) | 28 px circles with a 1 px line border; the selected one gets a 2 px ink ring with offset. The colour name shows next to the label. They're buttons with `aria-pressed`. |
| **Gallery** (`product/`) | Main image 1:1 on mobile, 4:3 on desktop (ADR-035; mobile is full-bleed swipeable via CSS scroll-snap, no library). Thumbnail strip below (desktop: vertical strip left). Click opens a lightweight fullscreen viewer (native `<dialog>`). |
| **SectionHeading** (`site/`) | Eyebrow, then h2, then optional "View all →" link aligned right on desktop. |
| **Input / Textarea / Select** | h-11, 1 px line border, 2 px radius, white surface, walnut focus ring. Labels above (small, ink-soft). |
| **Breadcrumbs** | small, muted, `/` separators, last item ink. |
| **Skeleton** | sand-coloured blocks with a subtle pulse (disabled under reduced motion). |

## 6. Imagery guidelines

- Product photos: shown **square** on cards and mobile gallery, **4:3** in the desktop gallery (centre-cropped), so keep the product centred; at least 1600 px on the long edge, on neutral/lifestyle backgrounds. Consistent lighting matters more than quantity.
- Hero: 16:9 desktop / 4:5 mobile crop (art-directed via two image fields if needed later; v1 uses `object-cover` with a focal point centred).
- Blog covers: 3:2.
- Category tiles: 4:5 with the category name overlaid bottom-left on a subtle dark scrim (`linear-gradient` allowed **only** here, for text legibility).

## 7. Iconography

**Lucide React** only, `strokeWidth={1.5}`, 20 px default (24 px in nav). The WhatsApp brand glyph isn't in Lucide, so use a single inline SVG component `components/site/WhatsAppIcon.tsx`.

## 8. Logo (ADR-022)

The real logo is in use: `src/components/site/Logo.tsx` renders `src/assets/brand/artifex-wordmark.svg` (desktop header: 40 px wordmark in a 64 px bar; mobile header: the **lockup**, the 32 px wordmark followed on the same line by "FURNITURE" in the logo red, bold caps matched to the RTIFEX cap height and baseline, ADR-045) and `artifex-logo.svg` with the "DECOR YOUR DREAMS" tagline (footer, 56 px). Brand red `--color-brand: #D2161E` is for the logo only. Favicons are generated from the "A" mark. Keep clear space of at least half the logo height around it, and never recolour or stretch it.

### Previous text wordmark (retired)

The text wordmark "ARTIFEX" is set in Cormorant Garamond 600, tracking 0.24em, with "FURNITURE" below in Inter 500 at 10 px, tracking 0.32em. Swap in the real SVG logo when it's supplied (PROGRESS open question #3).
