# PROGRESS.md — Living Project Status

> Update this file at the end of **every** work session (see `AGENTS.md` §2).
> The task-level checklist lives in `docs/12-DEVELOPMENT-ROADMAP.md`. This file holds the *current state*.

---

## Current status

| Item | Value |
|---|---|
| **Current phase** | Phase 8: SEO, security & performance hardening (in progress; Phase 7 done, 7f skipped) |
| **Overall state** | ✅ Phase 1 complete. Code is on GitHub (`shamimhossenbadol/artifex-website`, private); CI is green. ✅ **First deploy succeeded 2026-11-12**: https://artifex.codespherestudio.site serves the placeholder page with security headers (via Cloudflare). Migration applied; seed created 7 categories, settings, hero and the admin (`mustChangePassword = 1`); backup saved in `~/backups`. |
| **Last updated** | 2026-11-13 |
| **Next action** | Owner: Deploy, then try Admin → Products / Journal on your phone, including **Preview** on a draft. Agent: finish Phase 8 (accessibility pass with keyboard + screen-reader spot checks, optional WhatsApp click tracking), then Phase 9 (production domain, PageSpeed, Search Console). |

## Phase overview

| # | Phase | Status |
|---|---|---|
| 0 | Planning & hosting verification | 🟡 Hosting verified over SSH; R2 smoke test waits for the Cloudflare account |
| 1 | Project foundation (scaffold, Prisma, env, design tokens) | ✅ Done 2026-11-12 (CI green) |
| 2 | Design system & layout shell | ✅ Done 2026-11-12 |
| 3 | Product catalogue (listing, detail, WhatsApp) | ✅ Done 2026-11-12 (photos pending R2) |
| 4 | Global search | ✅ Done 2026-11-12 |
| 5 | Blog, About, Contact/Location | ✅ Done 2026-11-12 |
| 6 | Homepage | ✅ Done 2026-11-12 |
| 7 | Admin dashboard | ✅ Done 2026-11-13 (7f skipped, ADR-037) |
| 8 | SEO, security & performance hardening | 🟡 Preview, sitemap/robots, upload tests, headers, audit, bundle done; accessibility pass next |
| 9 | Production build, deployment & QA | ⚪ Not started |

Legend: ⚪ not started · 🟡 in progress · ✅ done · ⛔ blocked

## Hosting facts confirmed

| Fact | Value | Date |
|---|---|---|
| cPanel Node.js versions | Up to **26** available ("recommended" label on 14.21.3 is ignored) → we use **24 LTS** (ADR-015) | 2026-11-10 |
| Plan | **Stellar**: 1 GB RAM, 50% CPU (200% burst), 20 EP, 50 MB/s I/O (Namecheap published limits; confirm in cPanel → Resource Usage) | 2026-11-12 |
| Deploy method | **GitHub Actions over SSH** (port 21098, key auth); manual upload as fallback (ADR-016) | 2026-11-12 |
| SSH | ✅ Shell enabled (bash). Deploy key `artifex-deploy` (ed25519) works on port 21098, user `shamimhossen`, server `198.54.125.98` | 2026-11-12 |
| OS / kernel | CloudLinux 8 (`4.18.0-…lve.el8`), x86_64, 24 host CPUs | 2026-11-12 |
| glibc / OpenSSL | glibc **2.28** (sharp needs ≥ 2.26 ✅; Node 24 needs ≥ 2.28 ✅) · OpenSSL **1.1.1k** (Prisma target `rhel-openssl-1.1.x` if a native engine is ever needed) | 2026-11-12 |
| Node binaries | `/opt/alt/alt-nodejs24` = **v24.22.2** ✅ (also 26.13.0). Bare Node RSS ≈ 47 MB | 2026-11-12 |
| Database | **MariaDB 11.4** client on the server (server version to confirm in phpMyAdmin; ≥ 10.6 required) | 2026-11-12 |
| Server tools | curl, tar, unzip, **rsync**, **mysqldump**, git all present → deploy workflow can use rsync + mysqldump | 2026-11-12 |
| Outbound HTTPS | ✅ cloudflare.com 200, api.cloudflare.com reachable, npm registry 200. R2 endpoint test pending real bucket/account ID (a fake ID fails TLS from any machine, so that's expected) | 2026-11-12 |
| Account contents | Main domain `codespherestudio.site` (unrelated live site in `public_html`; DNS on **Cloudflare**). Server hostname `server355.web-hosting.com`. Never touch `public_html` | 2026-11-12 |
| Test deployment (ADR-019) | ✅ Subdomain `artifex.codespherestudio.site` created (docroot `~/artifex.codespherestudio.site`), Node 24 app `~/artifex-app` (startup `server.js`, production, env vars set), DB + user `shamimhossen_artifex` (utf8mb4, privileges on this DB only), secrets in `~/artifex-secrets.txt` (chmod 600). App answers 200 on the server. **Needs a Cloudflare DNS record** `artifex` → `198.54.125.98` before it's public | 2026-11-12 |
| AutoSSL | Can't be triggered from the account (feature disabled); Namecheap runs it automatically. Cloudflare proxy (orange cloud) gives HTTPS immediately | 2026-11-12 |
| Artifex production domain | Not chosen yet; production hosting comes later (open question #2) | 2026-11-12 |
| Cloudflare R2 | ✅ Buckets `artifex-media` (custom domain **media.codespherestudio.site**, r2.dev off) + `artifex-media-dev` (r2.dev on). cPanel app has `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=artifex-media` (formats verified, values never printed). **Live test from the server:** PUT 200 → read via media domain 200, `image/webp`, `public, max-age=31536000, immutable`, Cloudflare MISS then **HIT** → DELETE 204. Dev keys not on the dev PC yet (optional) | 2026-11-13 |

## Blockers

- **Directions link (unconfirmed):** if not done yet, paste `https://www.google.com/maps/dir//Artifex+Furniture,+House+02+Road-05,+Dhaka+1230` into Admin → Settings → Location → Directions link (the seed only sets it on fresh databases).
- **Before the first test deploy:** Cloudflare DNS record for `artifex` + GitHub `production` secrets/variables. cPanel side is done (ADR-019). Doesn't block Phase 2.
- No local MySQL/MariaDB or WSL on the dev PC, so DB-backed checks run in CI. Optional: install MariaDB 11.4 locally for `npm run db:migrate` during development.

## Open questions (need the business owner's answer)

Answer these by editing this list. Agents: use the **default** until an answer is recorded.

| # | Question | Default used until answered |
|---|---|---|
| 1 | ~~Which Namecheap plan? SSH?~~ **Answered 2026-11-12: Stellar.** SSH enabled and verified 2026-11-12 (ADR-016) | — |
| 2 | Final production domain and hosting? (`artifexfurniture.com` currently points to someone else's servers.) | Test deploys go to `artifex.codespherestudio.site` (ADR-019) |
| 3 | ~~Logo files?~~ **Answered 2026-11-12:** logo supplied and in use (ADR-022). Brand red refined to `#D2161E` for the web; confirm the owner is happy with that tone | — |
| 4 | ~~WhatsApp, phone, address, hours, map~~ **Answered 2026-11-12:** WhatsApp/phone 01757-758388; House 02, Road 05, Sector 01, Uttara, Dhaka 1230; **every day 10:00 AM – 10:00 PM**; Google Maps embed + coordinates (23.8570, 90.4001); Facebook/Instagram/YouTube. **Still open:** email address | No email shown |
| 5 | Product photos: do professional photos exist? | Seed with placeholder images; real photos uploaded via admin |
| 6 | Show prices publicly for all products, or "Price on request" for some (e.g. custom curtains/chandeliers)? | Both are supported per product |
| 7 | Language: English only, or Bangla too? | English only (Bangla on the future list) |
| 8 | Does custom-size / made-to-order work need mentioning (curtains, chandeliers)? | Yes: a "Made to order" flag per product |
| 9 | Exact admin email for the predefined admin account | Set via `ADMIN_EMAIL` env var |
| 10 | Who manages the domain DNS? It has to move to Cloudflare nameservers for the R2 media domain (10 §6.1). Do you use cPanel email on this domain? (Its MX records must be copied over) | Assume cPanel email exists, so copy all MX/TXT records |
| 11 | Do you have a Cloudflare account, or should one be created for the business? The developer's Cloudflare already hosts `codespherestudio.site` DNS; R2 for production should probably live in an account the business owns | A new free account owned by the business email |
| 12 | Agent assumption (2026-11-12): `R2_*` env vars are optional until Phase 3 so the site can deploy before Cloudflare is set up. They become required for uploads when the media module lands | Optional until Phase 3 (ADR-018) |
| 13 | The dev PC runs Node **26**; the project pins Node **24** (ADR-015). npm only warns locally, and CI/production use 24. Install Node 24 locally (e.g. nvm-windows) to match exactly? | Keep 26 locally; CI enforces 24 |
| 14 | ~~Official contact details?~~ Answered 2026-11-12 (see #4) | — |
| 15 | Agent assumption (2026-11-12): the phone number shown is the WhatsApp number (no separate landline was given) | +880 1757-758388 for both |
| 16 | ~~Google Maps embed link~~ Answered 2026-11-12 (see #4) | — |
| 17 | The **test** database contains 31 demo products (`demo-…` slugs, SEED_DEMO; doors/tables demos removed, 2 chandeliers added 2026-11-12). Remove them before entering real products? (`DELETE FROM Product WHERE slug LIKE 'demo-%'`) | Keep until real products exist |

## Session log

Add one line per session, newest first: `YYYY-MM-DD — summary — files touched`.

- 2026-11-13 — CI red since 7d, fixed: admin forms crashed after client-side navigation (Field read `children.props` of a lazy RSC node) and dropdown labels pointed at a wrapper div. Field now passes ids via context; Input/Textarea/Select read it (ADR-038); regression unit test. CI keeps e2e traces/snapshots, pipes server logs; serial admin e2e without retries; lockout e2e uses a fresh email. GitHub CLI available at `C:Program FilesGitHub CLIgh.exe` (not yet on PATH in agent shells). — `src/components/ui/{Field,Input,Textarea,Select}.tsx`, `tests/unit/field.test.ts`, `tests/e2e/admin-auth.spec.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`, `DECISIONS.md`, `CHANGELOG.md`

- 2026-11-13 — Phase 7 closed (7f skipped, owner removed the rails). Phase 8: admin draft preview (`?preview=1`, uncached, noindex, banner; Preview link on draft edit pages), sitemap.xml + robots.txt, upload hardening tests (size, 8000 px, disguised SVG, discardImage guard). Checked live test site: all security headers present; `npm audit --omit=dev` 0 vulnerabilities; homepage brotli JS ~195 KB (~150 KB framework), HTML 19.5 KB, CSS 10.7 KB. 268 unit tests; seo e2e + preview checks added (CI). ADR-037. — `src/app/{sitemap,robots}.ts`, `src/app/(site)/{products,blog}/[slug]/page.tsx`, `src/server/services/{preview,sitemap,catalog,blog}.service.ts`, repos, `src/components/site/PreviewBanner.tsx`, admin edit pages, `tests/`, `DECISIONS.md`, `docs/06`, `12`, `CHANGELOG.md`

- 2026-11-13 — Phase 7e Journal admin: list (search, status, 20/page, delete), write/edit form (Markdown editor with Insert image, cover photo + remove, author default = admin name, tags, back-dating only, SEO preview), inline image cleanup on save/delete. MarkdownEditor and SeoFields moved to components/admin for reuse. 254 unit tests; journal e2e added (CI only). Not checked in a browser locally (no DB). ADR-036. — `src/lib/validation/blog.ts`, `src/server/{repositories/blog-admin.repo,services/blog-admin.service,actions/blog.actions}.ts`, `src/components/admin/{MarkdownEditor,SeoFields}.tsx`, `src/components/admin/blog/`, `src/app/admin/(panel)/blog/`, `tests/`, `DECISIONS.md`, `docs/07`, `12`, `CHANGELOG.md`

- 2026-11-13 — Owner layout changes (ADR-035): header gets Journal/About/Contact, Chairs hidden from it; compact footer; Messenger FAB; homepage headings simplified, Featured/Most loved rails removed, CTA heading on one line; square product cards, 1:1/4:3 gallery. e2e updated (home sections, header/FAB/footer). Not checked in a browser locally (no DB in this session). — `src/components/site/{HeaderView,Footer,WhatsAppFab,SocialIcons}.tsx`, `src/config/site.ts`, `src/styles/globals.css`, `src/components/home/`, `src/components/product/`, `src/app/(site)/page.tsx`, `tests/e2e/`, `DECISIONS.md`, `docs/03`, `05`, `CHANGELOG.md`

- 2026-11-13 — Owner fixed the GitHub media URL variable (hero photo now shows). Phase 7d products: list (search, category/status/flag filters, sort, 20/page, duplicate, delete), create/edit form (Markdown toolbar + preview, live price preview, colour and spec rows with category presets, details, visibility, SEO preview, unsaved-changes guard), Photos panel (drag & drop, 2 parallel one-file uploads with per-file status, featured, order, alt, delete). 241 unit tests; products e2e added (CI only). Not checked in a browser locally (no DB tunnel in this session). Draft preview (`?preview=1`) not built yet. ADR-034. — `src/lib/{validation/product,spec-presets}.ts`, `src/server/{repositories/product-admin.repo,services/product-admin.service,actions/product.actions}.ts`, `src/components/admin/{AdminForm.tsx,products/}`, `src/app/admin/(panel)/products/`, `tests/`, `DECISIONS.md`, `docs/07`, `12`, `CHANGELOG.md`

- 2026-11-13 — Owner fixes + Phase 7c. Hero photo not showing: the build's `NEXT_PUBLIC_MEDIA_URL` is the site URL (GitHub variable), so image URLs 404. next.config now refuses that; owner must fix the variable. Contact: directions default = Google Maps place link (seed), "Message us on Facebook" (m.me link from facebookUrl), removed "Times are Dhaka time.". Phase 7c categories: list (move up/down, Active / On home switches, counts), create/edit (slug from name, image + remove, SEO), guarded delete, search-text refresh on rename, full revalidation. 222 unit tests; categories e2e added (CI only). Not checked in a browser locally (DB tunnel not available in this session). ADR-033. — `next.config.ts`, `src/app/(site)/contact/page.tsx`, `src/lib/{messenger,validation/category}.ts`, `src/server/{repositories/category.repo,services/category-admin.service,actions/category.actions}.ts`, `src/components/admin/categories/`, `src/app/admin/(panel)/categories/`, `prisma/seed.ts`, `tests/`, `DECISIONS.md`, `docs/06`, `07`, `10`, `12`, `CHANGELOG.md`

- 2026-11-13 — CI follow-up: deploy bundle now ships sharp's libvips (uploads would have failed on the server), alias check loads packages that hide package.json (ADR-032); admin e2e waits for bcrypt (15 s) and uses an exact label; search keyboard test waits for load, and a new test covers typing while JS is still loading. — `scripts/package-standalone.mjs`, `tests/e2e/{search.spec,helpers,admin-auth.spec}.ts`, `DECISIONS.md`, `CHANGELOG.md`

- 2026-11-13 — CI red since Phase 6, fixed: text typed into the search overlay before JavaScript loaded was ignored (reproduced with delayed JS; the overlay now picks it up on load). Admin e2e: wait for the login page to load before typing and for sign-in to finish before navigating. — `src/components/site/SearchDialog.tsx`, `tests/e2e/admin-auth.spec.ts`, `CHANGELOG.md`

- 2026-11-13 — Phase 7b: Settings (Business, Contact with WhatsApp test link + message preview, Location with map-snippet paste + hours editor, Social, SEO with share image) and Homepage editor (hero with live preview + photo, promo banners with dates, order, edit, delete). AdminForm (no reset on failed save), ImageField, media.service (upload → save → delete old). 199 unit tests; admin e2e extended (CI only). Signed-in screens not checked locally (no test admin locally); CI covers them. ADR-031. — `src/lib/validation/{settings,home}.ts`, `src/server/{actions/settings,actions/home,services/settings-admin,services/home-admin,services/media}*`, `src/server/repositories/{settings,home}.repo.ts`, `src/app/admin/(panel)/{settings,homepage}/`, `src/components/admin/`, `src/app/(site)/page.tsx`, `tests/`, `DECISIONS.md`, `docs/12`, `CHANGELOG.md`

- 2026-11-13 — Phase 7a: admin auth (bcrypt, jose JWT cookie, requireAdmin with sessionVersion, DB-backed lockout, decoy-hash timing), proxy.ts (redirect, sliding renewal, no-store/noindex), login, forced first-login password change, account (profile, password, log out everywhere), admin shell (sidebar, mobile drawer, toasts, confirm), dashboard (counts, recent, warnings), reset-password CLI, placeholders for 7b–7e sections. 160 unit tests; auth e2e runs in CI only. Verified locally that a forged cookie gets no admin content. ADR-030. — `src/lib/auth/`, `src/server/{services/auth,services/dashboard,actions/auth,repositories/admin,repositories/dashboard}*`, `src/proxy.ts`, `src/app/admin/`, `src/components/admin/`, `scripts/admin-reset-password.ts`, `tests/`, `.github/workflows/ci.yml`, `DECISIONS.md`, `docs/07`, `10`, `12`, `CHANGELOG.md`

- 2026-11-13 — Owner set up Cloudflare R2 (buckets, custom media domain, scoped tokens, cPanel env vars). Verified without exposing secrets: media domain DNS/TLS, env var formats, and a live PUT → CDN read (cache HIT) → DELETE from the server. Phase 7 paused (no code changed) and resumes next. — `PROGRESS.md`

- 2026-11-12 — Phase 6: homepage (hero, category tiles with icons, new/featured/popular rails, brand intro, promo banners, WhatsApp band, latest posts), home service with soft-failing cached blocks, Organization/WebSite/FurnitureStore JSON-LD. Fixed a build failure (Date read before connection()). Mobile probe (slow 4G, 4× CPU): home LCP 1.36 s, CLS 0. ADR-029. — `src/app/(site)/page.tsx`, `src/components/home/`, `src/server/services/home.service.ts`, repos, `src/lib/seo.ts`, `tests/e2e/home.spec.ts`, `DECISIONS.md`, `docs/12`, `CHANGELOG.md`

- 2026-11-12 — Owner confirmed hours (every day 10 AM – 10 PM) and sent the showroom map embed. Times now display in 12-hour format (formatClock/formatHoursRange); seed + test DB updated with hours, map embed and coordinates (from the embed URL); contact e2e covers tap-to-load map. — `src/lib/opening-hours.ts`, `src/app/(site)/contact/page.tsx`, `src/components/site/Footer.tsx`, `prisma/seed.ts`, `tests/`, `PROGRESS.md`, `CHANGELOG.md`

- 2026-11-12 — Phase 5: Journal (`/blog`, `/blog/[slug]`: featured post, reading time, Markdown with media-only images, share links, related by tag, BlogPosting JSON-LD), Contact (hours table, Dhaka-time open status, click-to-load map, directions, FurnitureStore JSON-LD), About (story from settings, values, CTAs). Libs: opening-hours, blog. Seed: default About text + 4 demo posts; test DB About filled (was empty) and demo posts seeded. 130 unit tests; 12 new e2e tests. ADR-028. — `src/app/(site)/{blog,contact,about}`, `src/components/{blog,contact}`, `src/lib/{opening-hours,blog,seo}.ts`, `src/components/ui/Markdown.tsx`, `prisma/seed*.ts`, `tests/`, `DECISIONS.md`, `docs/06`, `12`, `TESTING-GUIDELINES.md`, `CHANGELOG.md`

- 2026-11-12 — Phase 4: search lib (normalise, terms, LIKE escaping, ranking) + service (cached per query), `/api/search`, header search overlay (dialog via Invoker Commands, debounce/abort, combobox keyboard), `/search` page. Verified Prisma doesn't escape LIKE wildcards. e2e "before JS" tests now block the app bundle instead of disabling JS. Local e2e over the long tunnel is flaky under parallel load (DB timeouts); single runs pass, CI uses a local DB. ADR-027. — `src/lib/search.ts`, `src/lib/validation/search.ts`, `src/server/services/search.service.ts`, repos, `src/app/api/search/route.ts`, `src/app/(site)/search/page.tsx`, `src/components/site/Search*.tsx`, `tests/`, `DECISIONS.md`, `docs/09`, `12`, `CHANGELOG.md`

- 2026-11-12 — Owner changes (ADR-026): removed the desktop utility bar (logo row is the only header); product range now Sofas, Dining Tables, Chairs, Beds, Curtains, Chandeliers (Doors/Tables dropped). Seed + demo data + copy + docs updated; test DB cleaned by SQL and re-seeded (6 categories). Gave the owner step-by-step R2 setup instructions. — `src/components/site/HeaderView.tsx`, `prisma/seed.ts`, `seed-demo.ts`, `src/app/…`, `docs/01`, `05`, `06`, `DECISIONS.md`, `CHANGELOG.md`

- 2026-11-12 — Phase 3: catalogue repos/service (listing, detail, related; request-time cached), effectivePrice column + migration, media pipeline (keys, sharp processor, R2 storage with rollback), ProductCard/Grid/Pagination/SortBar, /products, /categories/[slug], /products/[slug] (gallery, swatches → WhatsApp message, sticky mobile bar, specs, Markdown, related, Product + Breadcrumb JSON-LD), demo catalogue seed. Applied the migration + demo seed to the test DB over the tunnel. 95 unit tests, 27 e2e tests; bundle smoke test covers a product page. ADR-025. — `prisma/`, `src/`, `tests/`, `scripts/smoke-bundle.mjs`, `.github/workflows/ci.yml`, `DECISIONS.md`, `docs/02`, `04`, `05`, `06`, `12`, `CHANGELOG.md`

- 2026-11-12 — CI was red for 4f2899a and 9669d8f (mobile-menu e2e tapped before hydration). The mobile menu now uses Invoker Commands so it works without JS (ADR-024); new no-JS e2e test; 30/30 runs pass locally with --repeat-each=3. Live test site still runs the broken 481f6f4 until the next Deploy. — `src/components/site/MobileNav.tsx`, `tests/e2e/layout.spec.ts`, `DECISIONS.md`, `CHANGELOG.md`

- 2026-11-12 — Fixed the white page on the test site (ADR-023): the bundle was missing Turbopack's hashed Prisma alias (`.next/node_modules/@prisma/client-<hash>`). The packaging script now recreates and verifies aliases; CI smoke-tests the real bundle; the deploy health check requires a complete page. Verified locally: the packaged bundle renders the full page from the test DB. — `scripts/package-standalone.mjs`, `scripts/smoke-bundle.mjs`, `.github/workflows/ci.yml`, `deploy.yml`, `DECISIONS.md`, `docs/10`, `CHANGELOG.md`

- 2026-11-12 — Brand logo in place (ADR-022): compact cached SVGs for header (animated clip-path wipe) and footer, favicons from the A mark, brand red token. Real contact details + social links in the seed and applied to the test DB by SQL over SSH. Logo SVGs were generated from `VideoEditing/.../brand/artifex-logo.svg` by rounding coordinates (one-off Python script, not in the repo). — `src/assets/brand/`, `src/components/site/Logo.tsx`, `src/app/icon.svg`, `favicon.ico`, `apple-icon.png`, `prisma/seed.ts`, `DECISIONS.md`, `docs/03`, `CHANGELOG.md`

- 2026-11-12 — Phase 2: design tokens + type scale + CSS-only motion (ADR-021), Inter/Cormorant via next/font, UI primitives, header (utility bar, sticky shrink, More menu), mobile drawer (native dialog), footer, WhatsApp FAB, branded 404/error/global-error, dev style guide, settings + nav-category services with request-time caching (ADR-020), lib/format, lib/whatsapp, lib/phone. 29 unit + 9 e2e tests. Mobile home weight on a local prod build: HTML 38 KB, CSS 7 KB, JS 154 KB (framework), fonts 84 KB, 12 requests. — `src/`, `tests/`, `DECISIONS.md`, `docs/02`, `03`, `12`, `CHANGELOG.md`

- 2026-11-12 — Set up the test deployment over SSH (ADR-019): subdomain, Node 24 app, utf8mb4 database + user, private secrets file. Found that the root domain's DNS is on Cloudflare, so the subdomain record goes there. — `DECISIONS.md`, `PROGRESS.md`, `docs/10`, `CHANGELOG.md`

- 2026-11-12 — Pushed to GitHub (private repo); first CI run green, so the Phase 1 exit check passed (migrate + seed on MariaDB 11.4). — `PROGRESS.md`, `docs/12`, `CHANGELOG.md`

- 2026-11-12 — Phase 1 build: Next.js 16.4.6 scaffold (strict TS, Tailwind 4, ESLint with Prisma import ban), Zod env + boot validation, Prisma 7.10 schema/migration/seed with the MariaDB adapter, security headers, custom image loader, Vitest (14) + Playwright (2) tests, standalone packaging script, CI + deploy workflows (migrations via SSH tunnel, ADR-017). ADR-017/018 recorded. — `package.json`, `next.config.ts`, `prisma/`, `src/`, `scripts/`, `tests/`, `.github/workflows/`, `DECISIONS.md`, `docs/02`, `04`, `10`, `12`, `README.md`, `CHANGELOG.md`

- 2026-11-12 — Project status review. The owner confirmed the Stellar plan and chose automated deploys. Recorded Stellar limits and ADR-016 (GitHub Actions over SSH); documented the one-time SSH and secrets setup. Generated the deploy key, verified SSH, and recorded the server environment (glibc 2.28, OpenSSL 1.1.1k, Node 24.22.2, MariaDB 11.4, rsync/mysqldump). — `DECISIONS.md`, `PROGRESS.md`, `docs/10`, `docs/12`, `CHANGELOG.md`

- 2026-11-11 — Marketing: v4 sofa + tea table ad (38.8 s, 9:16), voice-led edit with short silent gaps, realistic narrator, soft low music, sonic-logo outro. — `VideoEditing/.../exports/v4/`, `_work/v4/`, `CREATIVE-BRIEF.md`

- 2026-11-11 — Marketing: v3 sofa + tea table ad rebuilt from scratch (62.5 s, 9:16): brighter per-clip grade, narrator face polish, 4544 narration under 4520, tracking on swing arm + legs only, tea table chapter. — `VideoEditing/.../exports/v3/`, `_work/v3/`, `CREATIVE-BRIEF.md`

- 2026-11-11 — Marketing: v2.2 of the sofa ad (60 s, 9:16): removed captions, logo bug tighter to the corner, fixed jump cuts, address L-cut with a showroom card, jitter-free callouts. — `VideoEditing/.../exports/v2/`, `_work/v2/render_v2.py`, `CREATIVE-BRIEF.md`

- 2026-11-11 — Marketing: built v2 of the sofa ad (60 s, 9:16 only, for client review): presenter + Bangla captions, tracked feature callouts, animated logo intro/corner bug, dark end screen with WhatsApp 01757-758388 and Uttara showroom address. — `VideoEditing/2026-11-11_Signature_L-Shape_Sofa_Video/exports/v2/`, `_work/v2/`, `CREATIVE-BRIEF.md`

- 2026-11-11 — Marketing (not website code): produced the Signature L-Shape Sofa social ad (30 s; 9:16, 4:5 and 1:1 exports) and vectorised the Artifex logo (SVG + 4000 px PNG). WhatsApp number still unconfirmed, so it isn't shown in the video. — `VideoEditing/2026-11-11_Signature_L-Shape_Sofa_Video/` (`exports/`, `brand/`, `CREATIVE-BRIEF.md`, `_work/`)

- 2026-11-10 — Archived the planning chat before it was deleted: a summary record and the full transcript export. — `docs/history/2026-11-10-planning-session.md`, `docs/history/2026-11-10-planning-chat-export.zip`, `AGENTS.md`, `README.md`
- 2026-11-10 — The owner confirmed cPanel offers Node up to 26, with 14.21.3 labelled "recommended". Decided on Node 24 LTS for production and builds (ADR-015). — `DECISIONS.md`, `PROGRESS.md`, `docs/10`, `docs/12`, `CHANGELOG.md`
- 2026-11-10 — Switched image storage to Cloudflare R2 (ADR-014 supersedes ADR-013). Removed the local `UPLOAD_DIR` and `/media` route from the plan. Added the R2 env vars, the Cloudflare DNS and bucket setup, the aws4fetch dependency, and R2 tests. — `DECISIONS.md`, `AGENTS.md`, `docs/02`, `04`, `08`, `09`, `10`, `12`, `TESTING-GUIDELINES.md`
- 2026-11-10 — Planning session. Reviewed the brief and competitors (HATIL and other BD brands, plus international premium references). Confirmed via the Facebook page title that the business is in Dhaka. Researched shared-hosting constraints for Next.js. Wrote all planning docs. — `AGENTS.md`, `PROGRESS.md`, `DECISIONS.md`, `CHANGELOG.md`, `README.md`, `docs/*`
