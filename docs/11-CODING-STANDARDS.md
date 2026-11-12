# 11 — Coding Standards

## 1. TypeScript

- `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`.
- No `any`. Use `unknown` and narrow it. Types for DB rows come from Prisma, and types for inputs come from `z.infer<typeof schema>`.
- Prefer `type` for props and data shapes. Export the types that are shared across layers from the owning module.
- Path alias: `@/*` → `src/*`.

## 2. Naming

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase file + export | `ProductCard.tsx` |
| Hooks | `useX` camelCase | `useDebouncedValue.ts` |
| Server modules | `<entity>.<kind>.ts` | `product.repo.ts`, `catalog.service.ts`, `product.actions.ts` |
| Zod schemas | `<entity><Purpose>Schema` | `productUpsertSchema` |
| Functions | verb-first camelCase | `getProductBySlug`, `buildWhatsAppUrl` |
| Constants | UPPER_SNAKE for true constants | `PRODUCTS_PER_PAGE` |
| Routes/slugs | kebab-case | `/categories/dining-tables` |
| Cache tags | `entity` or `entity:<key>` | `product:milano-sofa` |

## 3. React / Next.js

- **Server Components by default.** Add `"use client"` only in leaf components that need state, effects, or browser APIs. Pass serialisable props only.
- Data fetching happens in Server Components via services, never `fetch('/api/...')` from your own server.
- Mutations are Server Actions in `src/server/actions`. Each one: `requireAdmin()` → `schema.safeParse()` → service → revalidate → return `ActionResult`.
  ```ts
  export type ActionResult<T = void> =
    | { ok: true; data?: T }
    | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
  ```
- Route handlers only for: search suggestions, media, tracking, sitemap, and robots.
- Use `notFound()` for missing content and `redirect()` after successful create actions.
- Each route segment that fetches data gets `loading.tsx` where the UX benefits from it, and `error.tsx` at group level.
- Use `next/image` (with the custom loader) for all content images and `next/link` for internal links.
- Forms in admin: native `<form action={serverAction}>` + `useActionState` + `useFormStatus`. No form library unless it's justified with an ADR.

## 4. Styling

- Tailwind utility classes using **design tokens only** (03). No arbitrary hex values in classNames.
- Use `cn()` (`clsx` + `tailwind-merge`) for conditional classes.
- Component variants are done with a small typed map object, not a library:
  ```ts
  const variants = { primary: "bg-ink text-bg hover:bg-ink/90", secondary: "border border-ink …" } as const;
  ```
- Class order is handled by `prettier-plugin-tailwindcss`.

## 5. Components

- One component per file, under ~150 lines. Extract subcomponents when a file grows past that.
- Props are typed and destructured, with no prop drilling deeper than 2 levels (compose instead).
- Reuse `ui/` primitives. Before creating a new component, search `src/components` for an existing one.
- Accessibility attributes are part of the component contract (see 05 §5).

## 6. Data layer

- Prisma is imported **only** in `src/server/repositories/*` (and `lib/db.ts`, seed, scripts).
- Repositories return plain objects with explicit `select`. Services shape view-models (e.g. `ProductCardVM`) for the UI.
- Prices stay as integers until formatting at the UI edge (`formatBDT`).
- Dates are stored as UTC and displayed in `Asia/Dhaka`.

## 7. Errors & logging

- Services throw typed errors (`NotFoundError`, `ValidationError`, `ConflictError`) from `lib/errors.ts`. Actions map them to `ActionResult`.
- Never swallow errors silently. Log with context: `console.error("[catalog.updateProduct]", { id }, err)`.

## 8. Formatting, linting, scripts

- Prettier (printWidth 100, double quotes, trailing commas) and ESLint (`next/core-web-vitals`, `next/typescript`, plus a rule banning `$queryRawUnsafe`/`$executeRawUnsafe` and Prisma imports outside the allowed paths via `no-restricted-imports`).
- `package.json` scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (vitest), `test:e2e` (playwright), `db:migrate`, `db:seed`, `db:studio`, `package` (standalone bundle).

## 9. Git

- Branches: `main` (deployable), `feat/<short-name>`, `fix/<short-name>`.
- Conventional commits: `feat: product gallery`, `fix: whatsapp url encoding`, `docs: update roadmap`.
- Every commit that completes a roadmap task also updates `PROGRESS.md`, the roadmap checkbox, and `CHANGELOG.md`.

## 10. Comments & docs

- Comment *why*, not *what*. Each module in `server/` starts with a one-line header comment describing its responsibility.
- When code and docs disagree, fix the docs in the same change, or record the deviation in DECISIONS.
