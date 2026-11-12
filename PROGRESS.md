# PROGRESS.md — Living Project Status

> Update this file at the end of **every** work session (see `AGENTS.md` §2).
> The task-level checklist lives in `docs/12-DEVELOPMENT-ROADMAP.md`. This file holds the *current state*.

---

## Current status

| Item | Value |
|---|---|
| **Current phase** | Phase 1: Project foundation (code done; waiting on the first CI run) |
| **Overall state** | 🟡 Next.js 16.4 scaffold, Prisma 7 schema + migration + seed, env validation, tests, packaging and CI/deploy workflows written. Typecheck, lint, 14 unit tests, 2 e2e tests and the production build pass locally. |
| **Last updated** | 2026-11-12 |
| **Next action** | Owner: create a private GitHub repo and add the secrets/variables (10 §5.1). Then push, let CI apply the migration + seed on MariaDB 11.4 (Phase 1 exit check), and start Phase 2 (design system & layout shell). |

## Phase overview

| # | Phase | Status |
|---|---|---|
| 0 | Planning & hosting verification | 🟡 Hosting verified over SSH; R2 smoke test waits for the Cloudflare account |
| 1 | Project foundation (scaffold, Prisma, env, design tokens) | 🟡 Code done; exit check (migrate + seed on MariaDB) pending the first CI run |
| 2 | Design system & layout shell | ⚪ Not started |
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

## Blockers

- **GitHub repo needed** to run CI (migration + seed verification) and deploys. Doesn't block Phase 2 work locally.
- No local MySQL/MariaDB or WSL on the dev PC, so DB-backed checks run in CI. Optional: install MariaDB 11.4 locally for `npm run db:migrate` during development.

## Open questions (need the business owner's answer)

Answer these by editing this list. Agents: use the **default** until an answer is recorded.

| # | Question | Default used until answered |
|---|---|---|
| 1 | ~~Which Namecheap plan? SSH?~~ **Answered 2026-11-12: Stellar.** SSH enabled and verified 2026-11-12 (ADR-016) | — |
| 2 | Final domain name? | `artifexfurniture.com` (placeholder) |
| 3 | Logo files (SVG/PNG) and brand colours, if any? | Text wordmark "ARTIFEX" plus the palette in the design system |
| 4 | WhatsApp business number, phone, email, showroom address, opening hours | Placeholders in the seed, editable in admin |
| 5 | Product photos: do professional photos exist? | Seed with placeholder images; real photos uploaded via admin |
| 6 | Show prices publicly for all products, or "Price on request" for some (e.g. custom doors/curtains)? | Both are supported per product |
| 7 | Language: English only, or Bangla too? | English only (Bangla on the future list) |
| 8 | Does custom-size / made-to-order work need mentioning (doors, curtains)? | Yes: a "Made to order" flag per product |
| 9 | Exact admin email for the predefined admin account | Set via `ADMIN_EMAIL` env var |
| 10 | Who manages the domain DNS? It has to move to Cloudflare nameservers for the R2 media domain (10 §6.1). Do you use cPanel email on this domain? (Its MX records must be copied over) | Assume cPanel email exists, so copy all MX/TXT records |
| 11 | Do you have a Cloudflare account, or should one be created for the business? | A new free account owned by the business email |
| 12 | Agent assumption (2026-11-12): `R2_*` env vars are optional until Phase 3 so the site can deploy before Cloudflare is set up. They become required for uploads when the media module lands | Optional until Phase 3 (ADR-018) |
| 13 | The dev PC runs Node **26**; the project pins Node **24** (ADR-015). npm only warns locally, and CI/production use 24. Install Node 24 locally (e.g. nvm-windows) to match exactly? | Keep 26 locally; CI enforces 24 |
| 14 | The sofa ad shows WhatsApp **01757-758388** and an Uttara showroom address. Are these the official website contact details? | Seed keeps placeholders, editable in admin |

## Session log

Add one line per session, newest first: `YYYY-MM-DD — summary — files touched`.

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
