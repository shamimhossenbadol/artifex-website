// Links inside the mobile menu drawer (05 §2): categories, company pages and contact. The data
// streams into the already-rendered drawer (ADR-043); MobileMenuLinks without data is the fallback.
import { Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { COMPANY_LINKS, HEADER_HIDDEN_CATEGORIES } from "@/config/site";
import { getNavCategories } from "@/server/services/catalog.service";
import { getSiteSettings } from "@/server/services/settings.service";
import { getContactLinks } from "./contact-links";
import { FacebookIcon } from "./SocialIcons";
import { WhatsAppIcon } from "./WhatsAppIcon";

const ROW = "flex min-h-11 items-center gap-3 py-2 text-ink";

type MobileMenuLinksProps = {
  categories: { name: string; href: string; imagePath: string | null }[];
  phone: string | null;
  telHref: string | null;
  whatsappHref: string | null;
  facebookUrl: string | null;
};

export function MobileMenuLinks({
  categories,
  phone,
  telHref,
  whatsappHref,
  facebookUrl,
}: MobileMenuLinksProps) {
  return (
    <>
      {categories.length > 0 && (
        <nav aria-label="Categories" className="border-line border-b pb-4">
          <ul>
            {categories.map((category) => (
              <li key={category.href}>
                <Link href={category.href} className={ROW}>
                  <span className="bg-sand relative size-12 shrink-0 overflow-hidden">
                    {category.imagePath && (
                      <Image
                        src={category.imagePath}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="text-base font-medium">{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <nav aria-label="Company" className="border-line border-b py-4">
        <ul>
          {COMPANY_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={ROW}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="flex flex-col gap-1 pt-4">
        {phone && telHref && (
          <li>
            <a href={telHref} className={ROW}>
              <Phone aria-hidden strokeWidth={1.5} className="text-walnut size-5" />
              {phone}
            </a>
          </li>
        )}
        {whatsappHref && (
          <li>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={ROW}>
              <WhatsAppIcon className="text-whatsapp-dark size-5" />
              WhatsApp us
            </a>
          </li>
        )}
        {facebookUrl && (
          <li>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className={ROW}>
              <FacebookIcon className="text-walnut size-5" />
              Facebook
            </a>
          </li>
        )}
      </ul>
    </>
  );
}

/** Data-backed menu links. Render inside <Suspense fallback={<MobileMenuLinksFallback />}>. */
export async function MobileMenuContent() {
  const [settings, categories] = await Promise.all([getSiteSettings(), getNavCategories()]);
  const { phone, telHref, whatsappHref } = getContactLinks(settings);
  return (
    <MobileMenuLinks
      categories={categories.filter((c) => !HEADER_HIDDEN_CATEGORIES.includes(c.slug))}
      phone={phone}
      telHref={telHref}
      whatsappHref={whatsappHref}
      facebookUrl={settings.facebookUrl}
    />
  );
}

/** Company links only, until the data arrives. */
export function MobileMenuLinksFallback() {
  return (
    <MobileMenuLinks
      categories={[]}
      phone={null}
      telHref={null}
      whatsappHref={null}
      facebookUrl={null}
    />
  );
}
