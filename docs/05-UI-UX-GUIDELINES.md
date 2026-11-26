# 05 — UI/UX Guidelines

## 1. Principles

1. **Photography first.** Images take up the majority of the viewport on product and category pages.
2. **One primary action per screen.** On product pages that's *Message on WhatsApp*; elsewhere it's discovery ("Explore sofas").
3. **Mobile first.** Design at 360 px, then enhance. Most visitors arrive from Facebook on phones.
4. **Calm.** No pop-ups, no autoplay (exception: the homepage hero slider, ADR-048), no cookie walls (our own visit counts use no cookies; the optional Meta Pixel sets Meta's `_fbp` cookie, ADR-040).
5. **Fast feedback.** Every action shows a state (loading, success, error) within 100 ms.

## 2. Global navigation

**Desktop header** (h-16, sticky, always compact with a bottom border; it no longer changes size on scroll, owner request 2026-11-13):
`[Logo]   Sofas · Dining · Chairs · Beds · Curtains · Chandeliers   [Search icon] [Phone icon] [WhatsApp button "Inquire"]`
- Category links come from active categories (max 6; extras go under "More"), except those in `HEADER_HIDDEN_CATEGORIES` (`src/config/site.ts`; currently Chairs, ADR-035). After the categories, a thin divider and **Journal · About · Contact**.
- **No top utility bar** (ADR-026): the logo row is the only header row, for a cleaner premium look. Journal, About and Contact sit in the main header row after the categories (ADR-035) and in the mobile menu; the phone number is the phone icon in the header.

**Mobile header** (h-16, sticky): `[Menu]  [Wordmark centred]  [Search]`
- The menu opens a full-height left drawer with categories (each with a small thumbnail), then Blog, About, and Contact, then the phone number, WhatsApp, and Facebook. It traps focus and closes on Esc or backdrop click.

**Footer (compact, ADR-035, ADR-049, ADR-050, ADR-061):** phones show only logo → address → email → social icons, centred and compact (no rule under the logo, 12 px gaps, 24 px padding, 40 px icons; ADR-064), then the © line and developer credit (no description); phone product pages hide the © and credit bar (ADR-071); elsewhere on phones the bar is centred with equal side padding so the floating buttons never cover it (ADR-089, ADR-090). From md: two columns from md: logo (h-11), short description (aboutShort, at most two lines) and social icons; then a one-line address, phone and WhatsApp as rounded pill buttons (44 px tall, from md only: phones have the floating buttons, ADR-050), and the email link when set. Padding `py-8 md:py-10`. A quiet line below with © (left) and the developer credit (right; below © on phones). No category or company links (navigation lives in the header). On phones everything stacks and is centred.

**Floating contact buttons** (bottom-right): Messenger (`messenger` blue, links to `m.me/<page>` from the Facebook URL) above WhatsApp (whatsapp-dark). 44 px circles on phones, 48/56 px from md; on phones they sit above the home indicator (`env(safe-area-inset-bottom)`, `viewportFit: cover`). Messenger and WhatsApp always appear together: the sales team answers on both (ADR-044). Both:
- Shown on all public pages **except** product detail on mobile, whose sticky bottom bar has price, a Messenger button and a WhatsApp button.
- It has an `aria-label` of "Chat with Artifex Furniture on WhatsApp".

## 3. Page layouts

### Home
1. Hero (ADR-048, ADR-049, ADR-089, ADR-090): phones show a photos-only band at the photos' 7:3 shape (about 161 px at 375 px wide, nothing cropped) with no scrim, no buttons and closely spaced dots (24 × 32 px targets) at its foot; the eyebrow, heading and subheading are screen-reader only. From md the photos fill the hero (min-h 78vh) with white text over a solid scrim and the full editorial sizes; dots centred at the bottom of the photo. Several photos play on their own in an endless loop (6 s per photo, 1.2 s crossfade, slow 7 s zoom by transition that doesn't snap back) with no arrows and no pause button; it pauses on hover/focus and in background tabs and doesn't play or zoom under reduced motion. Without photos: a compact text hero.
2. Collections (no visible heading; a screen-reader-only h2 "Collections", ADR-050): category tiles in a 3-column grid on phones and tablets (square tiles, small names), 6 across from lg (4:5 tiles). Categories without a photo show their line icon (`CategoryIcon`).
3. New arrivals (heading only, no eyebrow): rail of 8 cards (mobile horizontal scroll; desktop 4-col grid).
   Then one rail per category that has published products (ADR-072): the category name as title, "View all" to the category, up to 8 cards, same layout; desktop padding 48 px (not 96 px) between stacked rails.
4. Brand introduction: split image/text, with "Our story →". On phones, one centred sand card (logo, walnut rule, eyebrow, heading, text, outlined "Our story" pill), ADR-050.
5. Promo banner(s): 1–2 wide banners (active and in date range). Phones: the image alone at 16:9 (text screen-reader only, ADR-089); from md 2:1 with title, subtitle and link text over a scrim.
6. WhatsApp CTA band: sand background, "Not sure what fits your space? Talk to us." with a WhatsApp button and the phone number. On phones it is an inset sand card inside the container, like the story card (ADR-052).
   Phone spacing (ADR-053, supersedes ADR-052): one 32 px gap between sections (each adds only top padding; sand bands keep 32 px inside); no floating contact buttons on the phone homepage. md+ keeps the larger desktop spacing and the floating buttons.
7. Latest from the journal: 3 blog cards.

The Featured and Most loved rails were removed from the homepage (ADR-035); the Featured flag was then dropped (ADR-042). Popular remains: it ranks search results and related products.
Sections with no content are **hidden**, never left empty.

### Category / All products
- Breadcrumbs, title, short description, and product count. Phones (ADR-089): none of these and no sort bar, just the grid and pagination (the h1 stays for screen readers).
- Toolbar: sort chips (Newest, Price low→high, Price high→low) and an "On sale" toggle, rendered as plain links (ADR-025). Both are URL params so they're shareable, SSR-friendly and work without JavaScript.
- Grid: 2 cols mobile, 3 cols md, 4 cols xl.
- Pagination: numbered links (`?page=2`) with Prev/Next, 24 per page. No infinite scroll (bad for SEO and the back button).

### Product detail
- Mobile order: gallery → title/category → price → WhatsApp CTA → full description → specs → related (no short description or quick facts on the page, ADR-060).
- Desktop: two columns (gallery 7/12, info 5/12, info column sticky).
- Info block: breadcrumbs from md only (hidden on phones, JSON-LD kept; ADR-065; they name the category, no separate category eyebrow), title (h1), price (or, with no price, the custom-quote card, ADR-063), "Made to order" badge on its own line with its note below (priced products only), **WhatsApp and Messenger buttons (full width, lg)**, a secondary "Call us" link. Nothing follows the buttons in the info block (ADR-060).
- Phones: the gallery starts directly under the header (no top padding) and runs edge to edge.
- Below: tabs or stacked sections for *Description* and *Specifications* (stacked on mobile, no tabs; tabs are allowed on desktop).
- Related products: 4 from the same category (excluding the current one), falling back to popular, under the heading "You may also like" (ADR-061).
- Below the info block (ADR-061, ADR-068): phones have 24 px above and below the rule, 24 px before Specifications and 24 px before related products; from md 48 px above the rule, 40 px below, related 56 px below. The full description starts right under the rule (no visible heading), specs beside it on desktop. On phone product pages the footer has extra bottom padding so the fixed price/contact bar never covers it. With a single photo the gallery has no thumbnail column.
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
- Colour isn't the only signal: discount uses colour **and** strike-through **and** the badge text.
- Gallery: thumbnails are buttons with `aria-label="View image 3 of 6"`, and the arrow keys work in the viewer.
- Forms (admin): labels tied to inputs, errors linked via `aria-describedby`, and errors announced with `aria-live`.
- Respect `prefers-reduced-motion`.

## 6. Responsive checkpoints

Test at 360, 390, 768, 1024, 1280, and 1440 px. No horizontal scroll at any width (intentional scroll rails excepted). Images use `sizes` that match the grid (see 08 §3).

**Mobile rules (ADR-044):**
- Every horizontal scroll row is `relative`, so absolutely positioned children (sr-only text, badges) stay inside it. The e2e check compares `scrollWidth` with `clientWidth` (not `innerWidth`, which grows with overflow on phones).
- Section padding `py-12` on phones, `md:py-24` from md; section headings keep "View all" on the title's row.
- Button groups stack full width on phones (`flex-col` + `w-full sm:w-auto`); WhatsApp and Messenger sit side by side in meaning, stacked in layout.
- Swipe rows on phones: category tiles, product rails, the homepage journal (80% cards with the next one peeking). Lists of posts on /blog become compact rows (photo left, text right).
- The header logo is preloaded and shown immediately (no entrance animation).

**Breadcrumbs on phones (ADR-089):** hidden on every public page below md (`hideOnPhones`); breadcrumb JSON-LD stays. The admin keeps them.

**Journal images (ADR-090):** article covers and journal cards use 16:9 frames with the whole photo shown (`object-contain` on sand). The homepage Journal section has the one-line title "Journal".
