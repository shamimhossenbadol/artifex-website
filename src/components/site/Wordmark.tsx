import Link from "next/link";
import { cn } from "@/lib/utils";

/** Text wordmark until the real logo SVG is supplied (03 §8, PROGRESS open question #3). */
export function Wordmark({ className, linked = true }: { className?: string; linked?: boolean }) {
  const mark = (
    <span className={cn("inline-flex flex-col items-center leading-none", className)}>
      <span className="text-ink font-serif text-[22px] font-semibold tracking-[0.24em] md:text-[26px]">
        ARTIFEX
      </span>
      <span className="text-muted mt-1 text-[10px] font-medium tracking-[0.32em]">FURNITURE</span>
    </span>
  );
  if (!linked) return mark;
  return (
    <Link href="/" aria-label="Artifex Furniture, home" className="inline-flex py-1">
      {mark}
    </Link>
  );
}
