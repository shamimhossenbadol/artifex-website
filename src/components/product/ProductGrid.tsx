import type { ProductCardVM } from "@/server/services/catalog.service";
import { ProductCard } from "./ProductCard";

/** Product grid: 2 / 3 / 4 columns (05 §3). The first row's images are preloaded. */
export function ProductGrid({
  products,
  preloadFirst = 2,
}: {
  products: ProductCardVM[];
  preloadFirst?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 md:gap-x-6 md:gap-y-14 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} preload={index < preloadFirst} />
        </li>
      ))}
    </ul>
  );
}
