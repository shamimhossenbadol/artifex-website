# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Changed
- 2026-11-12 — Hosting plan confirmed as **Namecheap Stellar**. Deploys will run from **GitHub Actions over SSH** (ADR-016); deployment guide §5.1 added.
- 2026-11-10 — Runtime pinned to **Node.js 24 LTS** on cPanel and on build machines (ADR-015).
- 2026-11-10 — Image storage moved from local disk to **Cloudflare R2** served at `media.<domain>` (ADR-014). Docs updated: architecture, database, SEO, security, deployment, roadmap, and testing.

### Added
- 2026-11-12 — Project foundation (Phase 1): Next.js 16.4 app scaffold with strict TypeScript, Tailwind CSS 4, ESLint (Prisma import restrictions, unsafe-raw-query ban) and Prettier.
- 2026-11-12 — Prisma 7 schema for all entities, first migration, and an idempotent seed (7 categories, site settings, home hero, predefined admin).
- 2026-11-12 — Environment validation at server start, security headers + CSP, custom image loader for R2 variants.
- 2026-11-12 — Vitest and Playwright test setups, standalone deploy bundle script, and GitHub Actions CI + one-click deploy (backup, migrate, seed, swap, health check, rollback).
- 2026-11-10 — `docs/history/`: archive of the planning chat (summary + full transcript export).
- 2026-11-10 — Project documentation set: `AGENTS.md`, `PROGRESS.md`, `DECISIONS.md` (ADR-001…013), `CHANGELOG.md`, `README.md`, and `docs/01`–`12` plus `TESTING-GUIDELINES.md`.
