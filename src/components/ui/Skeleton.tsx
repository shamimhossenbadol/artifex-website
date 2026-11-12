import { cn } from "@/lib/utils";

/** Sand placeholder block with a subtle pulse (stopped under reduced motion by globals.css). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("bg-sand animate-pulse rounded-sm", className)} />;
}
