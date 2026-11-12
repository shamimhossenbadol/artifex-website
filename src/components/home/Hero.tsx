import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import type { HomeHeroVM } from "@/server/services/home.service";

/**
 * Homepage hero (05 §3): full-bleed photo with a scrim when one is uploaded; until then an editorial,
 * typographic hero on ivory. The heading uses a transform-only entrance so LCP isn't delayed (ADR-021).
 */
export function Hero({ hero }: { hero: HomeHeroVM }) {
  const withImage = hero.image !== null;
  return (
    <section
      aria-labelledby="hero-heading"
      className={cn(
        "relative isolate flex min-h-[80svh] items-end overflow-hidden md:min-h-[88vh] md:items-center",
        withImage ? "bg-ink" : "bg-bg",
      )}
    >
      {hero.image && (
        <>
          <Image
            src={hero.image.path}
            alt={hero.image.alt}
            fill
            preload
            sizes="100vw"
            className="-z-10 object-cover"
          />
          {/* Solid scrim (no gradient outside category tiles, 03 §6) for legible text. */}
          <div aria-hidden className="bg-ink/35 absolute inset-0 -z-10" />
        </>
      )}
      {!withImage && (
        // Decorative fine lines that echo the logo's underline: CSS only, no image weight.
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="border-line absolute inset-x-0 top-1/2 border-t" />
          <div className="border-line absolute inset-y-0 left-1/2 hidden border-l md:block" />
        </div>
      )}
      <Container className="py-16 md:py-24">
        <div
          className={cn(
            "max-w-3xl",
            !withImage && "bg-bg md:mx-auto md:px-10 md:py-8 md:text-center",
          )}
        >
          {hero.eyebrow && (
            <p className={cn("animate-rise text-eyebrow", withImage ? "text-bg" : "text-walnut")}>
              {hero.eyebrow}
            </p>
          )}
          <h1
            id="hero-heading"
            className={cn("animate-settle text-display mt-4", withImage ? "text-bg" : "text-ink")}
          >
            {hero.heading}
          </h1>
          {hero.subheading && (
            <p
              className={cn(
                "animate-rise stagger-1 text-body-lg mt-5 max-w-xl",
                withImage ? "text-bg/90" : "md:mx-auto",
              )}
            >
              {hero.subheading}
            </p>
          )}
          <div
            className={cn(
              "animate-rise stagger-2 mt-8 flex flex-wrap gap-3",
              !withImage && "md:justify-center",
            )}
          >
            <ButtonLink
              href={hero.cta.href}
              size="lg"
              className={withImage ? "bg-bg text-ink hover:bg-sand" : undefined}
            >
              {hero.cta.label}
            </ButtonLink>
            {hero.secondary && (
              <ButtonLink
                href={hero.secondary.href}
                variant="secondary"
                size="lg"
                className={withImage ? "border-bg text-bg hover:bg-bg hover:text-ink" : undefined}
              >
                {hero.secondary.label}
              </ButtonLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
