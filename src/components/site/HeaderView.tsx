import { ChevronDown, Phone, Search } from "lucide-react";
import Link from "next/link";
import { COMPANY_LINKS, HEADER_CATEGORY_LABELS, MAX_HEADER_CATEGORIES } from "@/config/site";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { MobileNav } from "./MobileNav";
import { StickyHeader } from "./StickyHeader";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { Logo } from "./Logo";

export type HeaderViewProps = {
  categories: { name: string; slug: string; href: string; imagePath: string | null }[];
  phone: string | null;
  telHref: string | null;
  whatsappHref: string | null;
  facebookUrl: string | null;
};

const ICON_LINK =
  "inline-flex size-11 items-center justify-center text-ink transition-colors hover:text-walnut";
const NAV_LINK =
  "inline-flex min-h-11 items-center text-sm font-medium text-ink transition-colors hover:text-walnut";

/** Presentational header (05 §2). Also rendered with empty data as the streaming fallback. */
export function HeaderView({
  categories,
  phone,
  telHref,
  whatsappHref,
  facebookUrl,
}: HeaderViewProps) {
  const primary = categories.slice(0, MAX_HEADER_CATEGORIES);
  const more = categories.slice(MAX_HEADER_CATEGORIES);

  return (
    <>
      {/* Utility bar (desktop only). It scrolls away; the main bar below is sticky. */}
      <div className="border-line hidden border-b lg:block">
        <Container className="text-small flex h-9 items-center justify-end gap-6">
          <nav aria-label="Company">
            <ul className="flex items-center gap-6">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted hover:text-ink transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {phone && telHref && (
            <a href={telHref} className="text-muted hover:text-ink tabular-nums transition-colors">
              {phone}
            </a>
          )}
        </Container>
      </div>

      <StickyHeader>
        {/* Mobile: [Menu] [Logo] [Search] */}
        <Container className="grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:hidden">
          <div className="justify-self-start">
            <MobileNav
              categories={categories}
              companyLinks={COMPANY_LINKS}
              phone={phone}
              telHref={telHref}
              whatsappHref={whatsappHref}
              facebookUrl={facebookUrl}
            />
          </div>
          <Logo animated className="h-10" />
          <Link href="/search" className={`${ICON_LINK} -mr-2 justify-self-end`}>
            <Search aria-hidden strokeWidth={1.5} className="size-6" />
            <span className="sr-only">Search</span>
          </Link>
        </Container>

        {/* Desktop: [Logo] categories [Search] [Phone] [Inquire] */}
        <Container className="hidden h-20 items-center gap-8 transition-[height] duration-200 ease-out group-data-[scrolled=true]/header:h-16 lg:flex">
          <Logo
            animated
            className="h-12 transition-[height] duration-200 ease-out group-data-[scrolled=true]/header:h-10"
          />
          <nav aria-label="Categories" className="flex-1">
            <ul className="flex items-center justify-center gap-x-6 xl:gap-x-8">
              {primary.map((category) => (
                <li key={category.slug}>
                  <Link href={category.href} className={NAV_LINK}>
                    {HEADER_CATEGORY_LABELS[category.slug] ?? category.name}
                  </Link>
                </li>
              ))}
              {more.length > 0 && (
                <li className="relative">
                  <details className="group">
                    <summary className={`${NAV_LINK} cursor-pointer list-none gap-1`}>
                      More
                      <ChevronDown
                        aria-hidden
                        strokeWidth={1.5}
                        className="size-4 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <ul className="border-line bg-surface absolute top-full right-0 z-10 min-w-48 border py-2">
                      {more.map((category) => (
                        <li key={category.slug}>
                          <Link
                            href={category.href}
                            className="text-ink hover:bg-sand flex min-h-11 items-center px-4 text-sm"
                          >
                            {category.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              )}
            </ul>
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/search" className={ICON_LINK}>
              <Search aria-hidden strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Search</span>
            </Link>
            {telHref && (
              <a href={telHref} className={ICON_LINK}>
                <Phone aria-hidden strokeWidth={1.5} className="size-5" />
                <span className="sr-only">Call us{phone ? ` at ${phone}` : ""}</span>
              </a>
            )}
            {whatsappHref && (
              <ButtonLink href={whatsappHref} external variant="whatsapp" className="ml-2">
                <WhatsAppIcon className="size-4" />
                Inquire
              </ButtonLink>
            )}
          </div>
        </Container>
      </StickyHeader>
    </>
  );
}
