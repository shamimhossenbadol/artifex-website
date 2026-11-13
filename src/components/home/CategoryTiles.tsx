import {
  Armchair,
  BedDouble,
  Blinds,
  LampCeiling,
  Sofa,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/ui/Container";
import type { HomeCategoryVM } from "@/server/services/home.service";

/** Line icons for categories without a photo yet (ADR-029). */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  sofas: Sofa,
  "dining-tables": UtensilsCrossed,
  chairs: Armchair,
  beds: BedDouble,
  curtains: Blinds,
  chandeliers: LampCeiling,
};

/**
 * "Shop by category" (05 §3): 4:5 tiles. Mobile: a horizontal scroll-snap row with the next tile
 * peeking; desktop: a grid. Photos get a bottom scrim (the one place gradients are allowed, 03 §6).
 */
export function CategoryTiles({ categories }: { categories: HomeCategoryVM[] }) {
  if (categories.length === 0) return null;
  return (
    <section aria-labelledby="categories-heading" className="reveal py-16 md:py-24">
      <Container>
        <SectionHeading
          id="categories-heading"
          title="Collections"
          link={{ href: "/products", label: "All furniture" }}
        />
      </Container>
      <Container className="max-md:px-0">
        <ul className="flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2 sm:scroll-px-6 sm:px-6 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? Sofa;
            return (
              <li key={category.slug} className="w-[42%] shrink-0 snap-start sm:w-[30%] md:w-auto">
                <Link
                  href={category.href}
                  className="group bg-sand relative block aspect-[4/5] overflow-hidden"
                >
                  {category.imagePath ? (
                    <>
                      <Image
                        src={category.imagePath}
                        alt=""
                        fill
                        sizes="(min-width:1024px) 16vw, (min-width:768px) 33vw, 42vw"
                        className="object-cover transition-transform duration-500 ease-out motion-safe:md:group-hover:scale-[1.03]"
                      />
                      <div
                        aria-hidden
                        className="from-ink/65 absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent"
                      />
                    </>
                  ) : (
                    <Icon
                      aria-hidden
                      strokeWidth={1}
                      className="text-walnut absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-[60%] transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-[65%] md:size-16"
                    />
                  )}
                  <span
                    className={
                      category.imagePath
                        ? "text-bg absolute bottom-4 left-4 font-serif text-xl font-medium md:text-2xl"
                        : "text-ink absolute inset-x-0 bottom-5 text-center font-serif text-xl font-medium md:text-2xl"
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
