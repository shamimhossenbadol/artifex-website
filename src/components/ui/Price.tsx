import { formatBDT, getPriceInfo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

type PriceProps = {
  regularPrice: number | null;
  discountPrice?: number | null;
  /** Show the "-15%" badge next to a discounted price (cards show it on the image instead). */
  showBadge?: boolean;
  className?: string;
};

/**
 * Price display rules (F1.3). A discount uses colour + strike-through + badge text, so colour is
 * never the only signal (05 §5).
 */
export function Price({
  regularPrice,
  discountPrice = null,
  showBadge = false,
  className,
}: PriceProps) {
  const info = getPriceInfo(regularPrice, discountPrice);

  if (info.kind === "onRequest") {
    return <p className={cn("text-price text-ink", className)}>Price on request</p>;
  }
  if (info.kind === "regular") {
    return <p className={cn("text-price text-ink", className)}>{formatBDT(info.price)}</p>;
  }
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      <span className="text-price text-sale">
        <span className="sr-only">Sale price </span>
        {formatBDT(info.price)}
      </span>
      <s className="text-small text-muted tabular-nums">
        <span className="sr-only">Regular price </span>
        {formatBDT(info.regularPrice)}
      </s>
      {showBadge && <Badge variant="sale">-{info.percentOff}%</Badge>}
    </p>
  );
}
