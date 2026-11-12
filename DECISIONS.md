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

