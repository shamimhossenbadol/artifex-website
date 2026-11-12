import { Gem, MessageCircle, Ruler } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { getContactLinks } from "@/components/site/contact-links";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Markdown } from "@/components/ui/Markdown";
import { Skeleton } from "@/components/ui/Skeleton";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/server/services/settings.service";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Artifex Furniture brings crafted sofas, dining tables, beds, curtains and chandeliers to modern homes in Dhaka. Visit our Uttara showroom.",
  alternates: { canonical: "/about" },
};

/** Fixed brand values (F7). Kept to what the owner has confirmed; editable here only. */
const VALUES = [
  {
    Icon: Gem,
    title: "Crafted with care",
    text: "Solid materials, careful finishing and comfort that lasts for years of everyday use.",
  },
  {
    Icon: Ruler,
    title: "Made to fit your home",
    text: "Many pieces can be tailored in size, fabric and finish to suit your space.",
  },
  {
    Icon: MessageCircle,
    title: "Help when you need it",
    text: "Send us a photo of your room on WhatsApp and we'll help you choose.",
  },
] as const;

async function AboutStory() {
  const settings = await getSiteSettings();
  const { whatsappHref } = getContactLinks(settings);
  const story = settings.aboutContent ?? settings.aboutShort ?? settings.tagline ?? "";

  return (
    <>
      {story && <Markdown className="mx-auto">{story}</Markdown>}
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/contact" size="lg">
          Visit the showroom
        </ButtonLink>
        {whatsappHref && (
          <ButtonLink href={whatsappHref} external variant="whatsapp" size="lg">
            <WhatsAppIcon className="size-4" />
            Message us
          </ButtonLink>
        )}
      </div>
    </>
  );
}

export default function AboutPage() {
  return (
    <Container className="py-8 md:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />

      <div className="mx-auto max-w-3xl text-center">
        <p className="text-eyebrow text-walnut mt-10">Our story</p>
        <h1 className="text-h1 mt-3">Furniture for the way you live</h1>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <Suspense
          fallback={
            <div aria-busy="true" className="flex flex-col gap-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          }
        >
          <AboutStory />
        </Suspense>
      </div>

      <section aria-labelledby="values" className="reveal border-line mt-20 border-t pt-16">
        <h2 id="values" className="sr-only">
          What we stand for
        </h2>
        <ul className="grid gap-10 md:grid-cols-3">
          {VALUES.map(({ Icon, title, text }) => (
            <li key={title} className="flex flex-col items-start gap-3">
              <Icon aria-hidden strokeWidth={1.5} className="text-walnut size-7" />
              <h3 className="text-h3">{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
