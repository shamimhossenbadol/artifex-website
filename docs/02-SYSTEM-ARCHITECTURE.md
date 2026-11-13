# 02 — System Architecture

## 1. High-level view

```
Browser ──HTTPS──▶ Apache (cPanel, LiteSpeed/Apache) ──▶ Phusion Passenger ──▶ Node.js (1 process)
                                                                         │
                                                         Next.js standalone server.js
                                                         ├── Server Components (public pages, SSG/ISR)
                                                         ├── Server Actions (admin mutations)
                                                         ├── Route Handlers (/api/search, /api/track, sitemap, robots)
                                                         ├── Prisma Client (JS driver adapter, no Rust engine)
                                                         │          │
                                                         │   MySQL / MariaDB (cPanel)
                                                         │
                                                         └── Admin image upload: sharp → WebP variants ──PUT (aws4fetch)──▶ Cloudflare R2 bucket

Browser ──HTTPS──▶ https://media.<domain> (R2 custom domain, Cloudflare CDN) ──▶ R2 bucket   ← all images; never touches the shared host
```

- **One Node process.** Shared hosting counts each process against entry-process and memory limits, so there's no clustering and no background workers.
- **Rendering:** Public pages are statically generated and cached, then revalidated **on demand** when the admin saves (tags). There's a time-based fallback of 1 hour.
- **Admin:** Dynamic, server-rendered, never cached.

## 2. Folder structure (planned)

```
E:\ArtifexFurniture\Website\      # repo root (git)
├─ .github/workflows/            # ci.yml (every push/PR), deploy.yml (manual, ADR-016/017)
├─ prisma.config.ts              # Prisma 7 CLI config (connection URL, seed command)
├─ AGENTS.md  PROGRESS.md  DECISIONS.md  CHANGELOG.md  README.md
├─ docs/                         # project documentation (this folder)
│  └─ features/                  # per-feature deep dives (created as needed)
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts                    # categories, settings, admin user, demo products
├─ public/                       # static assets shipped with the build (logo, og-default, icons)
├─ scripts/
│  ├─ admin-reset-password.ts    # CLI password reset (run over SSH)
│  ├─ package-standalone.mjs     # assembles the deploy bundle (deploy/artifex-app + .tar.gz)
│  └─ ci-db-backup.mjs           # CI: gzipped mariadb-dump through the SSH tunnel
├─ src/
│  ├─ app/
│  │  ├─ (site)/                 # public route group, shares the site layout
│  │  │  ├─ layout.tsx           # header, footer, floating WhatsApp
│  │  │  ├─ page.tsx             # Home
│  │  │  ├─ products/page.tsx            # All products (paginated)
│  │  │  ├─ products/[slug]/page.tsx     # Product detail
│  │  │  ├─ categories/[slug]/page.tsx   # Category listing (paginated)
│  │  │  ├─ search/page.tsx
│  │  │  ├─ blog/page.tsx
│  │  │  ├─ blog/[slug]/page.tsx
│  │  │  ├─ about/page.tsx
│  │  │  └─ contact/page.tsx
│  │  ├─ admin/
│  │  │  ├─ login/page.tsx
│  │  │  └─ (panel)/             # protected route group, shares the admin layout
│  │  │     ├─ page.tsx          # Dashboard overview
│  │  │     ├─ products/…        # list, new, [id]/edit
│  │  │     ├─ categories/…
│  │  │     ├─ blog/…
│  │  │     ├─ homepage/…        # hero, promo banners, featured selections
│  │  │     ├─ settings/…        # contact, WhatsApp, location, SEO defaults
│  │  │     └─ account/…         # change password
│  │  ├─ api/
│  │  │  ├─ search/route.ts      # GET instant-search suggestions
│  │  │  └─ track/route.ts       # optional: WhatsApp click counter (Phase 8)
│  │  ├─ sitemap.ts  robots.ts
│  │  ├─ not-found.tsx  error.tsx  global-error.tsx
│  │  └─ layout.tsx              # root html, fonts, globals.css
│  ├─ components/
│  │  ├─ ui/                     # primitives: Button, Container, Badge, Input, Price, Skeleton…
│  │  ├─ site/                   # Header, Footer, MobileNav, WhatsAppFab, Breadcrumbs, SectionHeading
│  │  ├─ product/                # ProductCard, ProductGrid, Gallery, ColorSwatches, SpecsTable, WhatsAppInquiry
│  │  ├─ blog/                   # PostCard, PostBody (markdown)
│  │  └─ admin/                  # AdminShell, DataTable, ImageUploader, FormField, ConfirmDialog
│  ├─ server/
│  │  ├─ repositories/           # ONLY place that imports Prisma: product.repo.ts, category.repo.ts…
│  │  ├─ services/               # business logic + caching: catalog.service.ts, blog.service.ts, settings.service.ts
│  │  ├─ actions/                # "use server" admin mutations: product.actions.ts…
│  │  └─ media/                  # image.processor.ts (sharp), r2.storage.ts (aws4fetch put/delete/presign), keys.ts
│  ├─ lib/
│  │  ├─ db.ts                   # Prisma singleton for the app (lazy, pool of 3)
│  │  ├─ prisma.ts               # env-free client factory with the MariaDB driver adapter
│  │  ├─ env.ts                  # Zod-validated process.env
│  │  ├─ auth/                   # session (jose), password (bcryptjs), requireAdmin(), rate limit
│  │  ├─ validation/             # Zod schemas shared by forms and actions
│  │  ├─ seo.ts                  # metadata builders + JSON-LD builders
│  │  ├─ whatsapp.ts             # buildWhatsAppUrl()
│  │  ├─ image-loader.ts         # custom next/image loader ("use client") → pre-generated variants
│  │  ├─ image-variants.ts       # variant widths + buildImageUrl() shared by client and server
│  │  ├─ search-text.ts          # buildSearchText(), effectivePrice() for product writes
│  │  ├─ format.ts               # formatBDT(), dates
│  │  └─ utils.ts                # cn(), slugify()
│  ├─ config/site.ts             # static constants (nav links, page sizes)
│  ├─ styles/globals.css         # Tailwind + design tokens
│  ├─ generated/prisma/          # Prisma client (git-ignored, built by `prisma generate`)
│  ├─ instrumentation.ts         # validates env at server start, exits on error
│  └─ proxy.ts                   # coarse /admin redirect only; real check is requireAdmin() (ADR-018)
├─ tests/ (unit/, e2e/)
├─ next.config.ts  tailwind/postcss config  tsconfig.json  eslint.config.mjs
└─ .env.example
```

## 3. Layer responsibilities

| Layer | May import | Must not |
|---|---|---|
| `app/**/page.tsx`, components | services, lib (non-db), components | Prisma, repositories |
| `server/actions` | `requireAdmin`, validation, services, `revalidateTag` | UI |
| `server/services` | repositories, cache APIs, lib | React |
| `server/repositories` | `lib/db` (Prisma) | cache APIs, auth |
| `lib/*` | other lib | app, server |

**Data flow (read):** `page.tsx` → `catalog.service.getProductBySlug(slug)` (cached, tagged `product:<slug>`, `products`) → `product.repo.findPublishedBySlug` → Prisma.

**Data flow (write):** Admin form (client) → Server Action `updateProduct(formData)` → `requireAdmin()` → Zod parse → `catalog.service.updateProduct()` → repo → `revalidateTag('products')`, `revalidateTag('product:<slug>')` → `redirect`/return state.

## 4. Routes & URL scheme

| URL | Rendering | Notes |
|---|---|---|
| `/` | Static + tags | Home |
| `/products?page=&sort=` | Static first page; dynamic for params | All products |
| `/categories/[slug]?page=&sort=` | `generateStaticParams` for categories | Category listing |
| `/products/[slug]` | `generateStaticParams` (published) + on-demand | Product detail |
| `/search?q=&page=` | Dynamic (`noindex`) | Full results page |
| `/blog`, `/blog/[slug]` | Static + tags | |
| `/about`, `/contact` | Static + tags | Contact info comes from settings |
| `/admin/**` | Dynamic, `noindex`, no cache | |
| `/api/search?q=` | Dynamic, short `Cache-Control` | Max 8 suggestions |
| `/api/track` (POST) | Dynamic, `no-store` | Anonymous visit/click beacon, same-origin only, 204 (ADR-040) |
| `https://media.<domain>/<key>` | Served by Cloudflare R2, not by our app | `Cache-Control: public, max-age=31536000, immutable` is set on each object at upload (keys are content-hashed) |
| `/sitemap.xml`, `/robots.txt` | Generated | |

Slugs are unique per entity. Changing a slug in admin shows a warning (old links break). A redirect table is a future item.

## 5. Images pipeline

1. The admin uploads JPEG/PNG/WebP (≤ 10 MB each, up to 12 per product).
2. The server action validates the MIME type and magic bytes with `sharp().metadata()`, rotates using EXIF, then **strips metadata**.
3. It generates WebP variants at widths **480, 960, and 1600** (quality ~78) in memory.
4. It uploads each variant to **Cloudflare R2** (`server/media/r2.storage.ts`, S3-compatible API signed with `aws4fetch`). The key is `<folder>/<yyyy>/<mm>/<hash>-<w>.webp`, where folder is `products`, `categories`, `blog`, `home` or `site`. Each object gets the headers `Content-Type: image/webp` and `Cache-Control: public, max-age=31536000, immutable`. Uploads run one after another so only one buffer is held in memory at a time.
5. Only after all three variants have uploaded does it save the `ProductImage` row (key base, width, height, alt, sortOrder, isPrimary). If any upload fails, it deletes the variants that did upload and returns an error.
6. The front end uses `next/image` with a **custom loader** (`lib/image-loader.ts`) that builds `${NEXT_PUBLIC_MEDIA_URL}/<keyBase>-<nearestWidth>.webp`. That means **no runtime image optimisation**: images go straight from Cloudflare's CDN to the visitor and never touch the shared host.
7. Deleting an image deletes its three objects from R2 after the DB delete succeeds. If that fails, it's logged and the orphaned objects are left behind; a cleanup script for them is a future item.
8. Static brand images in `/public` (logo, favicon, default OG image) ship with the build and go through the loader's local-path branch, which returns the path unchanged.

**Environments:** development uses the `artifex-media-dev` bucket (its `r2.dev` URL is fine for this) and production uses `artifex-media` behind `https://media.<domain>`. Never point development at the production bucket.

## 6. Caching strategy (summary — details in 08)

- Service functions use `"use cache"` + `cacheTag()` + `cacheLife()` (ADR-018), behind a request-time wrapper that calls `connection()` first, so nothing is read from the database during `next build` (ADR-020). DB-backed components render inside `<Suspense>` with a same-size fallback.
- Tags: `settings`, `categories`, `products`, `product:<slug>`, `home`, `blog`, `post:<slug>`.
- Admin actions revalidate the relevant tags. Because there's a single process, the default filesystem/in-memory cache is enough, with no external cache handler.

## 7. Configuration & environment variables

| Var | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `mysql://user:pass@localhost:3306/artifex` | Prisma connection |
| `AUTH_SECRET` | 64 random chars | Signs the admin session JWT |
| `ADMIN_EMAIL` | `admin@artifexfurniture.com` | Seed: predefined admin |
| `ADMIN_INITIAL_PASSWORD` | strong temporary | Seed only; forced change on first login |
| `NEXT_PUBLIC_SITE_URL` | `https://artifexfurniture.com` | Canonical URLs, sitemap, WhatsApp links |
| `R2_ACCOUNT_ID` | `abc123…` | Cloudflare account ID (endpoint `https://<id>.r2.cloudflarestorage.com`) |
| `R2_ACCESS_KEY_ID` | — | R2 API token, *Object Read & Write* on this bucket only |
| `R2_SECRET_ACCESS_KEY` | — | Secret for the token above |
| `R2_BUCKET` | `artifex-media` / `artifex-media-dev` | Bucket name per environment |
| `NEXT_PUBLIC_MEDIA_URL` | `https://media.artifexfurniture.com` | Public base URL for images. It's inlined at **build time** because client components need it too |
| `NODE_ENV` | `production` | |

All are validated at boot (`src/instrumentation.ts` → `src/lib/env.ts`); the app exits if a required one is missing. `ADMIN_*` are seed-only, and `R2_*` are optional until Phase 3 (ADR-018). Commit `.env.example` and never commit `.env`.
