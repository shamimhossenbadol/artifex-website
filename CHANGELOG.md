# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Fixed
- 2026-11-12 — Mobile menu now opens instantly, even before the page's JavaScript has loaded on slow connections (ADR-024).
- 2026-11-12 — Test site showed a blank white page after the Phase 2 deploy: the deploy bundle was missing Turbopack's Prisma alias. Packaging now recreates and verifies it, CI boots the real bundle, and the deploy health check requires a complete page (ADR-023).

### Changed
- 2026-11-12 — Product range: Doors and Tables removed, Chandeliers added (ADR-026).
- 2026-11-12 — Header simplified to a single row with the logo (no top utility bar); Journal/About/Contact remain in the footer and mobile menu.
- 2026-11-12 — Hosting plan confirmed as **Namecheap Stellar**. Deploys will run from **GitHub Actions over SSH** (ADR-016); deployment guide §5.1 added.
- 2026-11-10 — Runtime pinned to **Node.js 24 LTS** on cPanel and on build machines (ADR-015).
- 2026-11-10 — Image storage moved from local disk to **Cloudflare R2** served at `media.<domain>` (ADR-014). Docs updated: architecture, database, SEO, security, deployment, roadmap, and testing.

### Added
- 2026-11-12 — Product catalogue (Phase 3): All furniture and category pages with sorting, "On sale" filter and pagination; product pages with a swipeable gallery, colour swatches that go into the WhatsApp message, a sticky mobile WhatsApp bar, specifications, description, related products, and Product/Breadcrumb structured data.
- 2026-11-12 — Image pipeline for Cloudflare R2: validation, EXIF stripping and 480/960/1600 px WebP variants, with rollback on failed uploads.
- 2026-11-12 — Optional demo catalogue (`SEED_DEMO=true`) for CI and test servers.
- 2026-11-12 — Artifex brand logo in the header (with a subtle reveal) and footer (with "Decor your dreams"), plus favicons and an Apple touch icon (ADR-022).

### Changed
- 2026-11-12 — Real contact details: WhatsApp/phone +880 1757-758388, Uttara showroom address, Facebook, Instagram and YouTube links.
- 2026-11-12 — Design system & layout shell (Phase 2): colour/type tokens, Cormorant Garamond + Inter, buttons, badges, prices (৳ lakh format), form fields, breadcrumbs, skeletons; sticky header with category nav, mobile menu drawer, footer with contact and opening hours, floating WhatsApp button; branded 404 and error pages; dev style guide at `/_styleguide`.
- 2026-11-12 — Subtle CSS-only animations (entrance, scroll reveal, hover), disabled for reduced-motion users (ADR-021).
- 2026-11-12 — Test environment at `artifex.codespherestudio.site` (cPanel subdomain, Node 24 app, MariaDB database) (ADR-019).
- 2026-11-12 — Code hosted on GitHub; CI green on the first push (Phase 1 complete).
- 2026-11-12 — Project foundation (Phase 1): Next.js 16.4 app scaffold with strict TypeScript, Tailwind CSS 4, ESLint (Prisma import restrictions, unsafe-raw-query ban) and Prettier.
- 2026-11-12 — Prisma 7 schema for all entities, first migration, and an idempotent seed (7 categories, site settings, home hero, predefined admin).
- 2026-11-12 — Environment validation at server start, security headers + CSP, custom image loader for R2 variants.
- 2026-11-12 — Vitest and Playwright test setups, standalone deploy bundle script, and GitHub Actions CI + one-click deploy (backup, migrate, seed, swap, health check, rollback).
- 2026-11-10 — `docs/history/`: archive of the planning chat (summary + full transcript export).
- 2026-11-10 — Project documentation set: `AGENTS.md`, `PROGRESS.md`, `DECISIONS.md` (ADR-001…013), `CHANGELOG.md`, `README.md`, and `docs/01`–`12` plus `TESTING-GUIDELINES.md`.
