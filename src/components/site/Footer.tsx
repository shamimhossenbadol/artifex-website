import { MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
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
 * Compact footer (ADR-035, ADR-049): brand (logo, two-line description, social icons) and contact
 * (one-line address, phone and WhatsApp as rounded buttons, email); centred on phones, two columns
 * from md; a quiet line with the developer credit and ©. Navigation lives in the header.
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

  return (
    <footer className="border-line bg-sand border-t">
      <Container className="flex flex-col items-center gap-6 py-8 text-center md:grid md:grid-cols-[1.2fr_1fr] md:items-start md:gap-12 md:py-10 md:text-left">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <Logo variant="full" className="h-11" />
          {description && (
            <p className="text-ink-soft text-small line-clamp-2 max-w-sm">{description}</p>
          )}
          {socials.length > 0 && (
            <ul className="-my-1 flex items-center md:-ml-2.5">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-soft hover:text-walnut inline-flex size-11 items-center justify-center transition-colors"
                  >
                    <Icon />
                    <span className="sr-only">
                      {settings.businessName} on {label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <address className="flex flex-col items-center gap-3 not-italic md:items-start">
          {address && (
            <p className="text-ink-soft text-small inline-flex items-start gap-2">
              <MapPin
                aria-hidden
                strokeWidth={1.5}
                className="text-walnut mt-0.5 size-4 shrink-0"
              />
              {address}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
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
              className="text-ink-soft hover:text-ink text-small inline-flex min-h-11 items-center underline-offset-4 hover:underline md:min-h-0"
            >
              {settings.email}
            </a>
          )}
        </address>
      </Container>

      <div className="border-line border-t">
        {/* Credit first: left on desktop, top line on phones. */}
        <Container className="text-small text-muted flex flex-col items-center gap-0 py-3 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
          <p>
            Developed by{" "}
            <a
              href={DEVELOPER.href}
              target="_blank"
              rel="noopener noreferrer"
              data-no-track
              className="text-ink-soft hover:text-ink inline-flex min-h-11 items-center underline-offset-4 hover:underline sm:min-h-0"
            >
              {DEVELOPER.name}
            </a>
          </p>
          <p className="py-1">
            © {new Date().getFullYear()} {settings.businessName}. All rights reserved.
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
