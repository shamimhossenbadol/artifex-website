import { SITE_TAGLINE } from "@/config/site";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";

// Temporary homepage. The real one (hero, categories, rails…) is built in Phase 6.
export default function HomePage() {
  return (
    <Container className="flex min-h-[60svh] flex-col items-center justify-center gap-6 py-24 text-center">
      <p className="animate-rise text-eyebrow text-walnut">Dhaka, Bangladesh</p>
      <h1 className="animate-settle text-display max-w-3xl">Artifex Furniture</h1>
      <p className="animate-rise text-body-lg stagger-1 max-w-xl">{SITE_TAGLINE}</p>
      <p className="animate-rise text-small text-muted stagger-2">Our new website is on its way.</p>
      <div className="animate-rise stagger-3 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/products">Explore collection</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Visit showroom
        </ButtonLink>
      </div>
    </Container>
  );
}
