# AGENTS.md — Instructions for AI Coding Agents

> **Read this file first, every session.** This project is built across many sessions, and chat history does not carry over between them.
> **The Markdown files in this repository are the single source of truth.** If something isn't written down here, it hasn't been decided.

---

## 1. What this project is

**Artifex Furniture** (Dhaka, Bangladesh) needs a premium, lightweight **catalogue and inquiry website**.
Visitors browse furniture and contact the business on **WhatsApp**.
It is **NOT e-commerce**: no cart, no checkout, no payments, no customer accounts, no orders.

Stack: Next.js (App Router) · TypeScript (strict) · Tailwind CSS · Prisma · MySQL/MariaDB · Lucide icons.
Hosting target: **Namecheap Shared Hosting (cPanel, Node.js app via Phusion Passenger, CloudLinux limits)**.
Images: **Cloudflare R2**, served from `https://media.<domain>` (ADR-014). Images are never written to the app's disk and never served by the app.

## 2. Session protocol (mandatory)

**At the start of every session:**
1. Read `AGENTS.md` (this file).
2. Read `PROGRESS.md` to see the current phase, what's done, what's next, and any blockers.
3. Read the docs relevant to the task (see the map in section 3). Read `DECISIONS.md` before changing anything architectural.

**While working:**
- Implement only what the docs specify. If a requirement is missing or ambiguous, follow the closest documented decision and record your assumption in `PROGRESS.md` under *Open questions*.
- Don't add features, dependencies, or components that aren't in the docs (see section 5).

**At the end of every session (do not skip):**
1. Tick completed tasks in `docs/12-DEVELOPMENT-ROADMAP.md`.
2. Update `PROGRESS.md`: current status, next steps, blockers, and one dated line in the session log.
3. Add user-visible or structural changes to `CHANGELOG.md` under `[Unreleased]`.
4. Add any new technical decision to `DECISIONS.md` (new ADR entry). Never silently reverse an existing ADR: add a new one that supersedes it.
5. If you changed the schema, architecture, routes, or env vars, update the matching doc in the same session.

## 3. Documentation map

| Need to… | Read |
|---|---|
| Understand scope, goals, and content | `docs/01-PROJECT-OVERVIEW.md` |
| Know the folder structure, layers, data flow, and routes | `docs/02-SYSTEM-ARCHITECTURE.md` |
| Style anything | `docs/03-DESIGN-SYSTEM.md` |
| Touch the database or Prisma | `docs/04-DATABASE-DESIGN.md` |
| Build layouts, navigation, responsiveness, or accessibility | `docs/05-UI-UX-GUIDELINES.md` |
| Build a public feature (catalogue, search, blog, WhatsApp, contact) | `docs/06-FEATURE-SPECIFICATIONS.md` |
| Build admin features | `docs/07-ADMIN-DASHBOARD.md` |
| Handle metadata, sitemap, caching, or images | `docs/08-SEO-PERFORMANCE.md` |
| Handle auth, validation, uploads, or headers | `docs/09-SECURITY-GUIDELINES.md` |
| Build, package, or deploy | `docs/10-DEPLOYMENT-GUIDE.md` |
| Launch on artifexfurniturebd.com (new hosting + R2) | `docs/PRODUCTION-LAUNCH.md` |
| Write code | `docs/11-CODING-STANDARDS.md` |
| Know what to do next | `docs/12-DEVELOPMENT-ROADMAP.md` + `PROGRESS.md` |
| Test | `docs/TESTING-GUIDELINES.md` |
| Know why something is the way it is | `DECISIONS.md` |
| See how the plan was made (original chat record) | `docs/history/` (read-only archive; the docs above take precedence) |

Feature-level detail docs go in `docs/features/<feature>.md` and are created when a feature grows beyond its section in `06-FEATURE-SPECIFICATIONS.md`.

## 4. Non-negotiable rules

1. **Shared-hosting first.** Every choice must run as **one Node.js process** under Passenger with limited RAM (assume ≤ 1 GB, target < 300 MB RSS). That means no Redis, no queues, no cron workers, no Docker, no Edge-only APIs, and no native binaries that need compiling on the server.
2. **Never build on the server.** Build on Linux (WSL or GitHub Actions) with `output: "standalone"` and upload the bundle. See `docs/10-DEPLOYMENT-GUIDE.md`.
3. **Layering.** UI components never import Prisma. The flow is: Page/Component → `server/services` → `server/repositories` → Prisma. Mutations go through Server Actions in `server/actions`, which validate with Zod and check auth first.
4. **Validate every input** (Server Actions, route handlers, search params) with Zod schemas from `src/lib/validation`.
5. **Admin auth is checked in the data layer too**, not only in middleware/proxy. Call `requireAdmin()` at the top of every admin action and admin page.
6. **No raw HTML from users.** Blog content is Markdown rendered without `rehype-raw`. Never use `dangerouslySetInnerHTML` except for JSON-LD built from trusted, serialised objects.
7. **No `$queryRawUnsafe` / `$executeRawUnsafe`.** Use the Prisma query API or the tagged `$queryRaw` template.
8. **Secrets only in env vars** (validated in `src/lib/env.ts`). Never commit `.env`.
9. **Design consistency.** Use the design tokens from `03-DESIGN-SYSTEM.md` and the shared UI primitives in `src/components/ui`. No ad-hoc colours, font sizes, or shadows.
10. **Performance budget.** Public pages ship minimal client JS. Use Server Components by default and add `"use client"` only for real interactivity (gallery, mobile menu, search box, admin forms).
11. **Cache invalidation.** Every admin mutation must revalidate the affected cache tags/paths (see `08-SEO-PERFORMANCE.md` §5).
12. **Strict TypeScript.** No `any`, no `@ts-ignore` without a comment explaining why. `npm run typecheck` and `npm run lint` must pass before a task is marked done.

## 5. Out of scope — do NOT build

Cart · checkout · payment gateway · customer registration or login · wishlist accounts · order management · reviews and ratings · live chat widgets (other than the WhatsApp link) · newsletters · multi-language (it's on the future list, not now) · animation libraries · CMS page builders · carousels with autoplay.

## 6. Dependency policy

Approved runtime deps: `next`, `react`, `react-dom`, `@prisma/client` + `@prisma/adapter-mariadb` (or the current Prisma MySQL driver adapter), `zod`, `bcryptjs`, `jose`, `sharp`, `aws4fetch` (Cloudflare R2 uploads; **not** `@aws-sdk/*`), `lucide-react`, `react-markdown`, `remark-gfm`, `clsx`, `tailwind-merge`.
Approved dev deps: `prisma`, `typescript`, `eslint` + `eslint-config-next`, `prettier` + `prettier-plugin-tailwindcss`, `vitest`, `@playwright/test`, `tsx`, `@types/*`.
Any other dependency needs a new ADR in `DECISIONS.md` that justifies it (size, maintenance, and why it can't be done in < 50 lines).

## 7. Definition of done (per task)

- [ ] Meets the spec in the relevant doc
- [ ] Responsive at 360 px, 768 px, 1024 px, and 1440 px
- [ ] Keyboard accessible, with visible focus and alt text
- [ ] Typecheck + lint pass, and relevant tests are added or updated and passing
- [ ] Loading, empty, and error states handled
- [ ] Cache revalidation wired (for mutations)
- [ ] Docs, `PROGRESS.md`, the roadmap, and `CHANGELOG.md` updated

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
