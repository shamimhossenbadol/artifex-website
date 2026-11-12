import Link from "next/link";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { getContactLinks } from "@/components/site/contact-links";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getNavCategories } from "@/server/services/catalog.service";
import { getSiteSettings } from "@/server/services/settings.service";

/** Empty listing (05 §4): a friendly message, other categories and a WhatsApp prompt. */
export async function EmptyListing({
  message,
  excludeSlug,
}: {
  message: string;
  excludeSlug?: string;
}) {
  const [categories, settings] = await Promise.all([getNavCategories(), getSiteSettings()]);
  const { whatsappHref } = getContactLinks(settings);
  const others = categories.filter((c) => c.slug !== excludeSlug);

  return (
    <div className="border-line bg-surface flex flex-col items-center gap-6 border px-6 py-14 text-center">
      <p className="text-h3">{message}</p>
      <p className="max-w-md">
        New pieces arrive often, and much of our work is made to order. Ask us on WhatsApp, or
        browse another category.
      </p>
      {whatsappHref && (
        <ButtonLink href={whatsappHref} external variant="whatsapp">
          <WhatsAppIcon className="size-4" />
          Ask us on WhatsApp
        </ButtonLink>
      )}
      {others.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2">
          {others.map((c) => (
            <li key={c.slug}>
              <Link
                href={c.href}
                className="border-line text-ink hover:border-ink inline-flex min-h-11 items-center rounded-md border px-4 text-sm transition-colors"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
