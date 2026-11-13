import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import type { HomeHeroVM } from "@/server/services/home.service";
import { HeroSlider } from "./HeroSlider";

/**
 * Homepage hero (05 §3): full-bleed photos with a scrim, in a visitor-driven slider when there are
 * several (ADR-039); with no photos, an editorial, typographic hero on ivory. The heading uses a
 * transform-only entrance so LCP isn't delayed (ADR-021).
 */
export function Hero({ hero }: { hero: HomeHeroVM }) {
  const withImage = hero.slides.length > 0;
  const frame = cn(
    "relative isolate flex overflow-hidden md:min-h-[68vh] md:items-center",
    // With photos the image needs room; the text-only hero doesn't need empty space on phones.
    withImage ? "bg-ink min-h-[60svh] items-end" : "bg-bg items-center",
  );
  const content = (
    <Container className={cn("md:py-24", withImage ? "py-16" : "py-12")}>
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
            "animate-rise stagger-2 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap",
            !withImage && "md:justify-center",
          )}
        >
          <ButtonLink
            href={hero.cta.href}
            size="lg"
            className={cn("w-full sm:w-auto", withImage && "bg-bg text-ink hover:bg-sand")}
          >
            {hero.cta.label}
          </ButtonLink>
          {hero.secondary && (
            <ButtonLink
              href={hero.secondary.href}
              variant="secondary"
              size="lg"
              className={cn(
                "w-full sm:w-auto",
                withImage && "border-bg text-bg hover:bg-bg hover:text-ink",
              )}
            >
              {hero.secondary.label}
            </ButtonLink>
          )}
        </div>
      </div>
    </Container>
  );

  if (withImage) {
    return (
      <HeroSlider slides={hero.slides} className={frame} labelledBy="hero-heading">
        {content}
      </HeroSlider>
    );
  }
  return (
    <section aria-labelledby="hero-heading" className={frame}>
      {/* Decorative fine lines that echo the logo's underline: CSS only, no image weight. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
        <div className="border-line absolute inset-x-0 top-1/2 border-t" />
        <div className="border-line absolute inset-y-0 left-1/2 hidden border-l md:block" />
      </div>
      {content}
    </section>
  );
}
