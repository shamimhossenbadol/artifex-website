# 12 — Development Roadmap

Tick `[x]` when a task meets the *Definition of done* (`AGENTS.md` §7). Current status lives in `PROGRESS.md`.
Each phase ends with a short manual review of the phase's acceptance checks.

---

## Phase 0 — Planning & hosting verification
- [x] Review brief, competitors, and constraints
- [x] Write documentation set (AGENTS, PROGRESS, DECISIONS, CHANGELOG, docs/01–12, TESTING)
- [ ] Owner answers the open questions in `PROGRESS.md`
- [x] Node versions confirmed: up to 26 available, so we use 24 LTS (ADR-015)
- [ ] Record the Namecheap plan, RAM/EP/NPROC limits, MySQL version, and SSH availability (10 §1). Plan = Stellar ✅ (ADR-016); SSH ✅; MariaDB 11.4 client seen (confirm server version in phpMyAdmin); glibc 2.28 ✅
- [x] Owner: enable SSH, import + authorize the deploy key (verified 2026-11-12)
- [ ] Owner: add GitHub Secrets (10 §5.1) once the repo exists
- [ ] Hosting smoke test: minimal Next.js standalone + sharp + one R2 upload runs under Passenger
- [ ] Create the MySQL DB/user and SSL in cPanel
- [ ] Cloudflare: move the domain DNS (all records checked), create the `artifex-media` + `artifex-media-dev` buckets, connect `media.<domain>`, create scoped API tokens (10 §6)

**Exit check:** the hosting smoke test passes, or a fallback ADR is recorded.

## Phase 1 — Project foundation
- [x] `git init`, `.gitignore`, `.editorconfig`, `.nvmrc` (`24`), `engines.node` `>=24 <25`, `README.md` dev instructions
- [x] Scaffold Next.js (latest stable, App Router, TS, Tailwind, ESLint, `src/`); record the exact versions in DECISIONS (ADR-018)
- [x] Configure strict tsconfig, path alias, Prettier + Tailwind plugin, ESLint restricted-import rules
- [x] `src/lib/env.ts` (Zod env) + `.env.example` (validated at boot via `src/instrumentation.ts`)
- [x] Prisma + MySQL driver adapter, `schema.prisma` from 04, first migration, `lib/db.ts` singleton (migration applied on MariaDB 11.4 in CI, 2026-11-12)
- [x] Idempotent `prisma/seed.ts` (categories, settings, hero, admin). Runs twice cleanly in CI. Demo products move to Phase 3 (they need the image pipeline)
- [x] `next.config.ts`: standalone, custom image loader, security headers, server action limits
- [x] Vitest + Playwright set up with one sample test each
- [x] `scripts/package-standalone.mjs` producing a deploy bundle (`.tar.gz`). Tested on Windows (bundle boots, 92 MB RSS, exits on bad env); Linux run happens in CI (no WSL on the dev PC)
- [x] `.github/workflows/deploy.yml` + `ci.yml`: build on Linux, upload over SSH, migrate/seed through a tunnel, restart, health check, auto-rollback (ADR-016/017, 10 §5.1). CI ✅ green on first push; Deploy not run yet (needs the production secrets)

**Exit check:** `npm run build` succeeds, and the seed runs on a local MySQL/MariaDB. ✅ Passed 2026-11-12 in CI (MariaDB 11.4 service container, the same version as production).

## Phase 2 — Design system & layout shell
- [x] Tokens in `globals.css` (`@theme`), fonts via `next/font` (+ CSS-only motion utilities, ADR-021)
- [x] UI primitives: Button, Container, Badge, Price, Input/Textarea/Select, Skeleton, SectionHeading, Breadcrumbs (+ ButtonLink, Field)
- [x] Header (desktop + sticky), MobileNav drawer, Footer, WhatsAppIcon, WhatsAppFab
- [x] Root + site layout, `not-found.tsx`, `error.tsx`, skip link (+ `global-error.tsx`)
- [x] Settings service (cached, tag `settings`) feeding the header and footer (request-time, ADR-020)
- [x] A `/_styleguide` page (dev only) showing all primitives

**Exit check:** the layout passes the 360/768/1024/1440 visual check, and keyboard navigation works. ✅ 2026-11-12: checked at 375/390/768/1024/1440 on a local production build with real data; no horizontal scroll; skip link, drawer focus + Esc covered by e2e.

## Phase 3 — Product catalogue
- [x] Repositories + catalog service (list, by slug, related) with cache tags. Home rails move to Phase 6 with the homepage
- [x] Media: image loader (`NEXT_PUBLIC_MEDIA_URL`), key util, `r2.storage.ts` (put/delete with aws4fetch), `image.processor.ts` (sharp variants). Unit tested with mocked R2; a live upload test waits for the R2 buckets
- [x] ProductCard + ProductGrid + Pagination + SortBar (links, ADR-025)
- [x] `/products` and `/categories/[slug]` listing pages (sort, on-sale, pagination, metadata)
- [x] `/products/[slug]` detail: Gallery, ColorSwatches, Price, specs, description (Markdown), related, sticky mobile CTA. Gallery with real photos still to be checked once R2 has images
- [x] `lib/whatsapp.ts` + WhatsApp inquiry button with selected colour (unit + e2e tested)
- [x] Product + Breadcrumb JSON-LD

**Exit check:** F1 and F3 acceptance criteria pass with seeded demo data. ✅ 2026-11-12: 27 e2e tests pass against the demo catalogue (not-found status is 200 + noindex, ADR-025); real-photo gallery check pending R2.

## Phase 4 — Global search
- [x] Search service (normalisation, wildcard escaping, ranking) with unit tests
- [x] `/api/search` route (Zod, cache header)
- [x] SearchOverlay client component (debounce, abort, keyboard; opens before the app bundle loads)
- [x] `/search` results page (noindex, empty state)

**Exit check:** F2 acceptance criteria pass. ✅ 2026-11-12: 20 search e2e tests ("sofa" finds all 26 sofas, AND matching, wildcards literal, < 2 chars → no request/400, keyboard navigation, no-bundle submit).

## Phase 5 — Blog, About, Contact
- [x] Blog service + `/blog` (paginated) + `/blog/[slug]` (markdown, reading time, related, share, Article JSON-LD)
- [x] `/about` from settings
- [x] `/contact` with hours, click-to-load map, directions, OpeningStatus, FurnitureStore JSON-LD

**Exit check:** F4, F5, and F7 acceptance criteria pass. ✅ 2026-11-12: 12 e2e tests (Journal list/post/related/share/JSON-LD, contact details + hours + Dhaka-time open status with a frozen clock + no map iframe until asked, About).

## Phase 6 — Homepage
- [ ] Hero, category tiles, new arrivals, brand intro, featured, promo banners, popular, WhatsApp band, latest posts
- [ ] Hide empty sections. Organization + WebSite JSON-LD

**Exit check:** home Lighthouse mobile ≥ 90 locally (production build).

## Phase 7 — Admin dashboard
- [ ] Auth: password utils, JWT session, `requireAdmin()`, login page, rate limiting, logout / logout everywhere
- [ ] Forced password change on first login + Account page (change password, profile)
- [ ] `scripts/admin-reset-password.ts` CLI
- [ ] Admin shell (sidebar, mobile drawer, toasts, confirm dialog)
- [ ] Dashboard overview + warnings
- [ ] Products: list/filter, create/edit form (all sections), image uploader (sharp variants → R2, reorder, primary, alt, R2 delete on remove), duplicate, delete
- [ ] Categories: CRUD, reorder, toggles
- [ ] Blog: CRUD with Markdown editor + image insert
- [ ] Homepage: hero, promo banners, featured lists
- [ ] Settings: business, contact/WhatsApp (test link), location/map/hours, social, SEO
- [ ] Revalidation wired per 07 §5 (verify each)

**Exit check:** the owner can do every workflow in 07 on a phone, and the auth tests pass.

## Phase 8 — SEO, security & performance hardening
- [ ] `sitemap.ts`, `robots.ts`, canonical audit, OG image check (Facebook Sharing Debugger)
- [ ] CSP + headers verified (securityheaders.com ≥ A)
- [ ] Upload hardening tests (non-image, oversized, key pattern guard on R2 delete); confirm r2.dev is disabled on the production bucket
- [ ] Lint rule audit, `npm audit --omit=dev`
- [ ] Bundle analysis: client JS within budget
- [ ] Optional: WhatsApp click tracking + dashboard "Top inquired"
- [ ] Accessibility pass (axe + manual keyboard/screen reader spot check)

## Phase 9 — Production deployment & QA
- [ ] Build the bundle in WSL/CI, deploy per 10 §5, migrate, seed
- [ ] First admin login → password change → remove `ADMIN_INITIAL_PASSWORD`
- [ ] Owner enters real settings, categories, products, and posts
- [ ] Production smoke test + device testing (TESTING §6–7)
- [ ] PageSpeed Insights on home, category, product, and post pages, with results recorded in PROGRESS
- [ ] Submit the sitemap to Google Search Console. Link the website from the Facebook page
- [ ] Verify R2 image delivery (10 §6.3): cache headers and `cf-cache-status: HIT`
- [ ] Tag release `v1.0.0` in CHANGELOG

---

## Future (not scheduled)
Bangla language · per-colour images · slug redirects table · Cloudflare in front · cookieless analytics · additional admin users with roles · room-based collections ("Living room", "Bedroom") · showroom gallery page · product comparison.
