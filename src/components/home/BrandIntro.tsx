import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import fullLogo from "@/assets/brand/artifex-logo.svg";

/**
 * Brand introduction (05 §3): split visual/text with "Our story →". Hidden without text.
 * Phones (ADR-050): one centred sand card (logo, walnut rule, eyebrow, heading, text, outlined
 * link). From md: the logo panel beside the text.
 */
export function BrandIntro({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <section aria-labelledby="brand-heading" className="reveal pt-8 md:py-20">
      <Container>
        <div className="bg-sand grid items-center px-6 py-10 text-center md:grid-cols-[2fr_3fr] md:gap-16 md:bg-transparent md:p-0 md:text-left">
          {/* The full logo on sand is the visual: a compact panel, so the text sets the height. */}
          <div className="md:bg-sand flex justify-center md:aspect-[3/2] md:items-center">
            <Image src={fullLogo} alt="" className="h-auto w-28 md:w-2/5" />
          </div>
          <div>
            <div aria-hidden className="bg-walnut/50 mx-auto my-6 h-px w-10 md:hidden" />
            <p className="text-eyebrow text-walnut">Our story</p>
            <h2 id="brand-heading" className="text-section md:text-h2 mt-2 md:mt-3">
              Decor your dreams
            </h2>
            <p className="text-body md:text-body-lg mx-auto mt-3 max-w-prose md:mx-0 md:mt-5">
              {text}
            </p>
            <Link
              href="/about"
              className="group text-ink border-ink hover:bg-ink hover:text-bg md:hover:text-ink mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors md:rounded-none md:border-0 md:px-0 md:underline-offset-4 md:hover:bg-transparent md:hover:underline"
            >
              Our story
              <ArrowRight
                aria-hidden
                strokeWidth={1.5}
                className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
