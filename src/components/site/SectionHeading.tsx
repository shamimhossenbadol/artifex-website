import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  /** Optional "View all" link, on the heading's row at the right. */
  link?: { href: string; label: string };
  id?: string;
  className?: string;
};

/** Eyebrow, then h2, then an optional "View all →" link (03 §5). */
export function SectionHeading({ eyebrow, title, link, id, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4 md:mb-12", className)}>
      <div className="flex min-w-0 flex-col gap-2 md:gap-3">
        {eyebrow && <p className="text-eyebrow text-walnut">{eyebrow}</p>}
        <h2 id={id} className="text-h2">
          {title}
        </h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="group text-ink -mb-2.5 inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium whitespace-nowrap underline-offset-4 hover:underline md:mb-0"
        >
          {link.label}
          <ArrowRight
            aria-hidden
            strokeWidth={1.5}
            className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
