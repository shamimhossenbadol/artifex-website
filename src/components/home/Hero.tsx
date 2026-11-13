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
    "relative isolate flex min-h-[60svh] items-end overflow-hidden md:min-h-[68vh] md:items-center",
    withImage ? "bg-ink" : "bg-bg",
  );
  const content = (
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
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="border-line absolute inset-x-0 top-1/2 border-t" />
        <div className="border-line absolute inset-y-0 left-1/2 hidden border-l md:block" />
      </div>
      {content}
    </section>
  );
}
