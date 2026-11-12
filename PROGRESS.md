# PROGRESS.md — Living Project Status

> Update this file at the end of **every** work session (see `AGENTS.md` §2).
> The task-level checklist lives in `docs/12-DEVELOPMENT-ROADMAP.md`. This file holds the *current state*.

---

## Current status

| Item | Value |
|---|---|
| **Current phase** | Phase 3: Product catalogue (next) |
| **Overall state** | ✅ Phase 1 complete. Code is on GitHub (`shamimhossenbadol/artifex-website`, private); CI is green. ✅ **First deploy succeeded 2026-11-12**: https://artifex.codespherestudio.site serves the placeholder page with security headers (via Cloudflare). Migration applied; seed created 7 categories, settings, hero and the admin (`mustChangePassword = 1`); backup saved in `~/backups`. |
| **Last updated** | 2026-11-12 |
| **Next action** | Owner: create the R2 buckets in Cloudflare (10 §6.2) so Phase 3 can upload real product photos; confirm WhatsApp/phone/address (open question #14). Agent: Phase 3 (catalogue: product cards, listing, detail, gallery, R2 image pipeline). |

## Phase overview

| # | Phase | Status |
|---|---|---|
| 0 | Planning & hosting verification | 🟡 Hosting verified over SSH; R2 smoke test waits for the Cloudflare account |
| 1 | Project foundation (scaffold, Prisma, env, design tokens) | ✅ Done 2026-11-12 (CI green) |
| 2 | Design system & layout shell | ✅ Done 2026-11-12 |
| 3 | Product catalogue (listing, detail, WhatsApp) | ⚪ Not started |
| 4 | Global search | ⚪ Not started |
| 5 | Blog, About, Contact/Location | ⚪ Not started |
| 6 | Homepage | ⚪ Not started |
| 7 | Admin dashboard | ⚪ Not started |
| 8 | SEO, security & performance hardening | ⚪ Not started |
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

## Blockers

- **Before the first test deploy:** Cloudflare DNS record for `artifex` + GitHub `production` secrets/variables. cPanel side is done (ADR-019). Doesn't block Phase 2.
- No local MySQL/MariaDB or WSL on the dev PC, so DB-backed checks run in CI. Optional: install MariaDB 11.4 locally for `npm run db:migrate` during development.

## Open questions (need the business owner's answer)

Answer these by editing this list. Agents: use the **default** until an answer is recorded.

| # | Question | Default used until answered |
|---|---|---|
| 1 | ~~Which Namecheap plan? SSH?~~ **Answered 2026-11-12: Stellar.** SSH enabled and verified 2026-11-12 (ADR-016) | — |
| 2 | Final production domain and hosting? (`artifexfurniture.com` currently points to someone else's servers.) | Test deploys go to `artifex.codespherestudio.site` (ADR-019) |
| 3 | ~~Logo files?~~ **Answered 2026-11-12:** logo supplied and in use (ADR-022). Brand red refined to `#D2161E` for the web; confirm the owner is happy with that tone | — |
| 4 | ~~WhatsApp, phone, address~~ **Answered 2026-11-12:** WhatsApp 01757-758388 (also used as the phone number), House 02, Road 05, Sector 01, Uttara, Dhaka 1230; Facebook/Instagram/YouTube links. **Still open:** email, real opening hours, showroom map pin | Hours default Sat–Thu 10:00–21:00, Fri closed; no email |
| 5 | Product photos: do professional photos exist? | Seed with placeholder images; real photos uploaded via admin |
| 6 | Show prices publicly for all products, or "Price on request" for some (e.g. custom doors/curtains)? | Both are supported per product |
| 7 | Language: English only, or Bangla too? | English only (Bangla on the future list) |
| 8 | Does custom-size / made-to-order work need mentioning (doors, curtains)? | Yes: a "Made to order" flag per product |
| 9 | Exact admin email for the predefined admin account | Set via `ADMIN_EMAIL` env var |
| 10 | Who manages the domain DNS? It has to move to Cloudflare nameservers for the R2 media domain (10 §6.1). Do you use cPanel email on this domain? (Its MX records must be copied over) | Assume cPanel email exists, so copy all MX/TXT records |
| 11 | Do you have a Cloudflare account, or should one be created for the business? The developer's Cloudflare already hosts `codespherestudio.site` DNS; R2 for production should probably live in an account the business owns | A new free account owned by the business email |
| 12 | Agent assumption (2026-11-12): `R2_*` env vars are optional until Phase 3 so the site can deploy before Cloudflare is set up. They become required for uploads when the media module lands | Optional until Phase 3 (ADR-018) |
| 13 | The dev PC runs Node **26**; the project pins Node **24** (ADR-015). npm only warns locally, and CI/production use 24. Install Node 24 locally (e.g. nvm-windows) to match exactly? | Keep 26 locally; CI enforces 24 |
| 14 | ~~Official contact details?~~ Answered 2026-11-12 (see #4) | — |
| 15 | Agent assumption (2026-11-12): the phone number shown is the WhatsApp number (no separate landline was given) | +880 1757-758388 for both |
| 16 | Agent assumption (2026-11-12): category links, `/search`, `/blog`, `/about`, `/contact`, `/products` currently 404 (branded) until Phases 3–5 build them | Expected during development |

## Session log

Add one line per session, newest first: `YYYY-MM-DD — summary — files touched`.

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
