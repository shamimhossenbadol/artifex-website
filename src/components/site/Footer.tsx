import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { DEVELOPER } from "@/config/site";
import { Skeleton } from "@/components/ui/Skeleton";
import { getSiteSettings } from "@/server/services/settings.service";
import { getContactLinks } from "./contact-links";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./SocialIcons";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { Logo } from "./Logo";

/** Rounded contact buttons: compact, still 44 px tall for touch. */
const PILL =
  "border-line bg-surface text-ink hover:border-ink text-small inline-flex min-h-11 items-center gap-2 rounded-full border px-4 transition-colors";

/**
 * Compact footer (ADR-035, ADR-049, ADR-050, ADR-061): from md, brand (logo, two-line description,
 * social icons) and contact (address, phone and WhatsApp buttons, email) in two columns, then a
 * quiet line with © and the developer credit. Phones show only logo → address → email → social
 * icons, centred and compact (ADR-064: no rule under the logo, tight gaps), then © and the credit
 * (no description). Phone product pages hide the © and credit bar (ADR-071). Navigation lives
 * in the header.
 */
export async function Footer() {
  const settings = await getSiteSettings();
  const { phone, telHref, whatsappHref } = getContactLinks(settings);
  const address = [settings.addressLine, settings.city].filter(Boolean).join(", ");
  const description = settings.aboutShort ?? settings.tagline;
  const socials = [
    { href: settings.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: settings.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: settings.youtubeUrl, label: "YouTube", Icon: YoutubeIcon },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  /** Social icons: under the description from md; last on phones (ADR-061). */
  const socialList = (className: string) =>
    socials.length > 0 && (
      <ul className={cn("items-center", className)}>
        {socials.map(({ href, label, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-soft hover:text-walnut border-line bg-surface inline-flex size-10 items-center justify-center rounded-full border transition-colors md:size-11 md:border-0 md:bg-transparent"
            >
              <Icon />
              <span className="sr-only">
                {settings.businessName} on {label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    );

  return (
    // Phone product pages (ADR-068): room at the bottom so the fixed price/contact bar never
    // covers the social icons or the credit line.
    <footer className="border-line bg-sand border-t max-lg:[body:has([data-product-bar])_&]:pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <Container className="flex flex-col items-center gap-3 pt-6 pb-8 text-center md:grid md:grid-cols-[1.2fr_1fr] md:items-start md:gap-12 md:py-10 md:text-left">
        <div className="flex flex-col items-center md:items-start md:gap-3">
          <Logo variant="full" className="h-11" />
          {description && (
            <p className="text-ink-soft text-small line-clamp-2 hidden max-w-sm md:block">
              {description}
            </p>
          )}
          {socialList("hidden md:-my-1 md:-ml-2.5 md:flex md:gap-0")}
        </div>

        <address className="flex flex-col items-center not-italic md:items-start md:gap-3">
          {address && (
            <p className="text-ink-soft text-small flex max-w-xs flex-col items-center gap-1 md:max-w-none md:flex-row md:items-start md:gap-2">
              <MapPin
                aria-hidden
                strokeWidth={1.5}
                className="text-walnut mt-0.5 hidden size-4 shrink-0 md:block"
              />
              {address}
            </p>
          )}
          {/* Phones have the floating call and WhatsApp buttons, so these show from md only. */}
          <div className="hidden flex-wrap gap-2 md:flex">
            {phone && telHref && (
              <a href={telHref} className={`${PILL} tabular-nums`}>
                <Phone aria-hidden strokeWidth={1.5} className="text-walnut size-4 shrink-0" />
                {phone}
              </a>
            )}
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={PILL}>
                <WhatsAppIcon className="text-whatsapp-dark size-4 shrink-0" />
                WhatsApp
              </a>
            )}
          </div>
          {settings.email && (
            <a
              href={`mailto:${settings.email}`}
              className="text-ink-soft hover:text-ink text-small inline-flex min-h-8 items-center gap-2 underline-offset-4 hover:underline md:min-h-0"
            >
              <Mail
                aria-hidden
                strokeWidth={1.5}
                className="text-walnut size-4 shrink-0 md:hidden"
              />
              {settings.email}
            </a>
          )}
        </address>

        {/* Phones (ADR-061): logo → address → email → social icons. */}
        {socialList("-mt-1 flex gap-2 md:hidden")}
      </Container>

      {/* Phone product pages (ADR-071) drop this bar: on phones it only holds the credit. */}
      <div className="border-line border-t max-md:[body:has([data-product-bar])_&]:hidden">
        {/* © on the left and the credit on the right; on phones the credit sits below. Below md
            the right padding keeps both lines clear of the floating Messenger/WhatsApp buttons
            (ADR-089). */}
        <Container className="text-small text-muted flex flex-col items-center gap-0 py-2 text-center max-md:pr-16 sm:flex-row sm:justify-between sm:gap-4 sm:py-3 sm:text-left">
          {/* Shown on every page; the whole bar is hidden on phone product pages only (ADR-071). */}
          <p className="pt-1 sm:py-1">
            © {new Date().getFullYear()} {settings.businessName}. All rights reserved.
          </p>
          <p>
            Developed by{" "}
            <a
              href={DEVELOPER.href}
              target="_blank"
              rel="noopener noreferrer"
              data-no-track
              className="text-ink-soft hover:text-ink inline-flex min-h-8 items-center underline-offset-4 hover:underline sm:min-h-0"
            >
              {DEVELOPER.name}
            </a>
          </p>
        </Container>
      </div>
    </footer>
  );
}

/** Streaming placeholder with roughly the footer's height. */
export function FooterFallback() {
  return (
    <footer aria-hidden className="border-line bg-sand border-t">
      <Container className="grid gap-6 py-8 md:grid-cols-[1.2fr_1fr] md:gap-12 md:py-10">
        <div className="flex flex-col gap-3">
          <Skeleton className="bg-line h-11 w-32" />
          <Skeleton className="bg-line h-4 w-72" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="bg-line h-4 w-56" />
          <Skeleton className="bg-line h-4 w-40" />
          <Skeleton className="bg-line h-4 w-32" />
        </div>
      </Container>
      <div className="border-line h-12 border-t" />
    </footer>
  );
}
