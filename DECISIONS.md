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
**Date:** 2026-11-10 · **Status:** Accepted; analytics/trackers part superseded by ADR-040
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

### ADR-032 — Ship sharp's full native packages in the deploy bundle (extends ADR-023)
**Date:** 2026-11-13 · **Status:** Accepted
**Context:** Milestone 7b is the first time server code imports `sharp`. Turbopack then adds a `sharp-<hash>` alias next to Prisma's, and file tracing copies sharp's `.node` binary but not libvips (the `.dll` files on Windows; the separate `@img/sharp-libvips-<platform>` package on Linux). The bundle's sharp couldn't load ("Could not load the sharp module"), so uploads would have failed on the server. The alias check also failed because sharp's `exports` map hides `package.json`.
**Decision:** `scripts/package-standalone.mjs` copies every installed `@img/*` package in full into the bundle (npm installs only the build machine's platform, so CI ships the linux-x64 ones). The alias check resolves `<alias>/package.json` as before. When a package hides that path (sharp), the check **loads** the package instead, which proves its native parts work. CI runs this on Linux for every push. Server checked: glibc 2.28 and x86-64-v2 CPU features (SSE4.2, POPCNT), as sharp's Linux binary requires.
**Consequences:** About 8 MB more in the bundle. Any future native package that is traced the same way gets the same load check.


### ADR-033 — Admin categories (Phase 7, milestone 7c)
**Date:** 2026-11-13 · **Status:** Accepted (implements 07 §3.3)
**Context:** 07 §3.3 asks for drag-to-reorder, toggles, a form with an image, and a delete that is blocked while products exist. The owner manages the site from a phone.
**Decision:**
- **Order uses move up/down buttons**, like promo banners (ADR-031), instead of drag-and-drop. Drag needs a library or a lot of pointer/keyboard code and is unreliable on phones; buttons are accessible and fit the dependency policy. sortOrder is rewritten as 10, 20, 30… in one transaction.
- **Slug:** blank means "derive from the name" (`slugify`: ASCII kebab-case, `&` → "and", accents stripped). Typed slugs are normalised the same way. Uniqueness is checked in the service and a P2002 race maps to the same field error. The edit form warns that changing it breaks saved links (no redirects table; out of scope).
- **Rename recomputes product `searchText`** for that category (04 §4) in batched transactions of 100.
- **Image:** optional, one file sent with the form (ADR-031 order: upload → save → delete old). "Remove the current image" clears it. Alt text is the category name (no alt column).
- **Delete** is refused by the service when products exist (also enforced by `onDelete: Restrict`); the list shows "View products" instead of Delete for those rows.
- **Revalidation:** every category mutation calls `updateTag` for `categories`, `products` (product pages show the category; search), `home`, and `category:<slug>` (old and new).
**Consequences:** "View products" links to `/admin/products?category=<slug>`, which becomes a real filtered list in milestone 7d.

### ADR-034 — Admin products (Phase 7, milestone 7d)
**Date:** 2026-11-13 · **Status:** Accepted (implements 07 §3.2 and the product rows of §5)
**Context:** The product form is the largest admin screen: details, colours, specs, SEO and up to 12 photos, used mostly from a phone on shared hosting (one process, limited RAM).
**Decision:**
- **Photos are separate from the details form.** A new product is saved first ("Save and add photos"), then the edit page shows a Photos panel. Each photo is one Server Action request (07 §4); the browser queues files and runs **two uploads at a time**, showing a status per file (waiting / uploading / uploaded / failed) instead of a byte percentage (Server Actions don't report upload progress). Reorder, "Set as featured", alt text and delete save immediately. The first photo becomes featured; deleting the featured photo promotes the next. New photos get the product title as alt text, so alt is never empty. The 12-photo limit is checked on the server before uploading.
- **Order uses up/down buttons** for photos, colours and specs, as for banners and categories (ADR-031/033): accessible on phones, no dependency.
- **Colours and specs** are client-side rows sent as JSON in hidden inputs, validated with Zod (per-row errors map to `colors.0.name` etc.) and written with the product in one transaction (delete + recreate). Spec quick-add labels come from `lib/spec-presets.ts`, keyed by the selected category's slug.
- **Derived columns** are computed in the service on every save: `searchText` (title, category, keywords, material, colour names) and `effectivePrice`. `publishedAt` is stamped on first publish and kept if the product goes back to draft.
- **Slug and SKU** uniqueness is checked in the service; a P2002 race maps to the right field from the error target.
- **Duplicate** copies everything except slug, SKU and photos as a draft, with a free `-copy`, `-copy-2`… slug, and opens the copy.
- **Delete** removes the row (photos, colours and specs cascade), then deletes the photo variants from R2; a failed R2 delete is logged and leaves an orphan, never a broken page.
- **Unsaved changes:** `AdminForm` has an opt-in `guardUnsaved` (beforeunload while dirty; cleared on a successful save). Controls that change the form without input events call `markDirty()` from the form context.
- **Markdown preview** renders with the same `<Markdown>` component as the public page (admin-only client bundle).
- **Revalidation:** product create/update/delete → `products`, `home`, `categories`, `product:<old>` and `product:<new>`; photo changes → `product:<slug>`, `products`, `home`. Duplicates are drafts and revalidate nothing public.
**Consequences:** Drafts can't be previewed on the public page yet (F1.2 `?preview=1` for a signed-in admin); "View on site" shows only for published products in active categories. Two parallel uploads at 11/12 photos could both pass the limit check (13 photos); acceptable for a single admin.

### ADR-035 — Owner layout changes: navigation in the header, compact footer, shorter product images
**Date:** 2026-11-13 · **Status:** Accepted (supersedes parts of ADR-026 and 05 §2–3)
**Context:** After seeing the test site, the owner asked for a simpler homepage, a more compact and premium footer, Journal/About/Contact in the top navigation, a Messenger button, and less tall product photos.
**Decision:**
- **Header:** categories (max 6, minus `HEADER_HIDDEN_CATEGORIES` = Chairs, hidden at the owner's request) then a divider and Journal · About · Contact. Chairs keeps its page, homepage tile and search results. The nav landmark is now labelled "Main".
- **Footer:** logo, short description, social icons, address, phone, WhatsApp (and email if set), © line. Category and company links removed; navigation lives in the header and mobile menu.
- **Floating buttons:** Messenger (`m.me` link from the Facebook URL, new `--color-messenger` token #0866FF) stacked above WhatsApp; both hide on mobile product pages like before.
- **Homepage:** "Collections" heading (no "Shop by category"), "New arrivals" without the "Just in" eyebrow, Featured and Most loved rails removed (the product flags stay). The CTA band heading may use up to 56rem with balanced wrapping so it fits on one line on desktop.
- **Product images:** cards square (1:1, was 4:5); gallery 1:1 on mobile and 4:3 on desktop. Category tiles stay 4:5.
**Consequences:** Featured/Popular flags currently affect nothing public; they're kept for a possible future use (e.g. 7f or a "Featured" filter). Hiding a category from the header is a code constant, not an admin switch.

### ADR-036 — Admin Journal (Phase 7, milestone 7e)
**Date:** 2026-11-13 · **Status:** Accepted (implements 07 §3.4 and the blog row of §5)
**Context:** Posts need a cover photo, inline photos, back-dating and the same editing comfort as products.
**Decision:**
- **Shared editor pieces:** `MarkdownEditor` and `SeoFields` moved to `components/admin/` and are used by products and posts. The editor takes an optional `uploadImage` Server Action; with it, "Insert image" uploads one photo (one request, sharp → WebP → R2 `blog/`) and inserts `![Describe the image](blog/yyyy/mm/hash)` with the alt text selected. The public renderer already allows only our media keys (F4, 09 §4).
- **Image cleanup:** on save, inline keys that were in the old Markdown but not the new one are deleted from R2 (only `blog/` keys); deleting a post deletes its cover and inline images. Cleanup errors are logged, never fail the save. A photo inserted and removed before the first save is an orphan (rare, harmless).
- **Publish date:** a Dhaka calendar day, today or earlier (back-dating only). Public queries don't filter future dates and pages are cached, so scheduling would need more work; it's out of scope. Unchanged day keeps the stored time; today = now; earlier days are stored at noon Dhaka. Blank = keep, or now on first publish.
- **Tags** are normalised on save (lowercase, unique, comma-separated) to match `parseTags` used for related posts.
- **Revalidation:** `blog`, `home`, `post:<old>` and `post:<new>`.
**Consequences:** No draft preview on the public site yet (same as products; the editor's Preview tab covers the content).

### ADR-037 — Draft preview, sitemap and robots; 7f skipped (Phase 8 start)
**Date:** 2026-11-13 · **Status:** Accepted (implements F1.2 preview, 08 §7)
**Context:** Admins need to see a draft before publishing; search engines need a sitemap and robots rules. Milestone 7f (homepage featured lists) lost its purpose when the owner removed the Featured/Most loved rails (ADR-035).
**Decision:**
- **Preview:** `?preview=1` on `/products/[slug]` and `/blog/[slug]` checks the admin session (`preview.service.isAdminPreview`, which reads the cookie only when the param is present). For an admin the page reads the row **uncached** (any status; products in hidden categories too), shows a "Preview" banner with a link back to editing, and is `noindex, nofollow`. Everyone else gets the normal cached, published-only page, so the param leaks nothing. Draft edit pages link to it as "Preview".
- **sitemap.xml:** home, /products, /blog, /about, /contact, active categories, published products in active categories and published posts, with `lastModified = updatedAt`. Read through a `"use cache"` loader tagged `products`, `categories`, `blog`, so admin changes update it; it is request-time (`connection()`), and falls back to the static pages if the database fails.
- **robots.txt:** allow `/`, disallow `/admin`, `/api`, `/search`, point to the sitemap. Built statically from `NEXT_PUBLIC_SITE_URL`.
- **7f skipped.** The product flags stay in the schema and form for possible later use.
**Consequences:** Phase 8 checks recorded in the roadmap. Still open: accessibility pass (axe + manual), PageSpeed on the production domain, Facebook OG check, optional WhatsApp click tracking.

### ADR-038 — Field controls get their ids through context, not cloneElement
**Date:** 2026-11-13 · **Status:** Accepted
**Context:** CI had been red since milestone 7d. After "Save and add photos", client-side navigation to the product edit page crashed ("Something went wrong") with `TypeError: Cannot read properties of undefined (reading 'id')` in `<Field>`, which read `children.props.id` and used `cloneElement` to wire the label. Controls written in a Server Component and passed into the client `<Field>` can arrive as **lazy nodes** without props after client navigation, and server-rendered `<Select>` arrived as its wrapper `<div>`, so its label pointed at the div. A full page load hid both problems, so the bug only showed when navigating inside the admin.
**Decision:** `<Field>` provides `{ id, describedBy, invalid }` through a React context; `Input`, `Textarea` and `Select` are tiny client components that read it with `useFieldControl()` (explicit props win; outside a Field nothing changes). `MarkdownEditor`'s inner Textarea picks it up the same way. A unit test renders a Field whose control is a lazy node; it fails with the old code and passes now.
**Consequences:** Input/Textarea/Select add a few hundred bytes of client JS where they're used on public pages (search, 404). CI also now keeps Playwright traces and page snapshots of failed e2e tests as an artifact, pipes the Next server log, and the serial admin e2e file runs without retries (a retry would replay the one-time password change).

### ADR-039 — Hero photos become a visitor-driven slider; the hero is shorter
**Date:** 2026-11-13 · **Status:** Accepted
**Context:** The owner asked for the homepage hero background to be a slider and for the hero to take less height. AGENTS.md §5 and 03 §Motion rule out autoplay carousels and animation libraries, and the hero photo is the page's LCP image.
**Decision:** A new `HomeHeroSlide` table (`imagePath`, `imageAlt`, `sortOrder`) holds up to 5 photos; `HomeHero.imagePath`/`imageAlt` are dropped, and the migration copies an uploaded photo (not the seed placeholder) into the first slide. The heading and buttons stay server-rendered and fixed; only the photo behind them changes. `HeroSlider` is a small client component: arrows, dots (≥ sm; a "1 / 3" counter on phones so every target stays 44 px), swipe and a polite live region. **No autoplay.** Slides crossfade with CSS (500 ms, off under reduced motion); the first photo is preloaded and never faded in; a photo is fetched only when shown or next in line. The admin manages slides like product photos: the product photo manager became a shared `PhotoManager` (upload queue, alt text, move up/down, delete). The hero is now min-h 60svh mobile / 68vh desktop (was 80svh / 88vh).
**Consequences:** About 1 KB more client JS on the homepage when there are photos. With one photo there are no controls. During a deploy, the old release reads the dropped columns between migrate and swap; the hero falls back to its default text for those seconds (`safely()`).

### ADR-040 — First-party visit/inquiry counts and an admin-set Meta Pixel (supersedes ADR-012's "no analytics")
**Date:** 2026-11-13 · **Status:** Accepted
**Context:** The owner wants to see visits and interactions on the admin dashboard, and to run Facebook ads with the Meta Pixel, set from the admin panel. ADR-012 ruled out analytics and third-party trackers in v1; 06 F3 planned anonymous WhatsApp-click counting (`InquiryClick`, `/api/track`). Constraints: one Node process, no cron or queues (rule 1); no pasted HTML/scripts (rule 6).
**Decision:**
- **First-party counts, cookieless.** A tiny client `SiteTracker` (in the public layout) sends `navigator.sendBeacon('/api/track', {type, path})` on every page view and, through one delegated click listener, on every WhatsApp (`wa.me`), Messenger (`m.me`) and phone (`tel:`) link. `/api/track` is POST-only, same-origin (Origin/Referer vs Host), ≤ 1 KB, Zod-validated, skips bots (user-agent pattern) and signed-in admins (session cookie present), and returns 204. Rows go to `SiteEvent` (`type`, `path` without query, `visitorHash`, `createdAt`). `visitorHash` = first 16 hex of HMAC-SHA256(AUTH_SECRET, Dhaka day | IP | user agent): IPs are never stored and the hash can't be linked across days. Events older than 400 days are pruned while recording, at most once a day per process. `SiteEvent` replaces the planned `InquiryClick` table.
- **Dashboard KPIs** for 7/30/90 days (`?range=`), each with the change vs the previous period: visitors (unique per day, summed), page views, product views, inquiries (WhatsApp + Messenger + call taps) and each channel, inquiry rate (inquiries per 100 visitors), most viewed products, most inquired products (taps on product pages), top pages. If analytics can't load, the rest of the dashboard still renders.
- **Meta Pixel.** Settings → Tracking stores only `SiteSetting.facebookPixelId` (10–20 digits; spaces stripped; pasted code rejected). The site writes Meta's standard loader itself (`src/lib/meta-pixel.ts`): the `fbq` stub is installed at once and `fbevents.js` loads when the browser is idle, so it doesn't compete with the page. Events: `PageView` (every route change), `ViewContent` (product pages: slug, name, price in BDT; not in admin preview), `Search` (search results), `Contact` (WhatsApp/Messenger/call taps, with the product slug on product pages). Admin pages never load it. CSP allows `https://connect.facebook.net` (script, connect) and `https://www.facebook.com` (img, connect).
**Consequences:** When a Pixel ID is set, Meta sets its own first-party cookie (`_fbp`) and receives page URLs and IPs; 05's "we set no tracking cookies" now holds only while the Pixel is off. No consent banner is added (owner's call; revisit if a privacy law or ad policy requires one). Our own counts never set cookies. One extra small INSERT per page view (fine for this traffic); one more client component (~2 KB gzip) on public pages. Numbers undercount visitors who block scripts and are approximate by design.

### ADR-041 — Product photos: 1 main + up to 4 gallery photos
**Date:** 2026-11-13 · **Status:** Accepted
**Context:** The owner wants each product to have one showcase photo plus raw camera shots from other angles, 5 photos in total, with the extra ones visible only on the product page. The data model already had this shape (`ProductImage.isPrimary` + `sortOrder`; cards, listings, home rails and share images read only the primary; the product page gallery shows all, primary first), but allowed 12 photos and called the primary "featured".
**Decision:** `MAX_PRODUCT_IMAGES` = 5, enforced in the service and the admin uploader. The admin calls the primary the **main photo** ("Set as main photo") and explains that the others are the gallery, shown only on the product page. No schema change.
**Consequences:** Products that already have more than 5 photos keep them (nothing is deleted), but no more can be added until some are removed. Less storage and a lighter product page.

### ADR-042 — Production cleanup: drop the Featured flag and home sort order, remove dead code
**Date:** 2026-11-13 · **Status:** Accepted
**Context:** The owner asked for a production-grade cleanup of the database and code. After ADR-035 removed the Featured and Most loved rails, `Product.isFeatured` and `Product.homeSortOrder` still appeared in the admin but changed nothing on the website. A scan of every export and schema field found a few unused exports and one unused component.
**Decision:**
- Migration `20261113200000_drop_product_featured` drops `isFeatured`, `homeSortOrder` and their indexes, and adds `[status, isPopular, publishedAt]` for the popular ordering used by search and related products. The admin form, list filter/badge, validation, seed and tests follow. `isPopular` stays (it ranks search results and related products); its label says so.
- Homepage code keeps only the New arrivals rail (`findNewArrivals` / `getNewArrivals`).
- Removed dead code: `ComingSoon`, `IDLE`, `publicEnv`, and unused type exports. Stale comments fixed. The original brief moved from the repo root to `docs/history/`.
- Footer credit "Developed by Shamim Hossen Badol", linked to the developer's WhatsApp; marked `data-no-track` so it isn't counted as a customer inquiry.
**Consequences:** Existing Featured ticks and home sort numbers are deleted with the columns (they had no visible effect). Every table and remaining field is used by the website or the admin. All dependencies are in use.

### ADR-043 — Search overlay and mobile drawer render outside the streamed header
**Date:** 2026-11-13 · **Status:** Accepted
**Context:** Mobile e2e tests were flaky (search overlay and menu tests failed, then passed on retry). Cause: every public page sends a fallback header in its static shell and streams the real header in later (ADR-020). Both headers contained their own search `<dialog>` and mobile-menu `<dialog>`. When the real header replaced the fallback, an overlay the visitor had already opened (easy with Invoker Commands before hydration, ADR-024) was removed from the page together with anything typed into it. Real phone users on slow connections could hit this too.
**Decision:** The header (fallback and real) holds only the buttons. `SiteShell` renders `<SearchDialog />` and `<MobileMenu>` once, outside the header's Suspense boundary. The drawer's static parts (title, close button, company links) are in the shell; categories and contact links stream into it through an inner `<Suspense>` (`MobileMenuContent`, fallback = company links only), so the drawer stays open while they arrive. Following any link in the drawer closes it (one delegated handler). An e2e check asserts the dialogs exist once and not inside `<header>`.
**Consequences:** No layout change. The overlays work from first paint until navigation, whatever the streaming timing.

### ADR-044 — Mobile-first pass: no sideways overflow, Messenger beside WhatsApp everywhere
**Date:** 2026-11-13 · **Status:** Accepted
**Context:** The owner found the site not mobile friendly and asked for a premium, fast, modern look on phones (admin excluded). A review of every public page at 390 px found: the homepage was 608 px wide (sr-only price labels inside the swipe rows escaped their scroll container because no ancestor inside it was positioned), and the old e2e check missed it by comparing with `innerWidth`; "not found" pages for missing products/posts rendered the header and footer twice (the root not-found page wraps itself in SiteShell and was used inside the site layout); the header logo appeared late (separate SVG + a 0.9 s wipe on every load); oversized floating buttons covered prices and text; generous desktop spacing on phones; the homepage journal stacked three screen-tall cards; buttons were not full width. The sales team (10 people) and marketing (2) answer on both Messenger and WhatsApp.
**Decision:**
- Scroll rows (`ProductRail`, `CategoryTiles`, `LatestPosts`, `Gallery`, `SortBar`, Markdown tables) are `relative`. The e2e overflow check uses `clientWidth` on five pages.
- `src/app/(site)/not-found.tsx` renders only the 404 body (`NotFoundContent`); the root not-found keeps SiteShell for unknown URLs.
- Header logo: `preload`, eager, no entrance animation (supersedes the logo wipe in ADR-022's motion note).
- Messenger next to WhatsApp everywhere a WhatsApp action exists: floating pair, product page (button + sticky bar icon), homepage help band, contact and about pages. New `messenger` button variant.
- Phones: floating buttons 44 px above the safe area (`viewportFit: cover`); sticky product bar respects the safe area; section padding `py-12`; headings keep "View all" on their row; button groups full width; journal swipe row on the homepage and compact rows on /blog; tighter product grid; short sort labels ("Lowest price", "Highest price"); text-only hero without empty space or the stray decorative line; gallery placeholder full bleed.
**Consequences:** No new dependencies, no new client components except reusing existing ones; slightly less JS (no logo animation CSS). Pages feel shorter and calmer on phones. The owner should still upload hero, category and product photos: the layout is designed around them.

### ADR-045 — Mobile header logo reads "Artifex Furniture" on one line
**Date:** 2026-11-13 · **Status:** Accepted
**Context:** The owner asked for the mobile header logo to say "Artifex Furniture" inline, in the same style as the logo. The wordmark SVG is one red path (A + RTIFEX + underline); no font file for the logo lettering exists, so new words can't be drawn as matching paths.
**Decision:** A `lockup` variant of `Logo`: the wordmark (32 px) followed on the same line by "FURNITURE" as real text in the logo red (`text-brand`), bold uppercase sans with slight tracking (`text-logo-word` utility), sized and offset so its cap height and baseline match "RTIFEX" (checked at 390 px). Mobile header only; the desktop header keeps the 40 px wordmark. The link keeps its "Artifex Furniture, home" label; the text is `aria-hidden`.
**Consequences:** No new asset or request; the lockup is 172 px wide and fits between the menu and search buttons from 360 px. If the owner later supplies an official "Artifex Furniture" lockup SVG, it replaces this variant.
**Amended 2026-11-14:** the F of "FURNITURE" is enlarged (1.6×, `text-logo-first`, line height 0 so the baseline stays shared), echoing the oversized A of ARTIFEX. (A utility named `text-logo-initial` was silently dropped by Tailwind, probably because "initial" is a CSS keyword; hence "first".)

### ADR-046 — Delivery challan maker: built and printed in the browser, never stored
**Date:** 2026-11-14 · **Status:** Accepted
**Context:** The sales team hands customers a delivery challan with each order. The owner asked for an admin tool that fills in customer, items (picked from the products), quantities and the salesman, prints a premium document in the style of the shop's printed letterhead (logo left; address, numbers and email right; red rule; faint watermark) with signature lines and a thank-you note, and keeps no record.
**Decision:** `/admin/challan` (admin-only page) loads only product names and the letterhead details (`challan.service`). `ChallanMaker` keeps the draft in React state; `ChallanSheet` renders the A4 sheet for both the on-screen preview and a print copy portalled directly under `<body>`. Print CSS shows only that copy (`body:has(> #challan-print-root) > :not(#challan-print-root)` hidden) on a named `@page challan` (A4, zero margin, exact colours), so other pages' printing is unaffected. The sheet is exactly one A4 page (fixed 210 × 297 mm, overflow hidden); the form watches the preview (MutationObserver) and blocks printing when content would overflow, with up to 10 item rows. There is no challan number (owner's choice); the date defaults to the Dhaka day of the server's request time, so server and browser render the same value. Letterhead numbers, email and website are fixed in `CHALLAN_LETTERHEAD` (01757758388, 01716498858; artifexdecoryourdreams@gmail.com; www.artifexfurniturebd.com), not taken from Settings. No server action, database table or browser storage; the form resets on `afterprint` and on "Clear".
**Consequences:** No audit trail or reprint: a lost challan has to be re-entered (by design). Product names are sent to the admin page (≤ 2000). Pure helpers in `src/lib/challan.ts` are unit-tested; an e2e test fills the form, checks the preview, emulates print media (only the sheet visible), stubs `window.print` and checks the reset.

### ADR-047 — Launch on artifexfurniturebd.com with a fresh database and a new Cloudflare account
**Date:** 2026-11-14 · **Status:** Accepted
**Context:** The owner bought the official domain **artifexfurniturebd.com**, new **Namecheap cPanel** hosting and a separate **Cloudflare account** for R2. The test site (`artifex.codespherestudio.site`, ADR-019) holds demo content.
**Decision:** Start the official site **fresh** (owner's choice): no database or image copy; the first deploy's idempotent seed creates the default categories, business settings (now including `artifexdecoryourdreams@gmail.com` as the contact email) and the admin; real content is entered in the admin. The domain's DNS moves to the new Cloudflare account (required for the R2 custom domain `media.artifexfurniturebd.com`); website records stay DNS-only so cPanel AutoSSL works. The existing GitHub **production** environment is re-pointed to the new server (new SSH host/user/known hosts, new DB URL, new admin secrets) and the repository variables become `NEXT_PUBLIC_SITE_URL=https://artifexfurniturebd.com`, `NEXT_PUBLIC_MEDIA_URL=https://media.artifexfurniturebd.com`, `HEALTHCHECK_URL=https://artifexfurniturebd.com`. A new `AUTH_SECRET` and R2 token are created. No code changes are needed beyond defaults: the domain comes from env (Server Action origins, canonical URLs, sitemap, CSP media host). The step-by-step checklist is `docs/PRODUCTION-LAUNCH.md`.
**Consequences:** The test site stops receiving deploys and should be retired after launch (avoid duplicate indexing). A separate staging environment can be added later as a second GitHub environment if needed.
**Amended 2026-11-14 (live):** the owner set the website records to **Proxied (orange cloud)**. That's fine: the origin has a valid AutoSSL certificate (SSL.com, until May 2027), so Cloudflare SSL mode **Full (strict)** is correct; login rate limiting and visit counting already read `CF-Connecting-IP`. The HTTPS and www → apex redirects are in `public_html/.htaccess` (above Passenger's block, marked ARTIFEX-REDIRECTS) and are loop-safe in any SSL mode (they also accept `X-Forwarded-Proto: https`).

### ADR-048 — Homepage hero slider: autoplay loop, mobile stacked layout (supersedes ADR-039's "no autoplay")
**Date:** 2026-11-15 · **Status:** Accepted
**Context:** The owner found the hero premium on desktop but poor on phones, and asked for an endless, smoothly animated loop without arrows. On phones the landscape photos were cropped to a tall frame (furniture cut off) and enlarged several times; the uploaded photos are only 452 × 254 px. AGENTS.md §5, 05 §1 and ADR-039 ruled out autoplaying carousels.
**Decision:** The owner's explicit request overrides the "no autoplay" rule **for the homepage hero only**. `HeroSlider` advances every 6 s in an endless loop with a 1.2 s crossfade and a slow 7 s zoom on the photo being shown (CSS, transform only). Arrows and the counter are removed; dots (44 px targets) and a pause/play button remain (WCAG 2.2.2), swipe still works. It pauses while hovered or focused, waits while the tab is hidden, restarts its timer after a manual change, and doesn't play (and hides the pause button) under `prefers-reduced-motion`. Layout: phones show the photo as a 4:3 band (16:9 from sm), dots under it on ivory, then the heading and full-width buttons in ink on ivory; from md the original full-bleed photo with scrim and light text, dots bottom right. The first photo stays the preloaded LCP image and is never faded in.
**Consequences:** One timer and a matchMedia subscription on the homepage (no new dependency). AGENTS.md §5, 05 and 03 note the exception. The photos should be re-uploaded at 1600 px wide or more (the admin hint already says so); the current 452 px files look soft on large and high-density screens whatever the layout.
**Amended 2026-11-15:** the owner preferred the text over the photo on phones too, in a shorter frame, and no pause button. Phones now use a 5:4 frame (16:9 from sm) with the photo behind compact text (`text-h2` heading, small subheading, two 40 px buttons side by side; crop anchored right of centre) and light dots at the bottom; md+ is unchanged. The pause button is removed at the owner's request: the slider still pauses on hover/focus, in background tabs, and never plays under reduced motion, but touch users have no explicit stop control (a WCAG 2.2.2 gap the owner accepted).
**Amended 2026-11-15:** with the site proxied, Cloudflare answers GitHub's runners with 403 (bot protection), so the deploy health check now asks the server directly (`curl --resolve <host>:443:$SSH_HOST`), still using the real hostname and verifying its certificate. Stale **environment-level** variables (`HEALTHCHECK_URL`, `NEXT_PUBLIC_*` with the test site's values) were deleted; they override repository variables in the deploy job.

### ADR-049 — Mobile homepage refinements: stacked hero, 3-column collections, compact footer, smaller section titles
**Date:** 2026-11-15 · **Status:** Accepted
**Context:** On phones the hero text over a 5:4 photo (ADR-048's 2026-11-15 amendment) still hid much of the wide, low-resolution photos, the collections swipe row showed only two or three categories at a time, the footer was long, and section titles at `text-h2` felt heavy on small screens. The slow hero zoom also snapped back visibly: the keyframe animation was removed from the outgoing photo while it was still fading out.
**Decision:** This supersedes ADR-048's amendment about the phone hero layout; ADR-048's autoplay loop (6 s per photo, 1.2 s crossfade, no arrows, no pause button, pause on hover/focus and in background tabs, no play under reduced motion) is kept. Phones show the photos as a short 16:9 band (about 220 px tall at 390 px wide) with the dots centred at the bottom of the photo; the eyebrow, heading (`text-h2`), small subheading and two compact buttons side by side sit below the photo on ivory in ink colours. From md the photos fill the hero (min-height 78vh) with white text over a solid scrim; dots are centred at the bottom of the photo on all sizes. The zoom is now a CSS transition on the image (scale 1 → 1.06 over 7 s when a photo becomes active); the outgoing photo keeps its zoom while it fades and resets only after the fade (delay 1.3 s, duration 0). The `hero-zoom` keyframes and `animate-hero-zoom` utility are removed; no zoom under reduced motion. Collections become a 3-column grid of square tiles with small names on phones and tablets, 6 columns of 4:5 tiles from lg. Category line icons are shared in `src/components/site/category-icons.tsx` (`CategoryIcon`, plus a custom `DiningTableIcon`, since lucide has no furniture table icon); the mobile menu drawer uses them for categories without a photo. The footer is compact: centred on phones, smaller logo (h-11), two-line description, social icons, one-line address, phone and WhatsApp as 44 px pill buttons, email link, `py-8 md:py-10`, two columns from md, bottom line centred on phones. A new type token `text-section` (serif 500, 24/30 on phones, 32/40 from md) is used by `SectionHeading` for section titles.
**Consequences:** More of each photo and more categories are visible on phones, and the page is shorter. No new dependency. 03 and 05 are updated; `text-h2` remains for feature headings (brand intro, WhatsApp band, product description) and the phone hero heading.


### ADR-050 — Homepage: no visible Collections heading, phone footer without call buttons, story card on phones
**Date:** 2026-11-15 · **Status:** Accepted
**Context:** The owner pointed out that the phone footer repeated the phone and WhatsApp buttons already shown as floating buttons, that the Collections heading and its "All furniture" link repeated the hero's "Browse products" button right above the tiles, that the two hero buttons left empty space on the right on phones, and that the story section looked plain on phones. The owner also wanted © on the left and the developer credit on the right (credit below © on phones).
**Decision:** The Collections heading is removed visually on all sizes; a screen-reader-only `h2` "Collections" keeps the section labelled and the heading outline intact. On phones the hero's two buttons share the full width (`flex-1`, 44 px tall); md+ is unchanged. The footer's phone and WhatsApp pill buttons show from md only; on phones the footer is logo, two-line description, social icons as round outlined buttons, a short walnut rule, the address (icon above, centred) and the email with an icon. Bottom line: © first (left from sm), developer credit second (right from sm, below © on phones). On phones the brand intro is one centred sand card: small logo, walnut rule, eyebrow, `text-section` heading, body text and an outlined pill "Our story" link; md+ keeps the logo panel beside the text. This changes ADR-049's footer and collections notes.
**Consequences:** Phones keep calling and WhatsApp through the floating buttons (ADR-044). No new dependency or token. 05 is updated.

### ADR-051 — Phone hero: text over the photo band, buttons below, tighter dots
**Date:** 2026-11-15 · **Status:** Accepted
**Context:** After ADR-049/050 the owner wanted the hero title and description back over the photo on phones, with only the buttons outside the slider, and the dots a little closer together and lower.
**Decision:** `HeroSlider` takes the text as `children` and the buttons as `actions`. On phones the photos, a solid `bg-ink/45` scrim and the dots fill a band (min-height 60vw, grows with longer text) holding the eyebrow, `text-h2` heading and small subheading in white; the buttons follow below on ivory, sharing the full width. Phone dots use 24 × 32 px targets (about 24 px apart) at the band's bottom edge. From md the band wrapper is static, so the photos cover the whole hero behind the text and buttons, unchanged (dots keep 44 px targets, `bottom-4`). This supersedes ADR-049's phone hero layout (text below the photo).
**Consequences:** No new dependency. 05 is updated. Phone dot targets meet WCAG 2.5.8 (24 px) rather than the 44 px used elsewhere.

### ADR-052 — Phone homepage: one standard section spacing, help band as an inset card
**Date:** 2026-11-15 · **Status:** Accepted
**Context:** On phones the homepage sections used mixed vertical padding (8–48 px), and the owner asked for one standard space between sections, the help band ("Not sure what fits your space?") inset with space around it like the story card (ADR-050), and no location icon in the phone footer.
**Decision:** On phones every homepage section below the hero uses `py-8` (32 px top and bottom, so 64 px between two plain sections and 32 px from a section edge to its content); the hero's button row has no bottom padding, so the 32 px of Collections sets the gap. The help band becomes a sand card inside the container (`px-6 py-10`, `text-section` heading, `text-body` text) on an ivory section; from md it stays the full-width sand band. The footer's map-pin icon is hidden on phones (address text only). md+ spacing is unchanged.
**Consequences:** No new token or dependency. 05 is updated.

### ADR-053 — Phone homepage: single 32 px section gap, no floating buttons
**Date:** 2026-11-15 · **Status:** Accepted
**Context:** ADR-052 gave every phone section 32 px top and bottom padding, so two neighbouring sections added up to 64 px, which the owner found too much. The owner also asked to remove the floating Messenger/WhatsApp buttons from the homepage on phones (the hero buttons and the help card already offer contact).
**Decision:** This supersedes ADR-052's spacing rule. On phones each homepage section adds only top padding (`pt-8`); the tinted New arrivals rail keeps `py-8` inside its sand and a `mt-8` margin; a wrapper around the sections adds `pb-8` before the footer. So the space between any two sections, or between a section and a sand band's edge, is 32 px. The homepage renders a hidden `data-hide-whatsapp-fab` marker, which the existing CSS rule uses to hide the floating buttons on phones (as on product pages); desktop keeps them. md+ spacing is unchanged.
**Consequences:** No client JS added. An e2e test checks that the floating buttons are hidden on the phone homepage and still shown on other pages. 05 is updated.

### ADR-054 — No product colours; product saves return to the catalogue list
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner confirmed products have no colour variations, so the colour rows in the admin form, the swatches on product pages and the `{color}` WhatsApp placeholder were unused. The owner also asked that saving a product (new or edited) goes back to the product list instead of staying on the form.
**Decision:** Remove colours everywhere. Migration `20261116000000_drop_product_colors` drops the `ProductColor` table and strips `{color}` from the saved WhatsApp product template; the schema, Zod schema (`colors`, `MAX_COLORS`), repositories, search text, WhatsApp builder (placeholders are now `{business}`, `{product}`, `{price}`, `{url}`), product page, admin form, seeds and tests no longer mention colours. This supersedes F1.4 and the colour parts of F2/F3. The create and edit product forms now redirect to `/admin/products` after a successful save, with the toast ("Product created. Open it to add photos." / "Product saved."). This supersedes the "Save and add photos" step of ADR-034: photos are still added on the edit page (open the product from the list). Duplicate still opens the copy's edit page.
**Consequences:** One destructive migration (colour rows are deleted; nothing else). Existing products keep any old colour names in `searchText` until they are saved again or their category is renamed (harmless: searching a colour name may still match). The product page ships slightly less client JS.

### ADR-055 — Premium admin theme: Manrope, espresso sidebar, gold accent, CSS motion
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner asked for a more premium, animated admin with a premium font and colours, and a sidebar that stays fixed instead of scrolling with the page.
**Decision:** Admin only (the public site is unchanged). `src/app/admin/layout.tsx` loads **Manrope** with `next/font` (self-hosted, admin routes only) and sets `.admin-root`, which swaps `--font-sans` to Manrope and softens the radii (6 px / 10 px) for everything inside the admin; page titles stay Cormorant. New tokens in `globals.css`: `espresso`, `espresso-soft`, `espresso-line`, `espresso-muted` (sidebar), `gold` / `gold-dark` (accent; `gold-dark` is 4.8:1 on white for text and icons), and `shadow-card` / `shadow-lift` / `shadow-float` (admin elevation). New utilities: `admin-card` (white card with border, 14 px radius and soft shadow), `admin-lift` (hover lift), `admin-canvas` (ivory with a faint warm glow), `admin-sidebar`, `admin-nav-link` (gold active bar), and CSS-only animations `animate-admin-page` (each page fades up via `src/app/admin/(panel)/template.tsx`), `animate-admin-nav` (staggered sidebar items on first load), `animate-admin-line` (gold rule above page titles), `animate-admin-pop` (toasts, login card) and `admin-stagger` (cards and list rows). The desktop sidebar is `position: fixed`, full height, `overflow: hidden`, with row heights that scale with the viewport height (`clamp(2.25rem, 5.4vh, 2.75rem)`) so it fits down to ~600 px tall screens; only the main area scrolls. The mobile top bar and drawer use the same espresso style. All motion is off under `prefers-reduced-motion` (existing global rule). No animation library, no new runtime dependency.
**Consequences:** The admin downloads one more font (Manrope, latin subset). Shadows exist only in the admin. 03 is updated.

### ADR-056 — Publish/unpublish switch on the product list
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner wants to switch a product between Draft and Published from the catalogue list, without opening the edit form.
**Decision:** Each row on Admin → Products shows a switch (`ProductStatusToggle`, a `role="switch"` button with `aria-checked`, labelled "Published: “<title>”") in place of the status badge. It calls `setProductStatusAction(id, status)` → `requireAdmin()` → Zod (`idSchema`, `productStatusSchema`) → `setProductStatus` service → `findProductStatus` / `writeProductStatus` repo, then revalidates like any product save (`products`, `home`, `categories`, `product:<slug>`). The first publish stamps `publishedAt`; going back to draft keeps it (same rule as the form). The switch flips optimistically (`useOptimistic`), shows a toast, and reverts on failure. A published product whose category is hidden says so in its row ("Hidden: its category is hidden").
**Consequences:** No new dependency or token. Unit tests cover the service; the products e2e test unpublishes and republishes from the list. 07 is updated.

### ADR-057 — Every product image is square (1:1)
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** On desktop the product page gallery used a 4:3 frame (ADR-035) with `object-cover`, so square product photos lost their top and bottom and looked wrong; phones already showed 1:1. The owner wants product images placed 1:1 everywhere.
**Decision:** This supersedes ADR-035's desktop gallery ratio. Every product image frame is `aspect-square` at all sizes: the product page gallery (main image, empty placeholder and loading skeleton), thumbnails, product cards (already 1:1), the search overlay results (was 4:5) and the admin product Photos preview (was 4:3). Images keep `object-cover`, so non-square uploads are trimmed at the edges; the admin Photos panel tells the owner square photos look best. Category, banner, hero and blog images keep their own ratios (they aren't product images).
**Consequences:** On desktop the main gallery image is about 620 px square at 1440 px wide (the column width is unchanged). No new token or dependency. 03 is updated.

### ADR-058 — Shrink and re-encode photos in the browser before upload, with retries
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner reported that some photos fail with "Check your connection and retry" while others from the same batch upload fine, and that editing a failing photo slightly and saving it again makes it upload. That message only appears when the request itself fails before the Server Action answers (server-side validation errors come back as normal messages). The likely causes on Namecheap shared hosting are the host's request firewall (ModSecurity) rejecting particular file bytes, which a re-save changes, and large phone/camera photos (5–10 MB, 12–48 MP) that take long to send and are heavy for sharp within the account's memory limit. Server logs couldn't be read from this session, so the fix covers both causes.
**Decision:** `src/lib/prepare-upload.ts` (no new dependency: `createImageBitmap` + canvas) resizes every chosen photo in the browser to at most **2400 px** on the longest side (EXIF rotation applied) and re-encodes it as WebP (quality 0.9; JPEG on white where the browser can't encode WebP). If preparation fails, the original file is sent as before. `sendImageWithRetry` sends it and, if the request throws (not when the server returns an error), retries twice after 1.5 s and 3 s, each time with a fresh re-encode at quality 0.86 then 0.82 (different bytes). After three failed requests the admin sees a specific message (check the connection; if only this photo fails, save it again as JPEG). Used by the photo manager (product photos, hero slides; shows "Retrying (try 2 of 3)…"), the Journal's "Insert image", and `AdminForm` for single-image fields (categories, banners, hero, SEO image), where only forms that carry an image are retried, so other saves are never sent twice. The browser now accepts originals up to **40 MB** (they're shrunk first); the server limit stays 10 MB per request and the server still validates every file with sharp. On the server, `processImage` now decodes once, rotates and shrinks straight to the largest variant (1600 px) as raw pixels, then makes the three WebP variants from that, instead of re-encoding the full-resolution original first.
**Consequences:** Uploads are typically 10–50× smaller and faster, and server memory per upload is far lower. Stored images are unchanged in size (the largest variant is still 1600 px). Photos are re-encoded twice (browser, then server), with no visible loss at these qualities. If uploads still fail after this, the next step is to read the cPanel error log for ModSecurity hits and ask Namecheap to whitelist the rule for `/admin`.

### ADR-059 — Specs replace SKU/material/dimensions; dining-table default specs; product form layout
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner asked for default specification rows for dining tables, for SKU, material and dimensions to be handled as specifications rather than separate fields, for the Details section to go (keywords and Made to order into the first section), for Save to be always visible at the top right, and reported that the SEO title and description "didn't update". No custom SEO title was found on any live product. Two real gaps were found: link previews (`og:title`/`og:description`) always used the product title and short description, ignoring the SEO fields; and Next keeps previously visited pages mounted (hidden) and reuses them, so a reopened edit form could show and resubmit stale values (for example after a status change from the list switch, or SEO fields typed in an earlier visit).
**Decision:**
- **Schema:** migration `20261116100000_specs_replace_sku_material_dimensions` copies existing `sku`, `material` and `dimensions` values into `ProductSpec` rows labelled SKU / Material / Dimensions (skipped when the product already has that label), then drops the three columns (their indexes go with them; nothing is named, see ADR-054). Search text now indexes specification **values** (not labels) instead of material. The product page's quick facts read the Material and Dimensions spec rows; the JSON-LD `sku` reads an optional "SKU" spec row. The SKU uniqueness check is gone.
- **Default specs:** `defaultSpecsFor("dining-tables")` returns Product Name, Product Type, Material, Tabletop, Seating Capacity, Number of Chairs, Chair Upholstery, Surface Finish, Color & Design, Style, Room Type, Usage. A new product gets these rows when its category is Dining Tables, and switching category swaps them only while every row value is still empty (typed work is never replaced). They are ordinary rows: the admin can remove any; every row that stays needs a value (existing validation), so the product can't be saved with an empty one. Removed defaults can be added back with Quick add. Existing products are never auto-filled.
- **Form:** sections are Basic info (now also Search keywords and Made to order), Pricing, Specifications, Visibility, Search engines (no longer collapsed). The Details section is gone. On the product pages Save sits in a slim sticky top bar (`AdminSaveBar`: breadcrumbs left, Save right); `AdminForm` renders its button there through a portal (`submitSlot`, `form` attribute), keeping the pending state. Other admin forms keep the sticky bottom bar.
- **SEO fixes:** Open Graph title/description use the SEO fields when set. The edit form is keyed on the product's `updatedAt`, so a cached or restored page re-mounts with the saved values.
**Consequences:** One migration that changes data (values are preserved as spec rows; nothing is lost). Up to three extra spec rows per existing product (they count toward the 40-row limit). Google only shows a new SEO title after it recrawls the page.

### ADR-060 — One SEO description per product; the product page shows only the full description and specs
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner finds the short description under the buttons on the product page unnecessary. They want the short description and the SEO description to be the same thing, used only for search engines, and the product page to show just the full description and the specifications.
**Decision:** `Product.shortDescription` (VARCHAR 300, required) is now the product's **SEO description**: the meta description, Open Graph/link-preview description and JSON-LD description. It's edited in the admin's Search engines section as "SEO description" (required, counter, Google-style preview), no longer in Basic info. Migration `20261116200000_product_seo_description_merge` copies any separately typed `Product.seoDescription` into `shortDescription` (it wins), then drops `Product.seoDescription`. Categories and posts keep their own optional `seoDescription`. The product page no longer shows the short description or the quick facts (Material/Dimensions, which repeat the specs table): the info block ends with the WhatsApp/Messenger/call buttons, and below it are the full description and the specifications. This supersedes the short-description and quick-facts parts of ADR-059, 05 and F1.2.
**Consequences:** One migration that changes data (a typed SEO description replaces the short description; nothing else changes). Google shows about 155 characters, so the hint suggests one or two sentences; up to 300 are allowed so existing text stays valid.

### ADR-061 — Phone footer trimmed; product page spacing; single-photo gallery fix
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner asked for a simpler phone footer (logo, then address, email and social icons; no copyright section), a product page without the visible "Description" heading, less space above the rule and above the related products, and only "You may also like" on the related section. They also reported that on desktop a product with a single photo showed it as a tiny thumbnail.
**Decision:**
- **Footer (phones only):** logo → address → email → social icons, centred; the short description and the © line are hidden below `sm`/`md`. The developer credit line stays. md+ is unchanged (social icons stay under the description there; the icons render once per layout, `md:hidden` / `hidden md:flex`).
- **Product page:** the description starts right under the horizontal rule; its "Description" heading is screen-reader only. Space above the rule drops from 64 px to 40 px (48 px from md) and below it from 48 px to 32 px (40 px from md). The related section is headed "You may also like" (the "Related pieces" title is gone) and sits 48 px (56 px from md) below the specs instead of 80 px.
- **Gallery:** the desktop two-column layout (thumbnail strip + main photo) only applies with 2+ photos; with one photo the main image fills the column. Previously it was placed in the 5.5 rem thumbnail column.
**Consequences:** No new token or dependency. 05 is updated.

### ADR-062 — No Quick add buttons for specifications
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner asked to remove the Quick add specification buttons from the add/edit product page.
**Decision:** The specs editor no longer shows Quick add buttons; rows are added with "Add specification" (type the label and value). The per-category quick-add lists and `specPresetsFor` are removed. Default rows for Dining Tables (ADR-059) stay; a removed default row is added back with "Add specification". This supersedes the quick-add part of 07 §3.2 and of ADR-059.
**Consequences:** Less code in the product form. The e2e test adds its specification row by hand.

### ADR-063 — Custom-quote card instead of "Price on request" on the product page
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** Most Artifex products have no fixed price: they're made to the customer's size, fabric and finish, so the price fields are usually left empty. The product page then showed a bare "Price on request" line and, separately, a "Made to order" badge. The owner asked for something more premium that invites the customer to ask for a price based on their customisation.
**Decision:** When `regularPrice` is empty, the product page shows `CustomQuoteCard` in place of the price and the Made to order badge: a **compact** sand card (about 130 px tall on a phone) with a walnut accent bar, serif heading "Priced to your design", one line ("Made to order: message us for a quote based on your customisation.") and three short points with icons on one line (Your size · Fabric & finish · Free quote). The buttons right below it read "Get a quote on WhatsApp" / "Get a quote on Messenger" (also the mobile sticky bar), and the mobile bar and the `{price}` message placeholder say "Custom quote". Products with a price are unchanged (price display, plus the Made to order badge line when that box is ticked). Listing cards and search keep the short "Price on request"; JSON-LD keeps omitting the offer. The admin Regular price hint and the "Shown on the website as" preview explain that a blank price shows the quote card. The Made to order checkbox stays for priced products.
**Consequences:** No new token or dependency (lucide icons Ruler, Palette, BadgeCheck). The card stays flat, like the rest of the public site. 05, 06 and 03 are updated.

### ADR-064 — Compact phone footer
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** After ADR-061 the owner found the phone footer still too tall: a decorative rule under the logo, extra space between lines, and space above and below the social icons.
**Decision:** Phones only: the walnut rule under the logo is removed; the footer's vertical gaps go from 24 px to 12 px and its padding from 32 px to 24 px; address and email have no extra gap and the email row is 32 px tall (was 44 px); social icons are 40 px circles (44 px from md) with a small negative top margin; the credit bar is 8 px top/bottom with a 32 px link row. Tap targets stay at least 32 px (WCAG 2.5.8 asks for 24 px). md+ is unchanged.
**Consequences:** No new token or dependency. 05 is updated.

### ADR-065 — No breadcrumbs on the phone product page
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner asked to remove the browsing path (Home / Category / Product) from the product page on phones.
**Decision:** On the product page the visible breadcrumbs are hidden below md (`hidden md:block`) and the title moves up to sit right under the gallery gap; from md they show as before. The BreadcrumbList JSON-LD is unchanged, so search engines still get the path. The category stays reachable from the header menu.
**Consequences:** No new token or dependency. 05 is updated.

### ADR-066 — Challan as a gate pass: larger letterhead, optional driver details
**Date:** 2026-11-16 · **Status:** Accepted (extends ADR-046)
**Context:** The owner wanted the challan to double as the gate pass for the delivery vehicle, with the letterhead logo and contact details a little larger. The longer title at the old h2 size would run into the Salesman/Date block.
**Decision:** The sheet title is "Delivery Challan / Gate Pass" at the `text-h3` size (one line, never wrapping); the Salesman/Date block does not shrink. The logo is 24 mm tall (was 20 mm) and the address/cell/email use `text-body` (was `text-small`). The draft gains `driverEnabled` (off by default), `driverName`, `driverPhone` and `vehicleNumber`; when enabled, a compact "Driver & vehicle" row of three columns prints under the items, with empty values left blank on a dotted line to fill in by hand. None of the driver fields is required. Space above the signatures (pt-12) and the footer band (mt-8) is trimmed slightly so 7 items with notes still fit with driver details on. Still nothing is stored (ADR-046).
**Consequences:** About one item row fewer fits on the page than before; the existing overflow check still blocks printing when content would run past the A4 page, and its message now also suggests turning off driver details. No new token or dependency.

### ADR-067 — Invoice maker, built like the delivery challan
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner wants to print invoices (bills) for customers, with the same letterhead and footer as the delivery challan, along the lines of their current hand-made bill: customer, itemised rows with quantity, unit, unit price and line total, then total, advance and due.
**Decision:** A new admin page **Admin → Invoice** (`/admin/invoice`), working exactly like the challan (ADR-046): filled and printed in the browser only, no server action, no table, no browser storage; the form clears after printing (`afterprint`) and "Clear". The challan's letterhead, watermark, red rule, red website band, A4 sheet class and overflow check move into `components/admin/print/Letterhead.tsx`, used by both sheets (the challan looks the same). Pure helpers in `lib/invoice.ts` (amount parsing with up to two decimals and lakh commas, line totals, totals, `invoiceProblems`, lakh-grouped `formatAmount`), unit-tested against the owner's sample bill (৳ 1,40,170 total, ৳ 10,000 advance, ৳ 1,30,170 due).
- **Form:** customer name (required), phone and address (optional); up to 15 items, each with a description (product type-ahead or free text), quantity (decimals allowed), unit (suggestions pcs/set/yds/feet/sft/rft/meter/kg, or any text) and unit price, with the line total shown; discount and advance (optional) with a live summary; date and optional invoice number.
- **Sheet:** letterhead → "Invoice" with a brand-red accent, invoice no. (when set) and date → "Bill to" with dotted leaders → table (SL, Description, Qty, Unit, Unit price, Total) → right-aligned Subtotal, Discount and Advance paid (only when set, as "− ৳"), and a bold **Amount due** on sand → customer's and authorised signatures → red website band. One A4 page; the form warns when it would overflow.
- **Print:** a copy portalled under `<body>` as `#invoice-print-root`; the print CSS now covers both roots. Sidebar gains "Invoice" (ReceiptText icon); sidebar rows scale down to 32 px on short screens so nine items still fit without scrolling.
**Consequences:** No new dependency, token or table. Nothing is kept: to keep a copy the admin uses "Save as PDF" in the print dialog. Numbering is manual (optional field) because nothing is stored. An e2e test covers fill → totals → print → clear.

### ADR-068 — Tighter phone product page; footer clears the phone product bar
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** The owner wanted the phone product page more compact (less space above and below the rule, the same small space before Specifications and before "You may also like"), and noticed the social icons in the footer sat right against the fixed price/contact bar at the bottom of phone product pages.
**Decision:** This supersedes ADR-061's phone spacing. Phones: 24 px above and below the rule (was 40 / 32 px), 24 px between the description and Specifications (was 40 px) and 24 px before "You may also like" (was 48 px). md+ is unchanged. The product's sticky bar carries `data-product-bar`; below lg, a footer on a page with that bar gets bottom padding equal to the bar (4.5 rem + safe area), so the bar never covers the social icons or the credit line. The phone footer's brand/contact block also gets 32 px below the social icons (was 24 px).
**Consequences:** No new token or dependency. 05 is updated.

### ADR-069 — Quote card wording: "Ask for price", showroom mention
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** "Price" reads more naturally than "quote" for most Bangladeshi customers, and the card's line repeated "Made to order" and didn't mention the showroom.
**Decision:** This updates ADR-063's wording. The buttons under the card read "Ask for price on WhatsApp" / "Ask for price on Messenger" (also the phone sticky bar's Messenger label). The card's line reads "Every piece is made to your size and finish. Message us for your price, or visit our Uttara showroom." Heading and the three points are unchanged.
**Consequences:** Copy only. 03 and 06 are updated.

### ADR-070 — One workflow run per deploy (CI no longer runs on push to main)
**Date:** 2026-11-16 · **Status:** Accepted
**Context:** Every "commit and deploy" started two runs: CI on the push to `main`, and the manually started Deploy, which runs the same CI again before deploying. The owner wants exactly one run.
**Decision:** `ci.yml` no longer triggers on push to `main`; it runs on pull requests, when called by `deploy.yml` (`workflow_call`), and by hand (`workflow_dispatch`, "Run workflow"). Deploy is unchanged: started by hand, CI first, then the release. So a push followed by a deploy is a single run that both tests and deploys.
**Consequences:** A push to `main` without a deploy isn't tested automatically; run CI by hand if needed. This supersedes the "runs on every push" note in 10 §5.
