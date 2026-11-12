# DECISIONS.md — Architecture Decision Records

Format: each ADR has a number, date, status (Accepted / Superseded by ADR-x / Proposed), context, decision, and consequences.
**Never edit an accepted decision's meaning.** Add a new ADR that supersedes it.

---

### ADR-001 — Catalogue + WhatsApp inquiry, not e-commerce
**Date:** 2026-11-10 · **Status:** Accepted
**Context:** Customers in Bangladesh buy furniture after conversation (custom sizes, delivery, negotiation), mostly via WhatsApp/Messenger. Payments and orders add cost, compliance, and maintenance.
**Decision:** No cart, checkout, payments, customer accounts, or orders. Every product leads to a pre-filled WhatsApp message.
**Consequences:** Much simpler data model and security surface. The business loses online order tracking, which is acceptable for its sales process.

### ADR-002 — Next.js App Router, standalone output, single Node process on Passenger
**Date:** 2026-11-10 · **Status:** Accepted
**Context:** It must run on Namecheap shared hosting (cPanel "Setup Node.js App" = Phusion Passenger under CloudLinux limits on RAM and entry processes).
**Decision:** Use `output: "standalone"`, with its `server.js` as the Passenger startup file. Build on Linux (WSL/CI) and upload the bundle, never building on the server. One process, no workers or cron.
**Consequences:** Deploys are zip uploads plus a restart. Native modules must be Linux builds. The exact Next.js version is pinned at scaffold time (Phase 1) and recorded here.

### ADR-003 — MySQL/MariaDB via cPanel
**Date:** 2026-11-10 · **Status:** Accepted
**Context:** cPanel provides MySQL/MariaDB for free on the plan. The data is relational (products ↔ categories ↔ images). MongoDB isn't available on shared hosting.
**Decision:** Use MySQL/MariaDB with utf8mb4.
**Consequences:** Standard backups via phpMyAdmin/JetBackup. Low connection limits mean a small pool (5).

### ADR-004 — Prisma ORM with a JS driver adapter (no Rust engine binary)
**Date:** 2026-11-10 · **Status:** Accepted
**Context:** Prisma gives type-safe queries and migrations, protecting against SQL injection. The classic Rust query engine requires matching `binaryTargets` for CloudLinux's OpenSSL, which is a common deployment failure. Recent Prisma versions support a pure-JS query compiler with driver adapters (`@prisma/adapter-mariadb`, which works for MySQL too).
**Decision:** Use Prisma with the driver adapter and the JS/"client" engine. If the installed version lacks this, fall back to the Rust engine with `binaryTargets = ["native", "rhel-openssl-1.1.x", "rhel-openssl-3.0.x"]`.
**Consequences:** Smaller bundle and no binary mismatch. Verify during the Phase 0 smoke test.

### ADR-005 — Images processed once at upload (sharp → WebP variants) + custom next/image loader
**Date:** 2026-11-10 · **Status:** Accepted; storage and serving parts superseded by ADR-014 (processing and loader still apply)
**Context:** Next's on-demand image optimisation spends CPU and RAM per request, which is risky under shared hosting limits.
**Decision:** On upload, generate 480/960/1600 px WebP variants with sharp, with content-hashed names stored outside the app folder (`UPLOAD_DIR`). A custom loader picks the nearest variant. Serve them via the `/media` route by default and an Apache-served media subdomain when live.
**Consequences:** Near-zero runtime image cost and immutable caching. Uploads survive redeploys. If sharp can't load on the server, switch to client-side processing (10 §9).

### ADR-006 — Single predefined admin, stateless JWT session, CLI password reset
**Date:** 2026-11-10 · **Status:** Accepted
**Context:** The brief requires a predefined admin with a changeable password and no public registration. Shared hosting email is unreliable for reset links.
**Decision:** Seed one admin from env with a forced password change on first login. Use bcryptjs (pure JS), a `jose` JWT in an HttpOnly cookie, `sessionVersion` for revocation, DB-backed login rate limiting, and a CLI reset script over SSH. Don't use a full auth library such as NextAuth/Auth.js.
**Consequences:** It's small, auditable, and has no native deps. Adding more admins later only needs UI.

### ADR-007 — Search via LIKE on a denormalised `searchText` column
**Date:** 2026-11-10 · **Status:** Accepted
**Context:** The catalogue is expected to stay under ~1,000 products. MySQL FULLTEXT has min-word-length and stopword quirks, and external search services are out of scope.
**Decision:** Use a multi-term AND `LIKE %term%` over `searchText` (title, category, keywords, material, colours), with ranking in the service.
**Consequences:** It's simple and predictable. Revisit (FULLTEXT index) if products exceed ~2,000 or search gets slow (> 150 ms).

### ADR-008 — Markdown for long-form content (blog, product description, about)
**Date:** 2026-11-10 · **Status:** Accepted
**Context:** A WYSIWYG editor (TipTap, etc.) adds bundle weight and needs HTML sanitising. Markdown rendered without raw HTML is XSS-safe by construction.
**Decision:** Use a Markdown textarea with a small toolbar and preview in admin, rendered with `react-markdown` + `remark-gfm` and no `rehype-raw`.
**Consequences:** The owner learns a few Markdown basics (the toolbar hides most of it). Content is portable.

### ADR-009 — Tailwind CSS with design tokens, no component library
**Date:** 2026-11-10 · **Status:** Accepted
**Context:** A premium, distinctive look is required, and generic UI kits look like templates and add weight.
**Decision:** Tailwind CSS plus our own small primitives in `components/ui`, with tokens defined in CSS variables (03).
**Consequences:** Full visual control and a small CSS footprint.

### ADR-010 — Integer BDT prices, nullable for "Price on request"
**Date:** 2026-11-10 · **Status:** Accepted
**Decision:** Store prices as `Int` whole Taka, where `null` means price on request. Display with Indian/BD digit grouping and `৳`.
**Consequences:** No floating-point issues. Curtains/doors can hide prices.

### ADR-011 — On-demand cache revalidation by tags
**Date:** 2026-11-10 · **Status:** Accepted
**Decision:** Public pages are cached/static and invalidated by tags from admin actions, with a 1 h time-based fallback. A single process means the built-in cache handler is enough.
**Consequences:** Fast pages with instant updates after edits. Every new mutation must be added to the revalidation map (07 §5).

### ADR-012 — No contact form, analytics, or cookies in v1
**Date:** 2026-11-10 · **Status:** Accepted
**Decision:** WhatsApp and phone are the contact channels. No third-party trackers, so no consent banner is needed.
**Consequences:** No spam handling and better performance. Analytics can be added later via a new ADR.

### ADR-013 — Image storage on local disk (not Cloudflare R2/S3) for v1
**Date:** 2026-11-10 · **Status:** Superseded by ADR-014
**Context:** The brief's notes mention R2 as an example. The plan includes disk space, and an extra service adds keys, cost, and complexity.
**Decision:** Store images in `UPLOAD_DIR` on the hosting account, with media path abstraction (`MEDIA_BASE_URL`) so moving to R2/CDN later is a config + migration-script change.
**Consequences:** Backups must include `UPLOAD_DIR`. Watch disk and inode usage.

### ADR-014 — Store and serve images from Cloudflare R2
**Date:** 2026-11-10 · **Status:** Accepted (supersedes ADR-013 and the storage/serving part of ADR-005)
**Context:** The owner chose Cloudflare R2. It removes image traffic from the shared host entirely (no entry processes, RAM, disk or inodes spent on images), has **zero egress fees**, and serves images from Cloudflare's CDN close to visitors in Bangladesh. The free tier (10 GB storage, 1M writes, 10M reads per month) covers this catalogue.
**Decision:**
- One public-read bucket per environment: `artifex-media` (production) and `artifex-media-dev` (development).
- Images are still processed on our server at upload: sharp validates, rotates, strips EXIF, and makes WebP variants at 480/960/1600 px. The server then uploads the variants to R2 through R2's S3-compatible API.
- The S3 client is **`aws4fetch`**, a tiny request-signing library that Cloudflare recommends for R2. The full AWS SDK (`@aws-sdk/client-s3`) is too heavy for shared-hosting RAM.
- Object keys look like `products/<yyyy>/<mm>/<hash>-<w>.webp`. Every object is uploaded with `Cache-Control: public, max-age=31536000, immutable` and `Content-Type: image/webp`.
- Images are served from an R2 **custom domain**, `https://media.<domain>`. Our app never proxies images, so there's no `/media` route and no `UPLOAD_DIR`.
- The custom loader builds URLs from `NEXT_PUBLIC_MEDIA_URL`. It has to be a public variable because client components such as the gallery also build image URLs.
- The `r2.dev` public URL is only for development. Cloudflare rate-limits it, so it isn't for production.
**Consequences:**
- The domain's DNS has to be managed by Cloudflare (free plan) for the custom domain to work. The domain stays registered at Namecheap and the website stays hosted on Namecheap; only the nameservers change. See 10 §6.
- R2 API keys are new secrets (09 §8). The token is limited to *Object Read & Write* on the one bucket.
- Deleting an image deletes its three variant objects. If R2 is briefly unreachable, the DB delete still succeeds, the failure is logged, and the leftover objects only cost a little storage.
- Backups: R2 is highly durable, but an occasional copy is still made with `rclone` (09 §11).
- Fallback if sharp can't run on the server: process images in the admin's browser and upload them straight to R2 with presigned URLs (10 §9). That needs CORS on the bucket.

### ADR-015 — Node.js 24 LTS (ignore cPanel's "recommended" 14.21.3)
**Date:** 2026-11-10 · **Status:** Accepted
**Context:** The Namecheap cPanel "Setup Node.js App" dropdown offers versions up to **26** and labels **14.21.3** as "recommended". That label is only CloudLinux's default; it isn't advice for our stack. Node 14 reached end-of-life in April 2023, gets no security fixes, and can't run current Next.js (needs ≥ 20.9), Prisma, or sharp.
**Decision:** Use **Node.js 24.x (LTS)** in production, and use the **same major version** for local dev, WSL builds, and CI. Pin it with `"engines": { "node": ">=24 <25" }` and a `.nvmrc` containing `24`.
- Why not 26: it became LTS only in October 2026. Next.js, Prisma, and sharp prebuilt binaries have had far more real-world testing on 24, and 24 is supported until about April 2028.
- Why not 22: it's supported only until about April 2027, which is too soon after launch.
**Consequences:** Upgrade to Node 26 around mid-2027 with a new ADR, after confirming Next.js/Prisma/sharp support and testing locally. Upgrading means picking the new version in cPanel, rebuilding with the same version, redeploying, and restarting. The nodevenv path becomes `~/nodevenv/artifex-app/24/`.

### ADR-016 — Namecheap Stellar plan; deploy with GitHub Actions over SSH
**Date:** 2026-11-12 · **Status:** Accepted; the server-side Prisma CLI (`~/artifex-tools`) part is superseded by ADR-017
**Context:** The owner confirmed the hosting plan is **Namecheap Stellar** (the entry shared plan). Namecheap's published limits for it are **1 GB physical memory, 50% CPU (200% burst), 20 entry processes, 50 MB/s I/O**. SSH can be enabled on any shared package through cPanel → *Manage Shell*. SSH/SFTP runs on port **21098**. The owner wants deploys automated rather than uploading zips by hand, and the agent must never handle hosting credentials.
**Decision:**
- Stay on Stellar. The < 300 MB RSS target (AGENTS §4) leaves enough headroom under 1 GB. An upgrade to Stellar Plus (2 GB, 30 EP) is only needed if Resource Usage shows memory faults or EP limits being hit after launch.
- Deploy with a **GitHub Actions workflow** (`.github/workflows/deploy.yml`, built in Phase 1). On `ubuntu-latest` with Node 24 it builds the standalone bundle, uploads it over SSH (port 21098, key auth), swaps folders (`artifex-app-next` → `artifex-app`, keeping `artifex-app-prev`), runs `prisma migrate deploy` on the server, and restarts with `touch tmp/restart.txt`. Trigger: manual `workflow_dispatch` first, then optionally on push to `main`.
- The owner does a one-time setup: enable SSH, create a deploy key, and add it to GitHub Secrets (`SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, plus the build-time `NEXT_PUBLIC_*` values). Runtime secrets stay in cPanel's Node.js app env vars and never pass through CI.
- The Prisma CLI used for migrations is installed once on the server in `~/artifex-tools`, so its schema engine matches CloudLinux. The Phase 0 smoke test verifies this.
**Consequences:** Releases take one click, with rollback by swapping folders. If SSH can't be enabled, the fallback is SFTP upload (port 21098, enabled by default) with migrations applied in phpMyAdmin from `prisma migrate diff --script` (10 §5). The 50% CPU cap rules out any build or `npm install` of the app on the server, as already required by AGENTS §4.

---

### ADR-017 — Migrations and seed run from CI through an SSH tunnel
**Date:** 2026-11-12 · **Status:** Accepted (supersedes the `~/artifex-tools` part of ADR-016)
**Context:** `prisma migrate deploy` still uses Prisma's native schema engine, and the seed is TypeScript. Running them on the server would need a second Prisma install there (matching CloudLinux's OpenSSL 1.1.1k) plus a TS runtime, and the DB credentials in a shell-readable file. The server allows SSH port forwarding, and the GitHub runner already has the exact toolchain that CI tests with.
**Decision:**
- The deploy job opens `ssh -L 3307:127.0.0.1:3306` to the server and runs `prisma migrate deploy` and `npm run db:seed` **on the runner** against the tunnelled database.
- The production DB URL (pointing at `127.0.0.1:3307`) is stored as the GitHub secret `PROD_DATABASE_URL` in a `production` environment. The DB user only has privileges on the app database and MySQL is only reachable via SSH, so the secret alone gives no access.
- The pre-migration backup is also taken through the tunnel (`mariadb-dump` from the official `mariadb:11.4` image, client = server version) and stored gzipped on the server in `~/backups/` (last 10 kept, `chmod 700`).
- The app runtime still reads secrets only from cPanel env vars; the bundle contains no `.env` and no Prisma CLI.
**Consequences:** Nothing native or TypeScript runs on the server except the Next.js bundle itself. Fallback if tunnelling is ever blocked: generate SQL with `prisma migrate diff --script` and apply it in phpMyAdmin (10 §5).

### ADR-018 — Phase 1 stack versions and framework conventions
**Date:** 2026-11-12 · **Status:** Accepted
**Context:** ADR-002/004 and 02 §6 left the exact versions, caching API and middleware file name to be decided at scaffold time.
**Decision:**
- **Versions (pinned exactly in `package.json`):** Next.js **16.4.6**, React **19.3.0**, Prisma / `@prisma/client` / `@prisma/adapter-mariadb` **7.10.1**, Tailwind CSS **4.3.3** (via `@tailwindcss/turbopack`, as generated by `create-next-app` 16.4), TypeScript **5.9.3**, ESLint **9.39** + `eslint-config-next` 16.4.6, Zod **4.6.7**, Vitest **5.1**, Playwright **1.65**. TypeScript 7 and ESLint 10 exist but aren't yet the versions `create-next-app` targets, so they wait. npm's `latest` tag for `prisma` points at an 8.0 release candidate, so Prisma is pinned to the 7.10.1 stable line.
- **Caching:** `cacheComponents: true` + `partialPrefetching: true`, so services use the `"use cache"` directive with `cacheTag()` / `cacheLife()`, and admin actions call `revalidateTag()` (02 §6, 08 §5).
- **Middleware file:** `src/proxy.ts` (Next 16 name). It stays a cheap redirect only; `requireAdmin()` is the real check (09 §2).
- **Prisma 7 layout:** generator `prisma-client` → `src/generated/prisma` (git-ignored, generated on `postinstall`); connection URL in `prisma.config.ts`, which loads `.env` with Node's built-in `process.loadEnvFile` (no dotenv). `src/lib/prisma.ts` is an env-free client factory (used by the seed and scripts); `src/lib/db.ts` is the app singleton with a pool of 3.
- **Env validation:** `src/lib/env.ts` (Zod) is called from `src/instrumentation.ts` at server start, which exits the process on invalid env so Passenger reports it. `R2_*` are optional until the media module lands in Phase 3 (the storage module will validate them on first use); `ADMIN_*` are seed-only.
- **Deploy bundle:** `scripts/package-standalone.mjs` produces `deploy/artifex-app/` and a `.tar.gz` (not a zip: `tar` exists on Linux CI, Windows 10+ and the server; cPanel File Manager extracts both). It strips `.env*` files and writes a dependency-free `package.json` and `BUILD_INFO.json`.
- **npm install scripts:** npm 11 blocks install scripts unless approved. `prisma`, `@prisma/engines` and `esbuild` are approved in `package.json` → `allowScripts`. Approve `sharp` the same way when it is added in Phase 3.
**Consequences:** Version upgrades are deliberate: bump, run CI, and record them here. The image loader (`src/lib/image-loader.ts`) was written in Phase 1 because `next.config.ts` references it; the rest of the media module stays in Phase 3.

### ADR-019 — Test (staging) deployment on artifex.codespherestudio.site
**Date:** 2026-11-12 · **Status:** Accepted
**Context:** The verified Namecheap Stellar account (`shamimhossen`, server355 / 198.54.125.98) belongs to the developer. Its main domain `codespherestudio.site` runs an unrelated live site from `public_html`, and its DNS is on Cloudflare. The owner wants to test the Artifex site there first and move it to separate production hosting later.
**Decision:**
- Deploy test builds to **https://artifex.codespherestudio.site**: subdomain docroot `~/artifex.codespherestudio.site` (only Passenger's `.htaccess`), app root `~/artifex-app`, Node 24 app created with `cloudlinux-selector`, database `shamimhossen_artifex` (utf8mb4_unicode_ci) with a user that has privileges on that database only.
- Server-side secrets were generated on the server and stored in `~/artifex-secrets.txt` (`chmod 600`). They are never printed in agent output or committed.
- The DNS record for `artifex` goes in **Cloudflare** (the authoritative DNS), not in the cPanel zone.
- `NEXT_PUBLIC_MEDIA_URL` temporarily equals the site URL until R2 exists (no content images before Phase 3).
- The GitHub environment stays named `production`. It targets this test server until the real production hosting exists; moving means replacing that environment's secrets and variables only.
**Consequences:** The existing codespherestudio.site is never touched: deploys only write `~/artifex-app*` and `~/backups`. Moving to production later = create the DB and Node app on the new host (10 §2, §4), update the GitHub secrets/variables, and run Deploy. A new ADR records the production host when it's chosen.

### ADR-020 — Database reads happen at request time, never during `next build`
**Date:** 2026-11-12 · **Status:** Accepted (refines 02 §6 and ADR-011)
**Context:** With Cache Components, anything cached with `"use cache"` that can run during prerendering is baked into the build's static HTML. Our builds run in CI against a **test** database, so build-time reads would ship test data to production (until the cache expired) and make every build depend on a reachable DB.
**Decision:**
- Every public service function is split in two: an exported request-time wrapper that calls `await connection()` (from `next/server`) and then a private `"use cache"` loader with `cacheTag()` + `cacheLife("hours")`. Example: `getSiteSettings()` → `loadSiteSettings()`.
- On a self-hosted server (our single Passenger process) `"use cache"` results live **in memory** across requests until an admin action calls `revalidateTag()`, or the 1-hour fallback passes. This is the runtime cache (Next docs: "Runtime caching considerations").
- Components that use these services render inside `<Suspense>` with a same-size fallback (e.g. `HeaderFallback`). The static shell is prerendered and the data parts stream in within the same response.
- Wrappers catch DB errors, log them and return safe fallbacks (`FALLBACK_SETTINGS`, `[]`) so a DB outage degrades the chrome instead of breaking every page. The pool fails fast (`connectTimeout` 5 s, `acquireTimeout` 6 s).
- No `generateStaticParams` with DB queries (Phase 3+ uses the ISR app-shell pattern instead).
**Consequences:** `next build` needs no database. The first request after a deploy (or a revalidation) pays one query per cache entry; later requests are served from memory. The Next dev server's "Cache" environment was flaky over a long-distance SSH tunnel; production builds are not affected (verified locally with `next start`).

### ADR-021 — CSS-only motion (supersedes the "no decorative/scroll animation" rule in 03 §4)
**Date:** 2026-11-12 · **Status:** Accepted
**Context:** The owner asked for a premium, **animated** site that stays fast on slow mobile networks (most visitors are on phones). 03 §4 originally banned decorative and scroll-triggered animation, and AGENTS §5 bans animation libraries.
**Decision:**
- Motion is **CSS only** (no library, no JS): `animate-rise` (fade + rise entrance, staggered with `stagger-1..3`), `animate-settle` (transform-only entrance for the LCP heading/image, so LCP isn't delayed by an opacity fade), and `reveal` (scroll-driven reveal via `animation-timeline: view()`; browsers without support simply show the content). Hover polish (image scale 1.03, underline, arrow nudge) stays as in 03 §4.
- Durations 600–700 ms with `--ease-out`; nothing loops or autoplays; no parallax and no carousels.
- Every animation is disabled under `prefers-reduced-motion`.
- Never animate the opacity of the LCP element (hero image/heading, product main image).
**Consequences:** Zero added JavaScript and a few hundred bytes of CSS. AGENTS §5 ("animation libraries") still applies.

### ADR-022 — Brand logo as cached static SVGs, refined brand red
**Date:** 2026-11-12 · **Status:** Accepted (replaces the temporary text wordmark in 03 §8)
**Context:** The owner supplied the Artifex logo (traced SVG + 4000 px PNG in `VideoEditing/.../brand/`): a red "A" with a swoosh, RTIFEX, an underline and the tagline "DECOR YOUR DREAMS". The site must stay very fast on mobile, even with a large catalogue.
**Decision:**
- Two web SVGs in `src/assets/brand/`: `artifex-wordmark.svg` (A + RTIFEX, header) and `artifex-logo.svg` (with tagline, footer). Coordinates are rounded to whole units (27 KB → 15 KB; 4.4 KB and 6 KB gzipped). They're imported through `next/image`, so they get **content-hashed, immutable URLs**: phones download them once, not with every page or navigation (inlining would add ~6 KB to every HTML/RSC response).
- The neon source red `#FF0707` is refined to **`--color-brand: #D2161E`** for a more premium look on ivory; the tagline uses charcoal `#3A3F42`. The brand red is used **only for the logo**; the UI palette (ink/walnut) is unchanged.
- Favicons from the "A" mark: `src/app/icon.svg`, `favicon.ico` (16/32/48) and `apple-icon.png` (180 px, ivory background). `public/logo-mark-512.png` is kept for JSON-LD/OG use later.
- Motion: one CSS `clip-path` wipe on the header logo at page load (`animate-logo`, 0.9 s, off for reduced motion). It costs no JavaScript and doesn't affect layout. It only replays on a full page load, not on in-app navigation.
**Consequences:** If the owner later supplies an official vector or exact brand colour, replace the two SVGs and the token. Regenerating needs the one-off script described in PROGRESS's session log (Pillow for the raster icons).

### ADR-023 — Recreate Turbopack's hashed package aliases in the bundle; smoke-test the real bundle in CI
**Date:** 2026-11-12 · **Status:** Accepted
**Context:** After the Phase 2 deploy, the test site showed a **white page**: HTTP 200 with an empty body. The server log showed `Cannot find module '@prisma/client-2c3a283f134fdcb6/runtime/client'`. Turbopack loads server-external packages (Prisma) through hashed aliases in `.next/node_modules/<pkg>-<hash>`, which it creates as symlinks with **absolute** paths on the build machine. `scripts/package-standalone.mjs` didn't carry them into the bundle in a working form, so every database-backed render (header and footer, i.e. every page) failed mid-stream. CI didn't catch it because its e2e tests run `next start` from the repo, not the packaged bundle. The deploy health check only checked for status 200.
**Decision:**
- The packaging script skips `.next/node_modules` in the main copy and recreates each alias as a **relative** symlink to the real package in the bundle's `node_modules` (falling back to a copy where symlinks aren't allowed). It then resolves every alias from `.next/server/chunks/ssr` and **fails the build** if any doesn't resolve.
- New CI step `scripts/smoke-bundle.mjs`: boots `deploy/artifex-app/server.js` against the seeded CI database and requires HTTP 200, a complete document (`</html>`), DB content (`>Sofas<`), the footer, and no module/stream errors in the server log.
- The deploy health check now requires `</html>` and `</footer>` in the body, not just status 200, so an empty 200 triggers the automatic rollback.
**Consequences:** This class of bug fails in CI before it can be deployed. Any future server-external package (e.g. `sharp` in Phase 3) is covered by the same alias handling.

### ADR-024 — Mobile menu opens via Invoker Commands (works before JavaScript loads)
**Date:** 2026-11-12 · **Status:** Accepted
**Context:** CI failed on the mobile-menu e2e test: on a slower machine the test tapped the menu button before React had hydrated, so nothing happened. Real visitors on slow mobile networks would hit the same dead button.
**Decision:** The menu and close buttons carry `command="show-modal"` / `command="close"` with `commandfor="mobile-menu"`, so the browser opens and closes the native `<dialog>` itself from plain HTML (Chrome/Edge 135+, Firefox 144+, Safari 26.2+). The React `onClick` only acts when the browser lacks Invoker Commands. Backdrop click and closing on link tap still use JS after hydration (links navigate anyway before that).
**Consequences:** The menu works the moment the HTML arrives. An e2e test runs with JavaScript disabled to keep it that way. The focus test now checks that focus is inside the open dialog rather than on one specific button, which is the accessibility requirement (05 §5).

### ADR-025 — Catalogue implementation choices (Phase 3)
**Date:** 2026-11-12 · **Status:** Accepted
**Context:** Building F1 (listing, detail, pricing, colours, gallery) and F3 (WhatsApp) under Cache Components (ADR-018) with request-time data (ADR-020), for mostly-mobile visitors on slow networks.
**Decision:**
- **Effective price column.** `Product.effectivePrice Int?` (= `discountPrice ?? regularPrice`, null for "Price on request") with index `[status, effectivePrice]` replaces the `[status, regularPrice]` index. Price sorting uses it with `nulls: "last"` in both directions. It's kept in sync on every product write, like `searchText` (`src/lib/search-text.ts`). Migration `20261112100000_product_effective_price` backfills existing rows.
- **Sort and "On sale" are links, not a `<select>`.** The chips are plain `<a href>`s (`rel="nofollow"`, since pages canonicalise without these params), so they're shareable and work before JavaScript loads, with zero client JS. Changing sort or the filter resets to page 1. This replaces "sort select" in 05 §3.
- **Not-found status.** With Cache Components, request-time pages commit to HTTP 200 before data loads, so a missing product/category or an out-of-range `?page=` renders the branded not-found UI **with `noindex`** but status 200 (Next docs: "Streaming → Status codes"). Search engines drop noindex pages, so SEO impact is minimal. A true 404 (e.g. a cached slug check in `proxy.ts`) is a Phase 8 option. This refines the F1.1/F1.2 acceptance criteria.
- **Gallery** uses CSS scroll-snap + thumbnails + a native `<dialog>` viewer (no library). The first image uses `preload` (Next 16 replacement for `priority`). The mobile sticky WhatsApp bar uses a frame-throttled passive scroll check instead of IntersectionObserver (a fast fling can skip the CTA without ever intersecting).
- **R2 uploads:** `aws4fetch` with `retries: 2` (its default is 10 retries with exponential backoff, which could stall an admin upload for about a minute). Variant widths and URL building live in `src/lib/image-variants.ts` (no `"use client"`) so server code can import them.
- **Demo catalogue.** `SEED_DEMO=true` seeds 31 published demo products (slugs `demo-…`, no photos yet) for CI and test servers. Never set in production. The seeded categories leave Curtains empty to exercise the empty state.
**Consequences:** Listing and product pages are fast and work with minimal JS. Real product photos depend on the R2 buckets and the Phase 7 admin uploader; until then products show the branded placeholder.

### ADR-026 — Product range change (no Doors/Tables, add Chandeliers) and a single header row
**Date:** 2026-11-12 · **Status:** Accepted (updates 01 §4 and 05 §2; ADR-010's "Curtains/doors can hide prices" now applies to curtains and chandeliers)
**Context:** The owner decided to stop selling **Doors** and **Tables** (coffee/side/study) and to add **Chandeliers**. They also asked whether the desktop utility bar (Journal · About · Contact · phone) is needed for a premium look.
**Decision:**
- Seeded categories: Sofas, Dining Tables, Chairs, Beds, Curtains, Chandeliers (in that order). Dining Tables stays (it's a separate category from "Tables"). Chandeliers use the existing fields: material, dimensions, specs (lights, drop), made-to-order and "Price on request".
- Existing databases aren't changed by the seed (it never deletes). On the test server the Doors/Tables categories and their two demo products were removed by SQL, Chandeliers was added by the seed, and the category order and the about/SEO texts were updated.
- **No utility bar.** The logo row is the only header row. Journal/About/Contact stay in the footer and mobile menu; the phone is the header phone icon.
**Consequences:** Six categories fit the desktop header without a "More" menu. The owner confirmed on 2026-11-12 that **Dining Tables stays**.

### ADR-027 — Global search implementation (Phase 4)
**Date:** 2026-11-12 · **Status:** Accepted (implements ADR-007 and F2)
**Context:** F2 asks for instant suggestions and a results page, matching every term against `searchText` with `%`/`_` escaped (09 §3).
**Decision:**
- **Prisma does not escape LIKE wildcards.** Verified on MariaDB 11.4: `contains: "%"` matched all 31 products, while `contains: "\\%"` matched none. So `src/lib/search.ts → escapeLike()` escapes `\`, `%` and `_` for every term before it reaches Prisma.
- **Query pipeline:** normalise (trim, lowercase, collapse spaces, max 60) → up to 5 distinct terms → AND of `searchText LIKE %term%` on published products in active categories, ≤ 200 candidates → ranked in memory (title prefix > title contains > other; then popular, then newest). One `"use cache"` entry per normalised query (tags `products`, `categories`) serves both suggestions and every results page for that query.
- **API:** `GET /api/search?q=` validates 2–60 chars (400 otherwise), returns ≤ 6 products (title, href, prices, image, category) + ≤ 3 categories, `Cache-Control: public, max-age=60`; 503 with `no-store` if the DB fails.
- **Overlay:** one `<dialog id="search-dialog">` in the header, opened by `command="show-modal"` buttons (works before the app bundle loads, like ADR-024). The form submits to `/search` without JS. With JS: 250 ms debounce, AbortController for stale requests, ARIA combobox (↑/↓, Enter, Esc). Loading/stale state is derived from which query a response belongs to (no setState inside the effect).
- **/search page:** `noindex, follow`, 24 per page, search form, "No results" state with category links and WhatsApp; an empty query shows the form.
- **Testing "before JavaScript loads":** e2e tests block `/_next/static/chunks/**` (the app bundle) instead of disabling JavaScript. The small inline scripts that reveal streamed HTML still run, which is what a slow phone actually experiences.
**Consequences:** At catalogue scale (< 2,000 products) LIKE + in-memory ranking is fast; switch to FULLTEXT if it grows (ADR-007).

### ADR-028 — Journal, Contact and About implementation (Phase 5)
**Date:** 2026-11-12 · **Status:** Accepted
**Context:** F4 (Journal), F5 (Contact & Location) and F7 (About), built for mostly-mobile visitors on slow networks.
**Decision:**
- **Map is click-to-load on every device**, not only on mobile (refines F5): the Google Maps embed is ~500 KB of third-party code, so it loads only after "Tap to load the map". Without a valid `mapEmbedUrl` (must start with `https://www.google.com/maps/embed`) the page shows an "Open in Google Maps" card instead. "Get directions" uses `mapLinkUrl`, then lat/lng, then the address.
- **Opening hours.** `src/lib/opening-hours.ts` parses admin labels ("Sat–Thu", "Fri", "Mon, Wed", "Daily") and computes the status in Asia/Dhaka. `OpeningStatus` renders only in the browser (`useSyncExternalStore`, refreshed each minute), so cached HTML never shows a stale status. Unparseable labels show no status. The same parser builds `openingHoursSpecification` for the FurnitureStore JSON-LD.
- **Journal.** 9 posts per page, newest featured on page 1. Related posts: up to 3 sharing a tag, filled with the latest (filtered in memory from the 50 most recent, since the blog is small). Share: Facebook sharer, WhatsApp (`wa.me/?text=`), copy link (the only client JS). Blog Markdown may include images, but **only** R2 key bases or `https://` URLs on the media domain (`safeImageUrl`); product descriptions still drop images. BlogPosting + BreadcrumbList JSON-LD; Open Graph `article` with published/modified times.
- **About.** Story from `SiteSetting.aboutContent` (Markdown, editable), three fixed values limited to confirmed facts, and CTAs. The seed's default About text (and an SQL fill on the test DB, only when empty) avoids unconfirmed claims such as "we manufacture".
- **Demo posts.** `SEED_DEMO=true` adds 4 practical guides (sofa sizing, wood care, dining table size, chandelier sizing) with `demo-` slugs. They can be edited into real launch posts.
**Consequences:** No third-party scripts load unless asked for. A missing map embed URL still gives visitors directions.

### ADR-029 — Homepage implementation (Phase 6)
**Date:** 2026-11-12 · **Status:** Accepted
**Context:** F6 / 05 §3 define the homepage sections. No product, category or hero photos exist yet (they arrive with R2 + the Phase 7 uploader), and the site must stay fast on mobile.
**Decision:**
- **Two streaming boundaries:** the hero (the LCP area) and everything below it. Below-the-fold blocks are fetched in parallel; each is cached under its own tags (`home`, `products`, `categories`, `blog`, `settings`) and **fails soft**: a failing block is logged and hidden instead of breaking the page.
- **No-photo states look intentional:** a typographic hero on ivory with fine lines (the seed's `home/placeholder-hero` key counts as "no image"); category tiles with Lucide line icons per category; the brand intro uses the full logo on sand; product placeholders turn white inside sand-tinted rails (`.rail-tinted`) so cards keep an edge. With a real photo the hero becomes full-bleed with a solid `ink/35` scrim, and category tiles get the bottom gradient scrim (03 §6).
- **Rails:** New arrivals (flagged, else newest), Featured and Popular (by `homeSortOrder`), 8 each: mobile scroll-snap rows with the next card peeking, desktop grids. Promo banners: active ones, filtered by date **at request time** (the clock is read after `connection()`; reading it earlier made `next build` fail), max 2. Latest 3 Journal posts.
- **SEO:** home metadata from settings (`title.absolute`, description, canonical `/`, OG image `/logo-mark-512.png`); Organization, WebSite (SearchAction → `/search?q=`) and FurnitureStore JSON-LD.
- **Performance check** (exit criterion): Lighthouse itself isn't installed (no new dependency), so a Playwright probe applies Lighthouse-like mobile throttling via CDP (1.6 Mbps, 150 ms RTT, 4× CPU) against a local production build with a warm cache. Result 2026-11-12: home LCP 1.36 s, CLS 0, ~330 KB transferred; category/product/journal LCP 1.19–1.24 s, CLS 0. Real Lighthouse/PageSpeed scores are recorded after deploy (Phase 9) and once real photos exist.
**Consequences:** The homepage stays complete and fast before any photos exist, and photos slot in without code changes.

### ADR-030 — Admin authentication and shell (Phase 7, milestone 7a)
**Date:** 2026-11-13 · **Status:** Accepted (implements 07 §1–2 and 09 §2)
**Context:** One predefined admin, shared hosting (no Redis), Cache Components (session reads must be inside `<Suspense>`), and a mostly-mobile owner.
**Decision:**
- **Layering.** Pure helpers live in `src/lib/auth/` (`password.ts`: bcryptjs cost 12 + 07 §1 rules; `session-token.ts`: jose HS256 JWT `{sub, sv, mcp}`, 7 days, cookie `af_session` HttpOnly/SameSite=Lax/Secure on https; `rules.ts`: lockout thresholds, client IP, safe redirect). The DB-backed parts (`getCurrentAdmin`, **`requireAdmin`**, login, password/profile changes, logout everywhere) are in `src/server/services/auth.service.ts`, not `lib/auth`, because they need repositories and `lib` must not import `server` (02 §3). This refines the "requireAdmin in lib/auth" wording in 02/09.
- **requireAdmin is the boundary.** Every admin page and action calls it. It verifies the JWT **and** loads the admin to compare `sessionVersion`, so password changes and "log out everywhere" apply immediately. While `mustChangePassword` is set it redirects to `/admin/account/password` (except that page). `proxy.ts` only redirects when the cookie is missing, renews tokens in their last day, and adds `Cache-Control: private, no-store` + `X-Robots-Tag: noindex, nofollow` to every `/admin` response (login included). Verified that a forged cookie gets no admin content, just a redirect.
- **Brute force (DB, no Redis):** 5 failures per email or 20 per IP in 15 minutes, which also blocks attempts for unknown emails. The IP comes from `CF-Connecting-IP` (the test site is behind Cloudflare), then the first `X-Forwarded-For` hop. Unknown emails still run bcrypt against a decoy hash (constant time). A successful login clears that email's failures. Old rows are pruned opportunistically (5% of logins).
- **Cache Components.** The admin layout renders a static shell (sidebar, drawer via Invoker Commands, logout); pages read the session inside the layout's `<Suspense>`. The nav's active highlight (`usePathname`) also sits inside `<Suspense>`; reading it outside one fails the build on dynamic routes.
- **Password reset CLI** (`npm run admin:reset-password -- --email …`) runs from a developer machine through the SSH tunnel (ADR-017), not on the server (the bundle has no TS runtime). It prompts without echo, enforces the rules, sets `mustChangePassword`, bumps `sessionVersion` and clears the email's lockout.
- **Tests.** Unit: hashing, rules, token tamper/expiry/renewal, lockout, IP, redirects, schemas. E2E (`admin-auth.spec.ts`) changes the admin password, so it runs **only** when `E2E_ADMIN_EMAIL/PASSWORD` are set (CI's throwaway DB), never against a real database.
**Consequences:** Sections not built yet (Products, Categories, Journal, Homepage, Settings) show a "coming soon" page until milestones 7b–7e replace their catch-all placeholders.

### ADR-031 — Admin forms, single-image uploads, settings and homepage editor (Phase 7, milestone 7b)
**Date:** 2026-11-13 · **Status:** Accepted (implements 07 §3.5 hero/banners, §3.6, §4–5)
**Context:** Admin forms must keep what was typed after a failed save (07 §3.2). React 19 resets a `<form action>` after the action finishes, and some fields need live previews.
**Decision:**
- **`AdminForm`** (`components/admin/AdminForm.tsx`) submits with `onSubmit` + `startTransition(action(null, formData))` instead of `<form action>`, so nothing is reset. It shows the result summary and a toast, and exposes field errors through context to `AdminField`, `ImageField` and the hours editor. On success it calls `router.refresh()` (or navigates with `redirectTo`). Server pages compose forms from server-rendered fields; only interactive bits are client components. The admin needs JavaScript; public pages are unaffected.
- **Single images are sent with the form** (hero, banners, share image), one file per request, through the existing sharp → WebP → R2 pipeline (`services/media.service.ts`). Order: upload the new image → save the row → delete the old variants. If the save fails, the new upload is deleted. Only server-generated key bases are ever deleted (`isValidKeyBase`), so seed placeholders and demo paths are safe. The multi-image product uploader (7d) keeps the queued, per-file design in 07 §3.2.
- **Settings tabs are separate routes** (`/admin/settings`, `/contact`, `/location`, `/social`, `/seo`). Each posts a `section` discriminator to one action (`saveSettingsAction`), validated by a Zod discriminated union. The editor reads uncached (`settings-admin.service`, kept apart from `settings.service` so public pages never load sharp). Saving calls `updateTag("settings")`.
- **Input normalisation:** WhatsApp numbers accept local forms (01757-758388) and are stored as 8801XXXXXXXXX. The map field accepts the whole Google `<iframe>` snippet and stores only its `https://www.google.com/maps/embed?…` src. Social links must be https on their own domains. Hero/banner links must be site paths or https (no `//`, `javascript:`).
- **Banner dates** are Dhaka calendar days (UTC+6, no DST): start = 00:00, end = 23:59:59.999 Dhaka time. Order is set with move up/down (rewrites sortOrder 10, 20, 30… in one transaction). Hero and banner changes call `updateTag("home")`.
- **Share image:** Settings → SEO can upload a default OG image (`site/` folder); the homepage uses it, otherwise the logo mark.
**Consequences:** Uploads need R2 configured on the server (they are). Locally without dev R2 keys, saving an image shows "Image storage isn't set up". Featured lists on the Homepage screen arrive in 7f.

