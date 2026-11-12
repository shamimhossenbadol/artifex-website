# Testing Guidelines

Keep testing proportional: **unit-test the logic, end-to-end test the critical flows, and manually check the visuals on devices.**

## 1. Tooling

| Layer | Tool | Location |
|---|---|---|
| Unit | Vitest | `tests/unit/**` |
| End-to-end | Playwright (Chromium + mobile WebKit profile) | `tests/e2e/**` |
| Accessibility | `@axe-core/playwright` (optional dev dep, via ADR) or Lighthouse | e2e |
| Performance | Lighthouse / PageSpeed Insights | manual, results in PROGRESS |

E2E tests run against `next build && next start` with a seeded test database (`DATABASE_URL` pointing to `artifex_test`) that includes the demo catalogue and posts (`SEED_DEMO=true`). CI uses a local MariaDB 11.4 service.

> **Local runs against the remote test DB (SSH tunnel)** are slow on cold pages (2–6 s per page, because every query crosses the tunnel) and can hit the 6 s pool timeout under parallel load, showing "Something went wrong". Use `--workers=1`, re-run single failures, or use a local MariaDB. Warm pages are served from the in-memory cache in ~40 ms. CI is the authority.
>
> "Before JavaScript loads" tests block `/_next/static/chunks/**` (helpers.ts) rather than disabling JavaScript, so the inline scripts that reveal streamed HTML still run (ADR-027).

## 2. Unit tests (required)

| Module | Cases |
|---|---|
| `lib/format.ts` | `formatBDT(125000)` → `৳ 1,25,000`; 0; null → "Price on request" |
| Pricing service | discount % rounding; discount ≥ regular is rejected; discount without regular is rejected |
| `lib/whatsapp.ts` | number sanitising; template placeholders; colour present/absent; `&`, `#`, `?`, emoji, and Bangla encoded; absolute URL |
| Search service | normalisation; multi-term AND; `%`/`_` escaped; ranking order; < 2 chars → empty |
| Slug util | Unicode/Bangla titles fall back to a transliteration or id-based slug; collisions get `-2`, `-3` suffixes |
| Validation schemas | each admin schema: valid sample passes, each invalid field fails |
| Auth | hash/verify; JWT sign/verify/expiry; sessionVersion mismatch is rejected; rate-limit thresholds |
| Image service | rejects non-image buffer; produces 3 variants; strips EXIF |
| Media keys & R2 storage | key generator gives `<folder>/<yyyy>/<mm>/<hash>-<w>.webp`; unknown folder rejected; delete refuses keys that don't match the pattern; put sends `Content-Type: image/webp` + immutable `Cache-Control` (mock `fetch`); a failed variant upload rolls back the ones already uploaded |
| Image loader | picks the nearest variant ≥ requested width (capped at 1600); local `/public` paths pass through unchanged |

## 3. E2E — public

- **Catalogue:** the home page renders all non-empty sections; clicking a category opens the grid; pagination page 2 works; sort by price changes the order; an unknown category returns 404.
- **Product detail:** clicking a gallery thumbnail changes the main image; selecting a colour updates the label; the WhatsApp link `href` contains the product name, colour, and URL (assert the `href`, don't open WhatsApp); related products are shown.
- **Search:** typing "sofa" shows suggestions; Enter → results page; a nonsense query shows the empty state.
- **Blog:** list → post → related links work.
- **Contact:** the map placeholder loads the iframe on click; tel: and WhatsApp links are correct.
- **SEO smoke:** `/sitemap.xml` lists a seeded product; `/robots.txt` disallows `/admin`; the product page contains `application/ld+json` with `"@type":"Product"`.

## 4. E2E — admin

- Login with wrong password → generic error. Six wrong attempts → locked message.
- First login → forced to the change-password page, and other admin URLs redirect back.
- Change password → old sessions are invalid (second browser context gets logged out).
- Create product with 2 images, 2 colours, and 3 specs → publish → appears on the public category page **without a restart** (revalidation works).
- Edit price → the public price updates. Unpublish → the public page returns 404.
- Delete a category with products → blocked with a message.
- Update the WhatsApp number in settings → the floating button `href` updates.
- Access `/admin/products` logged out → redirected to login. A Server Action called without a session → rejected.

## 5. Manual checklist — responsive & visual

Devices/widths: 360 (low-end Android), 390 (iPhone), 768 (iPad portrait), 1024, 1440.
- [ ] No horizontal scroll; rails scroll intentionally
- [ ] Header and mobile drawer behave; focus is trapped in the drawer
- [ ] Product grid columns 2/3/4 at the breakpoints
- [ ] Product page: CTA visible above the fold on mobile; sticky bar appears/disappears correctly
- [ ] Gallery swipe works on touch; fullscreen viewer closes with Esc and the close button
- [ ] Prices: discount styling and "Price on request" render correctly
- [ ] Fonts load without layout shift; images have no CLS
- [ ] Admin forms usable on a 390 px phone (image upload from camera roll works)

## 6. Manual checklist — WhatsApp

- [ ] Android Chrome: opens the WhatsApp app with the message prefilled
- [ ] iOS Safari: opens WhatsApp with the message prefilled
- [ ] Desktop: opens WhatsApp Web / the desktop app
- [ ] The URL in the message is clickable and opens the correct product
- [ ] Facebook in-app browser (users arrive from FB): the link still opens WhatsApp

## 7. Production smoke test (after every deploy)

- [ ] Home, a category, a product, search, a blog post, and contact all load over HTTPS with no console errors
- [ ] An image from `https://media.<domain>` loads with the immutable cache header and `cf-cache-status: HIT` on repeat
- [ ] Upload a new image in admin; it appears publicly. Delete it; its objects are gone from the R2 bucket
- [ ] Admin login works; editing a product title shows up publicly
- [ ] `stderr.log` has no new errors; cPanel Resource Usage has no faults in the last hour
- [ ] Security headers present (`curl -I https://<domain>`)
- [ ] Record the result and date in `PROGRESS.md` → Session log

## 8. Performance acceptance

Lighthouse mobile ≥ 90 on all four categories for home, category, product, and blog post pages. CWV targets per 08 §8. Record the scores in PROGRESS after Phase 6 (local production build) and Phase 9 (live).
