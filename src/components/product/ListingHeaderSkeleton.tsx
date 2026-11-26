import { Skeleton } from "@/components/ui/Skeleton";
import { ProductGridSkeleton } from "./ProductGridSkeleton";

/**
 * Streaming fallback for listing pages: breadcrumb, title, toolbar and cards. Phones show the
 * cards only, like the page itself (ADR-089).
 */
export function ListingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <div className="hidden md:block">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-6 h-14 w-64" />
        <Skeleton className="mt-4 h-5 w-full max-w-md" />
        <div className="mt-10 mb-8 flex gap-2">
          <Skeleton className="h-11 w-24" />
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-11 w-40" />
        </div>
      </div>
      <ProductGridSkeleton />
    </div>
  );
}
