import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  /** Optional "View all" link, aligned right on desktop. */
  link?: { href: string; label: string };
  id?: string;
  className?: string;
};

/** Eyebrow, then h2, then an optional "View all →" link (03 §5). */
export function SectionHeading({ eyebrow, title, link, id, className }: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        {eyebrow && <p className="text-eyebrow text-walnut">{eyebrow}</p>}
        <h2 id={id} className="text-h2">
          {title}
        </h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="group text-ink inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
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
