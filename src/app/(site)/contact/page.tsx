import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { MapLoader } from "@/components/contact/MapLoader";
import { OpeningStatus } from "@/components/contact/OpeningStatus";
import { FacebookIcon } from "@/components/site/SocialIcons";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { getContactLinks } from "@/components/site/contact-links";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Skeleton } from "@/components/ui/Skeleton";
import { toMessengerUrl } from "@/lib/messenger";
import { formatHoursRange, toOpeningHoursSpecification } from "@/lib/opening-hours";
import { breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo";
import { getSiteSettings, type SiteSettings } from "@/server/services/settings.service";

export const metadata: Metadata = {
  title: "Contact & showroom",
  description:
    "Visit the Artifex Furniture showroom in Uttara, Dhaka, call us, or message us on WhatsApp. Opening hours and directions.",
  alternates: { canonical: "/contact" },
};

const MAP_EMBED_PREFIX = "https://www.google.com/maps/embed";

/** "Get directions": the admin's link, else coordinates, else the address (F5). */
function directionsHref(s: SiteSettings): string {
  if (s.mapLinkUrl) return s.mapLinkUrl;
  const query =
    s.latitude !== null && s.longitude !== null
      ? `${s.latitude},${s.longitude}`
      : [s.addressLine, s.city, "Bangladesh"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const ROW = "flex items-start gap-3 py-3";
const ICON = "text-walnut mt-0.5 size-5 shrink-0";

async function ContactDetails() {
  const settings = await getSiteSettings();
  const { phone, telHref, whatsappHref } = getContactLinks(settings);
  const address = [settings.addressLine, settings.city].filter(Boolean).join(", ");
  const directions = directionsHref(settings);
  const messengerHref = toMessengerUrl(settings.facebookUrl);
  // Only Google Maps embed URLs are allowed in the iframe (09 §3); anything else is ignored.
  const embedUrl = settings.mapEmbedUrl?.startsWith(MAP_EMBED_PREFIX) ? settings.mapEmbedUrl : null;

  return (
    <>
      <JsonLd
        data={localBusinessJsonLd({
          name: settings.businessName,
          phone,
          email: settings.email,
          addressLine: settings.addressLine,
          city: settings.city,
          latitude: settings.latitude,
          longitude: settings.longitude,
          mapLinkUrl: settings.mapLinkUrl,
          sameAs: [settings.facebookUrl, settings.instagramUrl, settings.youtubeUrl].filter(
            (u): u is string => Boolean(u),
          ),
          openingHoursSpecification: toOpeningHoursSpecification(settings.openingHours),
        })}
      />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <address className="divide-line border-line divide-y border-y not-italic">
            {address && (
              <p className={ROW}>
                <MapPin aria-hidden strokeWidth={1.5} className={ICON} />
                <span>
                  <span className="text-small text-muted block">Showroom</span>
                  <span className="text-ink">{address}</span>
                </span>
              </p>
            )}
            {phone && telHref && (
              <a href={telHref} className={`${ROW} hover:text-ink`}>
                <Phone aria-hidden strokeWidth={1.5} className={ICON} />
                <span>
                  <span className="text-small text-muted block">Call</span>
                  <span className="text-ink tabular-nums">{phone}</span>
                </span>
              </a>
            )}
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={ROW}>
                <WhatsAppIcon className="text-whatsapp-dark mt-0.5 size-5 shrink-0" />
                <span>
                  <span className="text-small text-muted block">WhatsApp</span>
                  <span className="text-ink">Message us</span>
                </span>
              </a>
            )}
            {messengerHref && (
              <a href={messengerHref} target="_blank" rel="noopener noreferrer" className={ROW}>
                <FacebookIcon className={ICON} />
                <span>
                  <span className="text-small text-muted block">Facebook</span>
                  <span className="text-ink">Message us on Facebook</span>
                </span>
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`} className={ROW}>
                <Mail aria-hidden strokeWidth={1.5} className={ICON} />
                <span>
                  <span className="text-small text-muted block">Email</span>
                  <span className="text-ink">{settings.email}</span>
                </span>
              </a>
            )}
          </address>

          {settings.openingHours.length > 0 && (
            <section aria-labelledby="hours" className="mt-10">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="hours" className="text-h3">
                  Opening hours
                </h2>
                <OpeningStatus hours={settings.openingHours} />
              </div>
              <table className="w-full text-left">
                <tbody className="divide-line divide-y">
                  {settings.openingHours.map((entry) => (
                    <tr key={entry.days}>
                      <th scope="row" className="text-ink py-2 pr-4 font-normal">
                        {entry.days}
                      </th>
                      <td className="py-2 text-right tabular-nums">{formatHoursRange(entry)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={directions} external size="lg">
              <Navigation aria-hidden strokeWidth={1.5} className="size-4" />
              Get directions
            </ButtonLink>
            {whatsappHref && (
              <ButtonLink href={whatsappHref} external variant="whatsapp" size="lg">
                <WhatsAppIcon className="size-4" />
                WhatsApp
              </ButtonLink>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          {embedUrl ? (
            <MapLoader embedUrl={embedUrl} title={`Map: ${settings.businessName} showroom`} />
          ) : (
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sand text-ink hover:bg-line flex h-full min-h-80 flex-col items-center justify-center gap-3 px-6 text-center transition-colors"
            >
              <MapPin aria-hidden strokeWidth={1.5} className="text-walnut size-8" />
              <span className="font-medium">Open the showroom in Google Maps</span>
              {address && <span className="text-small text-muted">{address}</span>}
            </a>
          )}
        </div>
      </div>
    </>
  );
}

function ContactSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading contact details"
      className="grid gap-10 lg:grid-cols-12"
    >
      <div className="flex flex-col gap-4 lg:col-span-5">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <Skeleton className="min-h-80 lg:col-span-7" />
    </div>
  );
}

export default function ContactPage() {
  return (
    <Container className="py-8 md:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <h1 className="text-h1 mt-6">Visit our showroom</h1>
      <p className="text-body-lg mt-3 mb-10 max-w-2xl md:mb-14">
        See the pieces in person in Uttara, or message us on WhatsApp. We&apos;re happy to help you
        choose.
      </p>
      <Suspense fallback={<ContactSkeleton />}>
        <ContactDetails />
      </Suspense>
    </Container>
  );
}
