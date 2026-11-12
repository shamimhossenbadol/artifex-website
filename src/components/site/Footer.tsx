import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { COMPANY_LINKS } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { getNavCategories } from "@/server/services/catalog.service";
import { getSiteSettings } from "@/server/services/settings.service";
import { getContactLinks } from "./contact-links";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./SocialIcons";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { Wordmark } from "./Wordmark";

const HEADING = "text-eyebrow mb-4 text-ink";
const LINK =
  "inline-flex min-h-11 items-center text-ink-soft transition-colors hover:text-ink md:min-h-9";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className={HEADING}>{title}</h2>
      {children}
    </div>
  );
}

/** Site footer (05 §2): brand intro, categories, company links, contact, hours, social, ©. */
export async function Footer() {
  const [settings, categories] = await Promise.all([getSiteSettings(), getNavCategories()]);
  const { phone, telHref, whatsappHref } = getContactLinks(settings);
  const address = [settings.addressLine, settings.city].filter(Boolean).join(", ");
  const socials = [
    { href: settings.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: settings.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: settings.youtubeUrl, label: "YouTube", Icon: YoutubeIcon },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <footer className="border-line bg-sand border-t">
      <Container className="reveal grid gap-10 py-16 md:grid-cols-2 md:py-20 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div className="flex flex-col items-start gap-4">
          <Wordmark />
          {(settings.aboutShort ?? settings.tagline) && (
            <p className="text-ink-soft max-w-sm">{settings.aboutShort ?? settings.tagline}</p>
          )}
          {socials.length > 0 && (
            <ul className="-ml-3 flex items-center">
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

        {categories.length > 0 && (
          <FooterColumn title="Shop">
            <ul>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={category.href} className={LINK}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterColumn>
        )}

        <FooterColumn title="Company">
          <ul>
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </FooterColumn>

        <FooterColumn title="Visit & contact">
          <address className="flex flex-col gap-1 not-italic">
            {address && (
              <p className="text-ink-soft flex gap-3 py-2">
                <MapPin
                  aria-hidden
                  strokeWidth={1.5}
                  className="text-walnut mt-0.5 size-5 shrink-0"
                />
                {address}
              </p>
            )}
            {phone && telHref && (
              <a href={telHref} className={`${LINK} gap-3 tabular-nums`}>
                <Phone aria-hidden strokeWidth={1.5} className="text-walnut size-5" />
                {phone}
              </a>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${LINK} gap-3`}
              >
                <WhatsAppIcon className="text-whatsapp-dark size-5" />
                WhatsApp us
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`} className={LINK}>
                {settings.email}
              </a>
            )}
          </address>
          {settings.openingHours.length > 0 && (
            <dl className="text-small mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {settings.openingHours.map((entry) => (
                <div key={entry.days} className="contents">
                  <dt className="text-ink">{entry.days}</dt>
                  <dd className="text-ink-soft tabular-nums">
                    {"closed" in entry ? "Closed" : `${entry.open} – ${entry.close}`}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </FooterColumn>
      </Container>

      <div className="border-line border-t">
        <Container className="text-small text-muted py-6">
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
      <Container className="grid gap-10 py-16 md:grid-cols-2 md:py-20 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="bg-line h-4 w-24" />
            <Skeleton className="bg-line h-4 w-40" />
            <Skeleton className="bg-line h-4 w-32" />
          </div>
        ))}
      </Container>
    </footer>
  );
}
