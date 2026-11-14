import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import type { HomeHeroVM } from "@/server/services/home.service";
import { HeroSlider } from "./HeroSlider";

/**
 * Homepage hero (05 §3): full-bleed photos with a scrim, in a visitor-driven slider when there are
 * several (ADR-039); with no photos, an editorial, typographic hero on ivory. The heading uses a
 * transform-only entrance so LCP isn't delayed (ADR-021).
 */
export function Hero({ hero }: { hero: HomeHeroVM }) {
  const withImage = hero.slides.length > 0;
  const frame = withImage
    ? // Phones: a shorter frame (5:4, 16:9 from sm) so the wide photos show well; md+: tall hero.
      "relative isolate flex aspect-[5/4] items-end overflow-hidden bg-ink sm:aspect-[16/9] md:aspect-auto md:min-h-[78vh] md:items-center"
    : "relative isolate flex items-center overflow-hidden bg-bg md:min-h-[68vh]";
  const content = withImage ? (
    // Over the photos: compact on phones (shorter frame), the full editorial size from md.
    <Container className="pt-6 pb-11 md:py-24">
      <div className="md:max-w-3xl">
        {hero.eyebrow && <p className="animate-rise text-eyebrow text-bg/90">{hero.eyebrow}</p>}
        <h1
          id="hero-heading"
          className="animate-settle text-h2 md:text-display text-bg mt-2 max-w-[17rem] sm:max-w-md md:mt-4 md:max-w-none"
        >
          {hero.heading}
        </h1>
        {hero.subheading && (
          <p className="animate-rise stagger-1 text-small md:text-body-lg text-bg/90 mt-2 max-w-[17rem] sm:max-w-md md:mt-5 md:max-w-xl">
            {hero.subheading}
          </p>
        )}
        <div className="animate-rise stagger-2 mt-4 flex flex-wrap gap-2 md:mt-8 md:gap-3">
          <ButtonLink
            href={hero.cta.href}
            className="bg-bg text-ink hover:bg-sand h-10 px-4 md:h-13 md:px-8"
          >
            {hero.cta.label}
          </ButtonLink>
          {hero.secondary && (
            <ButtonLink
              href={hero.secondary.href}
              variant="secondary"
              className="border-bg text-bg hover:bg-bg hover:text-ink h-10 px-4 md:h-13 md:px-8"
            >
              {hero.secondary.label}
            </ButtonLink>
          )}
        </div>
      </div>
    </Container>
  ) : (
    <Container className="py-12 md:py-24">
      <div className="bg-bg max-w-3xl md:mx-auto md:px-10 md:py-8 md:text-center">
        {hero.eyebrow && <p className="animate-rise text-eyebrow text-walnut">{hero.eyebrow}</p>}
        <h1 id="hero-heading" className="animate-settle text-display text-ink mt-4">
          {hero.heading}
        </h1>
        {hero.subheading && (
          <p className="animate-rise stagger-1 text-body-lg mt-5 max-w-xl md:mx-auto">
            {hero.subheading}
          </p>
        )}
        <div className="animate-rise stagger-2 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:justify-center">
          <ButtonLink href={hero.cta.href} size="lg" className="w-full sm:w-auto">
            {hero.cta.label}
          </ButtonLink>
          {hero.secondary && (
            <ButtonLink
              href={hero.secondary.href}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
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
