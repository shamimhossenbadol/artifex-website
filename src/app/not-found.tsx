import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { getNavCategories } from "@/server/services/catalog.service";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

async function CategoryLinks() {
  const categories = await getNavCategories();
  if (categories.length === 0) return null;
  return (
    <nav aria-label="Browse categories" className="mt-4">
      <ul className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={category.href}
              className="border-line bg-surface text-ink hover:border-ink inline-flex min-h-11 items-center rounded-md border px-4 text-sm transition-colors"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Branded 404 with search and category links (05 §4). */
export default function NotFound() {
  return (
    <SiteShell>
      <Container className="flex min-h-[55svh] flex-col items-center justify-center gap-6 py-24 text-center">
        <p className="text-eyebrow text-walnut">404</p>
        <h1 className="text-h1">We couldn&apos;t find that page</h1>
        <p className="max-w-md">
          The page may have moved, or the link may be mistyped. Try a search or browse a category.
        </p>
        <form action="/search" method="get" role="search" className="flex w-full max-w-md gap-2">
          <label htmlFor="not-found-search" className="sr-only">
            Search products
          </label>
          <Input
            id="not-found-search"
            type="search"
            name="q"
            placeholder="Search sofas, beds, chandeliers…"
            minLength={2}
            maxLength={60}
            required
          />
          <Button type="submit">Search</Button>
        </form>
        <Suspense fallback={null}>
          <CategoryLinks />
        </Suspense>
        <ButtonLink href="/" variant="ghost">
          Back to home
        </ButtonLink>
      </Container>
    </SiteShell>
  );
}
