# Artifex Furniture — Website

A premium catalogue + WhatsApp inquiry website for Artifex Furniture (Dhaka).
Stack: Next.js · TypeScript · Tailwind CSS · Prisma · MySQL/MariaDB. Hosted on Namecheap shared hosting (cPanel Node.js app).

**Status:** Phase 1 (project foundation). See [PROGRESS.md](PROGRESS.md).

## Start here
1. [AGENTS.md](AGENTS.md): rules and the session protocol (for AI agents *and* humans)
2. [PROGRESS.md](PROGRESS.md): current status, next steps, and open questions
3. [docs/12-DEVELOPMENT-ROADMAP.md](docs/12-DEVELOPMENT-ROADMAP.md): task checklist
4. [DECISIONS.md](DECISIONS.md): why things are the way they are

## Docs
| # | Document |
|---|---|
| 01 | [Project Overview](docs/01-PROJECT-OVERVIEW.md) |
| 02 | [System Architecture](docs/02-SYSTEM-ARCHITECTURE.md) |
| 03 | [Design System](docs/03-DESIGN-SYSTEM.md) |
| 04 | [Database Design](docs/04-DATABASE-DESIGN.md) |
| 05 | [UI/UX Guidelines](docs/05-UI-UX-GUIDELINES.md) |
| 06 | [Feature Specifications](docs/06-FEATURE-SPECIFICATIONS.md) |
| 07 | [Admin Dashboard](docs/07-ADMIN-DASHBOARD.md) |
| 08 | [SEO & Performance](docs/08-SEO-PERFORMANCE.md) |
| 09 | [Security Guidelines](docs/09-SECURITY-GUIDELINES.md) |
| 10 | [Deployment Guide](docs/10-DEPLOYMENT-GUIDE.md) |
| 11 | [Coding Standards](docs/11-CODING-STANDARDS.md) |
| 12 | [Development Roadmap](docs/12-DEVELOPMENT-ROADMAP.md) |
| — | [Testing Guidelines](docs/TESTING-GUIDELINES.md) |
| — | [Planning history](docs/history/2026-11-10-planning-session.md): record of the original planning chat, plus the full transcript zip |

## Kick-off prompt for a coding session
> Read AGENTS.md, then PROGRESS.md, then the docs relevant to the next unchecked task in docs/12-DEVELOPMENT-ROADMAP.md. Implement that task, then update the roadmap, PROGRESS.md and CHANGELOG.md before finishing.

## Development setup

Requirements: **Node.js 24** (see `.nvmrc`; ADR-015) and a MySQL 8 / MariaDB 10.6+ database for DB work (production runs MariaDB 11.4).

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then fill in DATABASE_URL, AUTH_SECRET, …
npm run db:migrate          # apply migrations to your local DB
npm run db:seed             # categories, settings, hero, admin (idempotent)
npm run dev                 # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run typecheck` / `npm run lint` | Must pass before a task is done (AGENTS §4.12) |
| `npm test` | Unit tests (Vitest, `tests/unit`) |
| `npm run test:e2e` | E2E tests (Playwright, `tests/e2e`) against `npm run build` output; run `npx playwright install chromium` once |
| `npm run build` then `npm run package` | Production build → `deploy/artifex-app/` + `.tar.gz` |
| `npm run db:studio` | Browse the database |

Deploys run from GitHub Actions (**Actions → Deploy → Run workflow**). See [docs/10-DEPLOYMENT-GUIDE.md §5.1](docs/10-DEPLOYMENT-GUIDE.md).
