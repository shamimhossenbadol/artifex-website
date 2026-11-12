import Image from "next/image";
import { cn } from "@/lib/utils";
import wordmark from "@/assets/brand/artifex-wordmark.svg";

/**
 * "Image missing" state (05 §4): a sand block with a faded brand mark. Inside a sand-tinted section
 * (`.rail-tinted`) it switches to the white surface so the card keeps a visible edge.
 */
export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-sand in-[.rail-tinted]:bg-surface flex h-full w-full items-center justify-center",
        className,
      )}
    >
      <Image src={wordmark} alt="" className="h-auto w-2/5 opacity-15 grayscale" />
    </div>
  );
}
