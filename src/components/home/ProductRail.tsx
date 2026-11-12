import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import type { ProductCardVM } from "@/server/services/catalog.service";

/**
 * Product rail (05 §3): mobile = horizontal scroll-snap with the next card peeking; desktop =
 * 4-column grid. Hidden when empty (F6). Images are lazy (never the LCP on the homepage).
 */
export function ProductRail({
  id,
  eyebrow,
  title,
  products,
  link,
  tinted = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  products: ProductCardVM[];
  link?: { href: string; label: string };
  /** Alternate section background (03 §1 sand) to separate neighbouring rails. */
  tinted?: boolean;
}) {
  if (products.length === 0) return null;
  return (
    <section
      aria-labelledby={id}
      className={cn("reveal py-16 md:py-24", tinted && "rail-tinted bg-sand")}
    >
      <Container>
        <SectionHeading id={id} eyebrow={eyebrow} title={title} link={link} />
      </Container>
      <Container className="max-md:px-0">
        <ul className="flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-2 sm:scroll-px-6 sm:px-6 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-14 md:overflow-visible md:px-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <li key={product.id} className="w-[66%] shrink-0 snap-start sm:w-[40%] md:w-auto">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
