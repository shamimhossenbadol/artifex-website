import { WHATSAPP_FAB_LABEL } from "@/config/site";
import { getSiteSettings } from "@/server/services/settings.service";
import { getContactLinks } from "./contact-links";
import { WhatsAppIcon } from "./WhatsAppIcon";

/**
 * Floating WhatsApp button (05 §2). Hidden on mobile when the page contains an element with
 * `data-hide-whatsapp-fab` (the product page's own sticky bar), with CSS only, no client JS.
 */
export async function WhatsAppFab() {
  const { whatsappHref } = getContactLinks(await getSiteSettings());
  if (!whatsappHref) return null;

  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={WHATSAPP_FAB_LABEL}
      className="bg-whatsapp-dark hover:bg-ink fixed right-4 bottom-4 z-30 inline-flex size-14 items-center justify-center rounded-full text-white transition-colors duration-200 md:right-6 md:bottom-6 max-md:[body:has([data-hide-whatsapp-fab])_&]:hidden"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
