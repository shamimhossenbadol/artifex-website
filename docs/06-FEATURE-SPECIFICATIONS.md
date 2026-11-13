# 06 — Feature Specifications

Each feature lists its **behaviour**, **data source**, and **acceptance criteria (AC)**. Layout details are in `05-UI-UX-GUIDELINES.md`.

---

## F1. Product catalogue

### F1.1 Product listing (all products & category)
- Source: `catalog.service.listProducts({ categorySlug?, page, sort, onSale })`. It returns cards plus `total` and `pageCount`.
- Only `PUBLISHED` products in **active** categories are listed.
- Sort: `newest` (default, `publishedAt desc`), `price_asc`, `price_desc`. Price sort uses the effective price (`discountPrice ?? regularPrice`). Products with "Price on request" go last.
- `onSale=1` means `discountPrice IS NOT NULL`.
- Page size is 24. An invalid `page` returns 404, and `page=1` canonicalises to no param.
- **AC:** an unknown category slug renders the not-found page with `noindex` (HTTP status 200 under Cache Components, ADR-025), pagination links are crawlable `<a href>`, and the result is correct with 0, 1, 24, and 25 items.

### F1.2 Product detail
- Source: `catalog.service.getProductBySlug(slug)` (published only; drafts are visible to a logged-in admin via `?preview=1`).
- Shows: gallery (primary image first, then by `sortOrder`), title, category link, price (see F1.3), colours, made-to-order note, WhatsApp CTA (F3), short description, quick facts, specs table, full description (Markdown), and related products.
- **AC:** a missing or unpublished slug renders the not-found page with `noindex` (ADR-025), the gallery works with 1–12 images, and the page has Product JSON-LD (see 08).
- `?preview=1`: a signed-in admin sees drafts (and products in hidden categories), uncached, with a "Preview" banner and `noindex`; anyone else gets the normal page (ADR-037). Blog posts work the same way.

### F1.3 Pricing display rules
| Data | Display |
|---|---|
| `regularPrice` only | `৳ 45,500` |
| `regularPrice` + `discountPrice` | **`৳ 38,675`** (sale colour), then `৳ 45,500` struck through, then badge `-15%` |
| `regularPrice = null` | "Price on request" with WhatsApp emphasised |
Format: `Intl.NumberFormat('en-IN')` grouping with the `৳` prefix (BD uses lakh grouping, e.g. `৳ 1,25,000`).

### F1.4 Colours
- Optional. When present, swatches are shown. Selecting one updates the label "Colour: Walnut Brown" and **includes the colour in the WhatsApp message**. No image switching per colour in v1 (future item).

### F1.5 Image gallery
- Implemented without a carousel library: CSS scroll-snap on mobile (swipe), thumbnail click on desktop, keyboard arrows, and a native `<dialog>` fullscreen viewer with a 1600 px variant.
- The first image uses `priority` (LCP); the rest are lazy.

### F1.6 Related products
- Up to 4 published products from the same category, ordered by `isPopular desc, publishedAt desc`, excluding the current one. If there are fewer than 4, it fills with popular products from any category.

---

## F2. Global search

- **Instant search:** `GET /api/search?q=` (Zod: 2–60 chars, trimmed). Returns `{ products: [{title, slug, price, discountPrice, image}], categories: [{name, slug}] }` with max 6 products and 3 categories. Response `Cache-Control: public, max-age=60`.
- **Results page:** `/search?q=&page=`, using the same card grid, 24 per page, `noindex`.
- **Matching:** the query is normalised (lowercase, collapsed whitespace) and split into terms, up to 5. A product matches if **every** term is found in `searchText` (`AND` of `LIKE %term%`). `searchText` contains the title, category name, keywords, material, and colour names.
- **Ranking:** title starts with the query > title contains the query > other matches; ties go by `isPopular`, then newest. Done in the service after fetching ≤ 200 candidates (fine at catalogue scale).
- The client debounces 250 ms and aborts previous requests (`AbortController`). Keyboard: ↑/↓ to move, Enter to open, Esc to close.
- **AC:** "sofa" finds all sofas, "walnut bed" finds beds with walnut material/colour, SQL wildcard characters (`%`, `_`) in the input are escaped, and an empty or 1-character query shows no request.

---

## F3. WhatsApp inquiry

- Helper: `lib/whatsapp.ts → buildWhatsAppUrl({ number, message })` returns `https://wa.me/<digits>?text=<encodeURIComponent(message)>`.
- The number comes from `SiteSetting.whatsappNumber` (digits only, international format, e.g. `8801XXXXXXXXX`; validated by `^8801[3-9]\d{8}$` or a general E.164 digits pattern).
- **Product message** from `whatsappProductTemplate`, with placeholders `{business}`, `{product}`, `{color}`, `{price}`, `{url}`. Default:
  > Hello Artifex Furniture, I'm interested in **{product}**{color}. Could you share more details?\n{url}
  `{color}` renders as ` (Colour: Walnut Brown)` when a colour is selected, otherwise empty. `{url}` is the absolute canonical product URL.
- **General message** (`whatsappDefaultMessage`), used by the floating button, home CTA, and contact page: "Hello Artifex Furniture, I'd like to know more about your furniture."
- Links open with `target="_blank" rel="noopener noreferrer"`. On mobile `wa.me` opens the app, and on desktop it opens WhatsApp Web.
- Optional (Phase 8): fire `navigator.sendBeacon('/api/track', {source, productId})` on click so the admin dashboard can show "Top inquired products". It's anonymous, with no cookies.
- **AC:** the message includes the product name, the selected colour, and a full URL; special characters (`&`, `#`, Bangla text) are encoded correctly; and the link works on Android, iOS, and desktop.

---

## F4. Blog (Journal)

- List `/blog` (9 per page) and detail `/blog/[slug]`. Published only, ordered by `publishedAt desc`.
- Content is Markdown rendered with `react-markdown` + `remark-gfm` (tables, lists). **No raw HTML.** Images inside posts come from uploaded media (the admin inserts them via an "Insert image" helper that uploads and inserts `![alt](url)`).
- Reading time = words / 200, rounded up.
- Related: up to 3 posts sharing a tag, falling back to the latest.
- Article JSON-LD and Open Graph `article` (see 08).
- Suggested launch topics: "How to choose the right sofa size for a Dhaka flat", "Caring for solid wood furniture in humid weather", "Dining tables: 4, 6 or 8 seater?", "Choosing curtains that keep rooms cool", "How to size a chandelier for your living or dining room".

---

## F5. Contact & Location

- Data comes from `SiteSetting` (cached, tag `settings`).
- Google Map: an `<iframe>` with `src = mapEmbedUrl` (admin-entered and validated to begin with `https://www.google.com/maps/embed`). It shows a "Tap to load the map" placeholder **on every device** and only loads the iframe on click (saves ~500 KB; ADR-028). Without an embed URL, an "Open in Google Maps" card is shown.
- "Get directions" uses `mapLinkUrl` (default: Google Maps directions to the Artifex Furniture place, `https://www.google.com/maps/dir//Artifex+Furniture,+House+02+Road-05,+Dhaka+1230`), or falls back to `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>`.
- Opening hours come from JSON and render as a table. The "Open now / Closed now" indicator is computed on the client in the `Asia/Dhaka` timezone (avoids caching issues).
- "Message us on Facebook": `facebookUrl` mapped to a Messenger link (`https://m.me/<page>`, `src/lib/messenger.ts`); URLs that can't be mapped link to the page itself. Hidden when no Facebook URL is set.
- LocalBusiness (`FurnitureStore`) JSON-LD.

---

## F6. Homepage content

- Hero (singleton text over up to 5 slide photos in a manual slider, ADR-039), promo banners (active and within `startsAt`–`endsAt`, max 2 shown), categories with `showOnHome`, and rails for new arrivals (flagged, or newest if none are flagged), featured, and popular (each max 8, ordered by `homeSortOrder`), plus the latest 3 posts.
- All of it is managed in admin (07). The whole home page is cached under tags `home`, `products`, `categories`, `blog`, and `settings`.

---

## F7. About page

Content comes from `SiteSetting.aboutContent` (Markdown), plus fixed values blocks and showroom info.
