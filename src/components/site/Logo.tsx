import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { cn } from "@/lib/utils";
import fullLogo from "@/assets/brand/artifex-logo.svg";
import wordmark from "@/assets/brand/artifex-wordmark.svg";

type LogoProps = {
  /**
   * "wordmark": A + RTIFEX only (desktop header). "lockup": the wordmark followed by FURNITURE on the
   * same line, matching RTIFEX (mobile header, ADR-045). "full": with "Decor your dreams" (footer).
   */
  variant?: "wordmark" | "lockup" | "full";
  /** Header logo: preloaded so it shows with the first paint (the footer one stays lazy). */
  priority?: boolean;
  className?: string;
};

/**
 * Brand logo (03 §8). The SVGs are imported as static files, so they get a content-hashed URL
 * with an immutable cache: phones download them once, not on every page (ADR-022).
 */
export function Logo({ variant = "wordmark", priority = false, className }: LogoProps) {
  const src = variant === "full" ? fullLogo : wordmark;
  if (variant === "lockup") {
    return (
      <Link
        href="/"
        className={cn("inline-flex shrink-0 items-start py-1", className)}
        aria-label={`${SITE_NAME}, home`}
      >
        <Image
          src={wordmark}
          alt=""
          className="h-8 w-auto"
          preload={priority}
          loading={priority ? "eager" : "lazy"}
          draggable={false}
        />
        {/*
          Same line and cap height as "RTIFEX", in the logo red; the F is enlarged like the A of
          ARTIFEX and shares the baseline (ADR-045).
        */}
        <span aria-hidden className="text-logo-word text-brand mt-[var(--logo-word-top)] ml-1.5">
          <span className="text-logo-first">F</span>urniture
        </span>
      </Link>
    );
  }
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
        className="h-full w-auto"
        preload={priority}
        loading={priority ? "eager" : "lazy"}
        draggable={false}
      />
    </Link>
  );
}
