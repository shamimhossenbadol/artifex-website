import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { getPriceInfo } from "@/lib/format";
import type { ProductCardVM } from "@/server/services/catalog.service";
import { ImagePlaceholder } from "./ImagePlaceholder";

/** Matches the grid: 2 cols mobile, 3 from md, 4 from xl (08 §3). */
export const PRODUCT_CARD_SIZES = "(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw";

type ProductCardProps = {
  product: ProductCardVM;
  /** Preload the image (first row only: the likely LCP element). */
  preload?: boolean;
};

/** Square image, title, category and price; the whole card is one link (03 §5). */
export function ProductCard({ product, preload = false }: ProductCardProps) {
  const price = getPriceInfo(product.regularPrice, product.discountPrice);

  return (
    <article className="group">
      <Link href={product.href} className="block">
        <div className="bg-sand relative aspect-square overflow-hidden">
          {product.image ? (
            <Image
              src={product.image.path}
              alt={product.image.alt}
              fill
              sizes={PRODUCT_CARD_SIZES}
              preload={preload}
              className="object-cover transition-transform duration-500 ease-out motion-safe:md:group-hover:scale-[1.03]"
            />
          ) : (
            <ImagePlaceholder />
          )}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {price.kind === "discounted" && <Badge variant="sale">-{price.percentOff}%</Badge>}
            {product.isNewArrival && <Badge variant="new">New</Badge>}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <h3 className="text-ink line-clamp-2 text-[15px] leading-snug font-medium underline-offset-4 group-hover:underline md:text-base">
            {product.title}
          </h3>
          <p className="text-small text-muted">{product.categoryName}</p>
          <Price
            regularPrice={product.regularPrice}
            discountPrice={product.discountPrice}
            className="mt-1"
          />
        </div>
      </Link>
    </article>
  );
}
