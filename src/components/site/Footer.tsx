import { MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { getSiteSettings } from "@/server/services/settings.service";
import { getContactLinks } from "./contact-links";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./SocialIcons";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { Logo } from "./Logo";

const ROW = "text-ink-soft flex items-start gap-3";
const LINK_ROW = `${ROW} min-h-11 items-center transition-colors hover:text-ink md:min-h-9`;
const ICON = "text-walnut mt-0.5 size-5 shrink-0";

/**
 * Compact footer (ADR-035): brand, short description and social icons on one side; address,
 * phone and WhatsApp on the other; a quiet © line. Navigation lives in the header.
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
      <Container className="grid gap-8 py-10 md:grid-cols-[1.3fr_1fr] md:items-start md:gap-16 md:py-12">
        <div className="flex flex-col items-start gap-4">
          <Logo variant="full" className="h-14" />
          {description && <p className="text-ink-soft text-small max-w-md">{description}</p>}
          {socials.length > 0 && (
            <ul className="-ml-2.5 flex items-center">
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

        <address className="flex flex-col gap-1 not-italic md:pt-2">
          {address && (
            <p className={`${ROW} py-1.5`}>
              <MapPin aria-hidden strokeWidth={1.5} className={ICON} />
              {address}
            </p>
          )}
          {phone && telHref && (
            <a href={telHref} className={`${LINK_ROW} tabular-nums`}>
              <Phone aria-hidden strokeWidth={1.5} className="text-walnut size-5 shrink-0" />
              {phone}
            </a>
          )}
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={LINK_ROW}>
              <WhatsAppIcon className="text-whatsapp-dark size-5 shrink-0" />
              WhatsApp us
            </a>
          )}
          {settings.email && (
            <a href={`mailto:${settings.email}`} className={LINK_ROW}>
              {settings.email}
            </a>
          )}
        </address>
      </Container>

      <div className="border-line border-t">
        <Container className="text-small text-muted py-4">
          © {new Date().getFullYear()} {settings.businessName}. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}

/** Streaming placeholder with roughly the footer's height. */
export function FooterFallback() {
  return (
    <footer aria-hidden className="border-line bg-sand border-t">
      <Container className="grid gap-8 py-10 md:grid-cols-[1.3fr_1fr] md:gap-16 md:py-12">
        <div className="flex flex-col gap-3">
          <Skeleton className="bg-line h-14 w-36" />
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
