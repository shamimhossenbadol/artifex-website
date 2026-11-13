# 05 — UI/UX Guidelines

## 1. Principles

1. **Photography first.** Images take up the majority of the viewport on product and category pages.
2. **One primary action per screen.** On product pages that's *Message on WhatsApp*; elsewhere it's discovery ("Explore sofas").
3. **Mobile first.** Design at 360 px, then enhance. Most visitors arrive from Facebook on phones.
4. **Calm.** No pop-ups, no autoplay, no cookie walls (our own visit counts use no cookies; the optional Meta Pixel sets Meta's `_fbp` cookie, ADR-040).
5. **Fast feedback.** Every action shows a state (loading, success, error) within 100 ms.

## 2. Global navigation

**Desktop header** (h-20, sticky; it shrinks to h-16 with a bottom border after scrolling):
`[Logo]   Sofas · Dining · Chairs · Beds · Curtains · Chandeliers   [Search icon] [Phone icon] [WhatsApp button "Inquire"]`
- Category links come from active categories (max 6; extras go under "More"), except those in `HEADER_HIDDEN_CATEGORIES` (`src/config/site.ts`; currently Chairs, ADR-035). After the categories, a thin divider and **Journal · About · Contact**.
- **No top utility bar** (ADR-026): the logo row is the only header row, for a cleaner premium look. Journal, About and Contact sit in the main header row after the categories (ADR-035) and in the mobile menu; the phone number is the phone icon in the header.

**Mobile header** (h-16, sticky): `[Menu]  [Wordmark centred]  [Search]`
- The menu opens a full-height left drawer with categories (each with a small thumbnail), then Blog, About, and Contact, then the phone number, WhatsApp, and Facebook. It traps focus and closes on Esc or backdrop click.

**Footer (compact, ADR-035):** two columns: logo, short description (aboutShort) and social icons; then address, phone, WhatsApp (and email when set). A quiet © line below. No category or company links (navigation lives in the header). Stacks on mobile.

**Floating contact buttons** (bottom-right): Messenger (48 px circle, `messenger` blue, links to `m.me/<page>` from the Facebook URL) above WhatsApp (56 px circle, whatsapp-dark). Both:
- Shown on all public pages **except** product detail on mobile, which has its own sticky bottom bar.
- It has an `aria-label` of "Chat with Artifex Furniture on WhatsApp".

## 3. Page layouts

### Home
1. Hero: full-bleed image (min-h 60svh mobile / 68vh desktop), heading, subheading, and two CTAs ("Explore collection", "Visit showroom"). With several photos the background is a slider the visitor controls (arrows, dots, swipe; never autoplay); the text stays put (ADR-039).
2. Collections (heading "Collections", no eyebrow): category tiles (mobile: horizontal scroll-snap row with partial next-tile peek; desktop: grid of 4 + 3 or 7-across).
3. New arrivals (heading only, no eyebrow): rail of 8 cards (mobile horizontal scroll; desktop 4-col grid).
4. Brand introduction: split image/text, with "Our story →".
5. Promo banner(s): 1–2 wide banners (active and in date range).
6. WhatsApp CTA band: sand background, "Not sure what fits your space? Talk to us." with a WhatsApp button and the phone number.
7. Latest from the journal: 3 blog cards.

The Featured and Most loved rails were removed from the homepage (ADR-035); the Featured flag was then dropped (ADR-042). Popular remains: it ranks search results and related products.
Sections with no content are **hidden**, never left empty.

### Category / All products
- Breadcrumbs, title, short description, and product count.
- Toolbar: sort chips (Newest, Price low→high, Price high→low) and an "On sale" toggle, rendered as plain links (ADR-025). Both are URL params so they're shareable, SSR-friendly and work without JavaScript.
- Grid: 2 cols mobile, 3 cols md, 4 cols xl.
- Pagination: numbered links (`?page=2`) with Prev/Next, 24 per page. No infinite scroll (bad for SEO and the back button).

### Product detail
- Mobile order: gallery → title/category → price → colours → WhatsApp CTA → short description → specs → full description → related.
- Desktop: two columns (gallery 7/12, info 5/12, info column sticky).
- Info block: breadcrumbs, category eyebrow, title (h1), price, "Made to order" note if flagged, colour swatches, **WhatsApp button (full width, lg)**, a secondary "Call us" link, short description, then quick facts (material, dimensions).
- Below: tabs or stacked sections for *Description* and *Specifications* (stacked on mobile, no tabs; tabs are allowed on desktop).
- Related products: 4 from the same category (excluding the current one), falling back to popular.
- Mobile sticky bottom bar (appears after the main CTA scrolls out of view): price and a "WhatsApp" button.

### Search
- The header search icon opens a top overlay with an input (autofocus). Instant suggestions appear after 2 characters (debounced 250 ms): up to 6 products (thumb, title, price) and matching categories. Enter goes to `/search?q=`.
- The results page shows the same grid as the category page, plus a "No results" state with category shortcuts and a WhatsApp prompt ("Can't find it? Ask us").

### Blog
- List: featured (latest) post large, then a 3-col grid (1 col mobile). Paginated at 9 per page.
- Detail: cover image (3:2), title, author · date · reading time, prose at `max-w-prose` with the serif h2/h3 style, share links (Facebook, WhatsApp, copy link), 3 related posts.

### Contact & Location
- Two columns: the left has the address, phone (tel:), WhatsApp, email, opening hours table, and a "Get directions" button. The right is the Google Map embed (lazy-loaded; see 08).
- No contact form in v1 (WhatsApp/phone are the channels), which avoids spam handling.

### About
- Story (Markdown from settings), craftsmanship values (3 short points with icons), showroom image, and a CTA.

## 4. States

| State | Treatment |
|---|---|
| Loading (route) | `loading.tsx` with skeleton cards matching the layout (no spinners on the public site) |
| Empty listing | Friendly message, links to other categories, WhatsApp prompt |
| 404 | Branded page with search and category links |
| Error | `error.tsx`: "Something went wrong" with Retry and Home buttons; the error is logged server-side |
| Image missing | Sand placeholder with the wordmark mark |

## 5. Accessibility (WCAG 2.2 AA)

- Semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, and heading order without skipped levels.
- Every image has meaningful `alt` (the admin is required to provide it; it defaults to the product title + "– view n").
- Focus is visible everywhere (walnut ring). There's a skip-to-content link, and tap targets are ≥ 44×44 px.
- Colour isn't the only signal: discount uses colour **and** strike-through **and** the badge text; swatches have text names.
- Gallery: thumbnails are buttons with `aria-label="View image 3 of 6"`, and the arrow keys work in the viewer.
- Forms (admin): labels tied to inputs, errors linked via `aria-describedby`, and errors announced with `aria-live`.
- Respect `prefers-reduced-motion`.

## 6. Responsive checkpoints

Test at 360, 390, 768, 1024, 1280, and 1440 px. No horizontal scroll at any width (intentional scroll rails excepted). Images use `sizes` that match the grid (see 08 §3).
