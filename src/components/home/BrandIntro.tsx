import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import fullLogo from "@/assets/brand/artifex-logo.svg";

/** Brand introduction (05 §3): split visual/text with "Our story →". Hidden without text. */
export function BrandIntro({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <section aria-labelledby="brand-heading" className="reveal py-12 md:py-20">
      <Container className="grid items-center gap-8 md:grid-cols-[2fr_3fr] md:gap-16">
        {/* The full logo on sand is the visual: a compact panel, so the text sets the height. */}
        <div className="bg-sand flex aspect-[2/1] items-center justify-center md:aspect-[3/2]">
          <Image src={fullLogo} alt="" className="h-auto w-2/5" />
        </div>
        <div>
          <p className="text-eyebrow text-walnut">Our story</p>
          <h2 id="brand-heading" className="text-h2 mt-3">
            Decor your dreams
          </h2>
          <p className="text-body-lg mt-5 max-w-prose">{text}</p>
          <Link
            href="/about"
            className="group text-ink mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            Our story
            <ArrowRight
              aria-hidden
              strokeWidth={1.5}
              className="size-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </Container>
    </section>
  );
}
