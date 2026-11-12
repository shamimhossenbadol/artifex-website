import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { cn } from "@/lib/utils";
import fullLogo from "@/assets/brand/artifex-logo.svg";
import wordmark from "@/assets/brand/artifex-wordmark.svg";

type LogoProps = {
  /** "wordmark": A + RTIFEX only (header). "full": with the "Decor your dreams" tagline (footer). */
  variant?: "wordmark" | "full";
  /** Play the one-time entrance wipe (header only; CSS, disabled for reduced motion). */
  animated?: boolean;
  className?: string;
};

/**
 * Brand logo (03 §8). The SVGs are imported as static files, so they get a content-hashed URL
 * with an immutable cache: phones download them once, not on every page (ADR-022).
 */
export function Logo({ variant = "wordmark", animated = false, className }: LogoProps) {
  const src = variant === "full" ? fullLogo : wordmark;
  return (
    <Link
      href="/"
      className={cn("inline-flex shrink-0 items-center py-1", className)}
      aria-label={`${SITE_NAME}, home`}
    >
      <Image
        src={src}
        alt=""
        // Width follows the CSS height; the intrinsic size keeps the aspect ratio (no layout shift).
        className={cn("h-full w-auto", animated && "animate-logo")}
        // The header logo is always above the fold: don't lazy-load it. The footer one stays lazy.
        loading={animated ? "eager" : "lazy"}
        draggable={false}
      />
    </Link>
  );
}
