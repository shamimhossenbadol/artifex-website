import { ChevronDown, Phone } from "lucide-react";
import Link from "next/link";
import {
  COMPANY_LINKS,
  HEADER_CATEGORY_LABELS,
  HEADER_HIDDEN_CATEGORIES,
  MAX_HEADER_CATEGORIES,
} from "@/config/site";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { MobileMenuButton } from "./MobileNav";
import { SearchButton } from "./SearchButton";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { Logo } from "./Logo";

export type HeaderViewProps = {
  categories: { name: string; slug: string; href: string; imagePath: string | null }[];
  phone: string | null;
  telHref: string | null;
  whatsappHref: string | null;
};

const ICON_LINK =
  "inline-flex size-11 items-center justify-center text-ink transition-colors hover:text-walnut";
const NAV_LINK =
  "inline-flex min-h-11 items-center text-sm font-medium text-ink transition-colors hover:text-walnut";

/**
 * Presentational header (05 §2). Also rendered with empty data as the streaming fallback, so it
 * holds only buttons: the search overlay and the mobile drawer live in SiteShell (ADR-043).
 */
export function HeaderView({
  categories: allCategories,
  phone,
  telHref,
  whatsappHref,
}: HeaderViewProps) {
  const categories = allCategories.filter((c) => !HEADER_HIDDEN_CATEGORIES.includes(c.slug));
  const primary = categories.slice(0, MAX_HEADER_CATEGORIES);
  const more = categories.slice(MAX_HEADER_CATEGORIES);

  // One clean header row (ADR-026): categories, then Journal/About/Contact (ADR-035); the phone
  // stays as an icon next to the Inquire button.
  return (
    <>
      {/* Always compact (64 px) and sticky; no scroll script. */}
      <header className="bg-bg border-line sticky top-0 z-40 border-b">
        {/* Mobile: [Menu] [Logo] [Search] */}
        <Container className="grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:hidden">
          <div className="justify-self-start">
            <MobileMenuButton />
          </div>
          <Logo variant="lockup" priority />
          <SearchButton className="-mr-2 justify-self-end" iconClassName="size-6" />
        </Container>

        {/* Desktop: [Logo] categories [Search] [Phone] [Inquire] */}
        <Container className="hidden h-16 items-center gap-8 lg:flex">
          <Logo priority className="h-10" />
          <nav aria-label="Main" className="flex-1">
            <ul className="flex items-center justify-center gap-x-5 xl:gap-x-7">
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
              {COMPANY_LINKS.map((link, index) => (
                <li
                  key={link.href}
                  className={
                    index === 0 && categories.length > 0
                      ? "border-line border-l pl-5 xl:pl-7"
                      : undefined
                  }
                >
                  <Link href={link.href} className={NAV_LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-1">
            <SearchButton />
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
      </header>
    </>
  );
}
