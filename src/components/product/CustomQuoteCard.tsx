// Compact custom-quote card for products without a fixed price (ADR-063). Most Artifex pieces are
// made to order, so instead of a bare "Price on request" line (plus a separate "Made to order"
// badge) the product page says the price follows the customer's choices and invites a free quote.
// The WhatsApp/Messenger buttons follow directly below it. Flat, on sand, like the public design.
import { BadgeCheck, Palette, Ruler, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const POINTS: { Icon: LucideIcon; text: string }[] = [
  { Icon: Ruler, text: "Your size" },
  { Icon: Palette, text: "Fabric & finish" },
  { Icon: BadgeCheck, text: "Free quote" },
];

export function CustomQuoteCard({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="custom-quote"
      className={cn(
        "border-walnut/30 bg-sand relative overflow-hidden rounded-md border py-3.5 pr-4 pl-5",
        className,
      )}
    >
      <span aria-hidden className="bg-walnut absolute inset-y-0 left-0 w-1" />
      <h2 id="custom-quote" className="text-h3">
        Priced to your design
      </h2>
      <p className="text-small text-ink-soft mt-0.5">
        Made to order: message us for a quote based on your customisation.
      </p>
      <ul className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1.5">
        {POINTS.map(({ Icon, text }) => (
          <li key={text} className="text-small text-ink flex items-center gap-1.5">
            <Icon aria-hidden strokeWidth={1.5} className="text-walnut size-4 shrink-0" />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
