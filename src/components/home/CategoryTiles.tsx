import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/site/category-icons";
import { Container } from "@/components/ui/Container";
import type { HomeCategoryVM } from "@/server/services/home.service";

/**
 * "Collections" (05 §3): a 3-column grid of tiles on phones and tablets, 6 across on desktop.
 * Photos get a bottom scrim (the one place gradients are allowed, 03 §6); categories without a
 * photo show their line icon (ADR-029).
 */
export function CategoryTiles({ categories }: { categories: HomeCategoryVM[] }) {
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="categories-heading" className="reveal pt-8 md:pt-10 md:pb-24">
      <Container>
        {/* No visible heading: the hero's buttons already lead to all furniture (ADR-050). */}
        <h2 id="categories-heading" className="sr-only">
          Collections
        </h2>
        <ul className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-6 lg:grid-cols-6">
          {categories.map((category) => {
            return (
              <li key={category.slug}>
                <Link
                  href={category.href}
                  className="group bg-sand relative block aspect-square overflow-hidden md:aspect-[4/5]"
                >
                  {category.imagePath ? (
                    <>
                      <Image
                        src={category.imagePath}
                        alt=""
                        fill
                        sizes="(min-width:1024px) 16vw, 33vw"
                        className="object-cover transition-transform duration-500 ease-out motion-safe:md:group-hover:scale-[1.03]"
                      />
                      <div
                        aria-hidden
                        className="from-ink/65 absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent"
                      />
                    </>
                  ) : (
                    <CategoryIcon
                      slug={category.slug}
                      aria-hidden
                      strokeWidth={1}
                      className="text-walnut absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-[65%] transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-[70%] md:size-16 md:-translate-y-[60%]"
                    />
                  )}
                  <span
                    className={
                      category.imagePath
                        ? "text-bg text-small md:text-h3 absolute inset-x-2 bottom-2 text-center leading-tight font-medium md:inset-x-4 md:bottom-4 md:text-left"
                        : "text-ink text-small md:text-h3 absolute inset-x-1 bottom-2.5 text-center leading-tight font-medium md:bottom-5"
                    }
                  >
                    {category.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
