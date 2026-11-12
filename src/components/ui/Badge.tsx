import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const BADGE_VARIANTS = {
  sale: "bg-sale text-white",
  new: "bg-ink text-bg",
  neutral: "border border-line bg-surface text-ink-soft",
} as const;

type BadgeProps = {
  variant?: keyof typeof BADGE_VARIANTS;
  className?: string;
  children: ReactNode;
};

/** Small uppercase label: "-15%", "New", "Made to order" (03 §5). */
export function Badge({ variant = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "tracking-badge inline-flex items-center rounded-sm px-2 py-1 text-[11px] leading-none font-medium uppercase",
        BADGE_VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
