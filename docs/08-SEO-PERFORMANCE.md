# 08 — SEO & Performance

## 1. Metadata

- Root `layout.tsx` sets `metadataBase = NEXT_PUBLIC_SITE_URL`, a title template `%s | Artifex Furniture`, the default description from settings, the default OG image, `lang="en"`, and `themeColor` `#F8F6F2`.
- Each page uses `generateMetadata` (built with helpers in `lib/seo.ts`):

| Page | Title | Description | OG |
|---|---|---|---|
| Home | defaultSeoTitle | defaultSeoDescription | og default |
| Category | `seoTitle ?? "{Name} — Premium {name} in Dhaka"` | `seoDescription ?? description` | category image |
| Product | `seoTitle ?? "{Title} — {Category}"` | `seoDescription ?? shortDescription` | primary image (1600 variant), `og:type=website` |
| Blog post | `seoTitle ?? title` | `seoDescription ?? excerpt` | cover, `og:type=article`, `article:published_time` |
| Search, admin | — | — | `robots: { index: false }` |

- Canonical URL on every indexable page, without `page=1`, sort, or filter params. Paginated pages are self-canonical (`?page=2`).

## 2. Structured data (JSON-LD)

Rendered by a `<JsonLd data={…} />` component (`JSON.stringify` with `<` escaped as `<`).
- **Organization + WebSite** (home): name, logo, sameAs (Facebook, Instagram), plus `SearchAction` → `/search?q={search_term_string}`.
- **FurnitureStore** (LocalBusiness) on home + contact: address, geo, telephone, openingHoursSpecification, url, image.
- **Product** (detail): name, image[], description, sku, brand "Artifex Furniture", category, `offers` { priceCurrency `BDT`, price (effective), availability `InStock` (or `PreOrder` if made to order), url }. When the price is on request, omit `offers`.
- **BreadcrumbList** on category, product, and blog post pages.
- **Article / BlogPosting** on posts: headline, image, datePublished, dateModified, author { name }, publisher.

## 3. Images

- A custom `next/image` loader serves pre-generated WebP variants (480/960/1600) from **Cloudflare R2** via `https://media.<domain>`. See 02 §5 and ADR-014. Images come from Cloudflare's CDN, so they cost nothing on the shared host.
- Add `<link rel="preconnect" href={NEXT_PUBLIC_MEDIA_URL} crossOrigin="">` in the root layout so the LCP image connection starts early.
- `sizes` attributes:
  - Product grid card: `(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw`
  - Product gallery main: `(min-width:1024px) 58vw, 100vw`
  - Hero: `100vw`
  - Blog card: `(min-width:1024px) 33vw, 100vw`
- `priority` only on the LCP image (hero, product main image, or first blog cover). Everything else is lazy.
- Always pass `width`/`height` (stored in the DB) so there's zero CLS. Use a sand background as the placeholder.

## 4. Fonts & CSS & JS

- `next/font` self-hosts the fonts (no Google request at runtime), with `display: swap` and only the weights listed in 03.
- Tailwind purges automatically, with a target of < 25 KB CSS gzipped.
- **Client JS budget:** < 90 KB gzipped on public pages beyond the framework. Client components are limited to: MobileNav, SearchOverlay, Gallery, ColorSwatches + WhatsApp button (selected colour state), the sticky bar, OpeningStatus, and MapLoader. Nothing else.
- No analytics scripts by default. If wanted later, add Plausible-style cookieless analytics via an ADR.

## 5. Caching & revalidation

| Content | Strategy |
|---|---|
| Public pages | Static/ISR. Data functions are cached with tags (02 §6) and a `revalidate` fallback of 3600 s |
| Admin edits | `revalidateTag()` per map in 07 §5. Changes appear on the next request |
| Images on R2 (`media.<domain>`) | `Cache-Control: public, max-age=31536000, immutable`, set as object metadata at upload. Keys are content-hashed, so a new upload means a new key and no purge is ever needed |
| `/_next/static/*` | Immutable (Next default) |
| `/api/search` | `public, max-age=60` |
| HTML | Next defaults (`s-maxage` for ISR). The domain's DNS is on Cloudflare (for R2). The main site's DNS record starts as **DNS only (grey cloud)**; turning on the proxy (orange cloud) is a later, separately tested step (10 §6) |

Enable gzip/brotli: Apache `mod_deflate` via `.htaccess`, if Passenger doesn't already compress. Next's `compress: true` is the fallback.

## 6. Database efficiency

- Card queries `select` only the needed fields plus the primary image (`images: { where: { isPrimary: true }, take: 1 }`).
- Count and list run in one `$transaction([count, findMany])`.
- No N+1: the related products and home rails each run a single query.
- Prisma client singleton (`globalThis` in dev) with a connection limit of **5** (shared MySQL has low max user connections). Set it in the adapter pool config.

## 7. Sitemap & robots

- `app/sitemap.ts`: home, about, contact, blog index, active categories, published products (`lastModified = updatedAt`), and published posts. A single sitemap is fine (< 50k URLs).
- `app/robots.ts`: allow `/`, disallow `/admin`, `/api`, `/search`, and point to the sitemap.

## 8. Core Web Vitals targets (mobile, 4G)

| Metric | Target |
|---|---|
| LCP | < 2.0 s (budget 2.5 s) |
| CLS | < 0.05 |
| INP | < 200 ms |
| TTFB (cached page) | < 400 ms |
| Page weight (home, first load) | < 1.2 MB incl. images |
Check with Lighthouse (mobile) and PageSpeed Insights after deploy. Record the results in `PROGRESS.md`.
