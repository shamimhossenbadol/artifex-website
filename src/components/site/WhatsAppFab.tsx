import { MESSENGER_FAB_LABEL, WHATSAPP_FAB_LABEL } from "@/config/site";
import { toMessengerUrl } from "@/lib/messenger";
import { getSiteSettings } from "@/server/services/settings.service";
import { getContactLinks } from "./contact-links";
import { MessengerIcon } from "./SocialIcons";
import { WhatsAppIcon } from "./WhatsAppIcon";

const FAB =
  "inline-flex items-center justify-center rounded-full text-white transition-colors duration-200 hover:bg-ink";

/**
 * Floating contact buttons (05 §2, ADR-035): Messenger above WhatsApp. Hidden on mobile when the
 * page contains an element with `data-hide-whatsapp-fab` (the product page's own sticky bar), with
 * CSS only, no client JS.
 */
export async function WhatsAppFab() {
  const settings = await getSiteSettings();
  const { whatsappHref } = getContactLinks(settings);
  const messengerHref = toMessengerUrl(settings.facebookUrl);
  if (!whatsappHref && !messengerHref) return null;

  return (
    <div className="fixed right-4 bottom-4 z-30 flex flex-col items-center gap-3 md:right-6 md:bottom-6 max-md:[body:has([data-hide-whatsapp-fab])_&]:hidden">
      {messengerHref && (
        <a
          href={messengerHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={MESSENGER_FAB_LABEL}
          className={`${FAB} bg-messenger size-12`}
        >
          <MessengerIcon className="size-6" />
        </a>
      )}
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={WHATSAPP_FAB_LABEL}
          className={`${FAB} bg-whatsapp-dark size-14`}
        >
          <WhatsAppIcon className="size-7" />
        </a>
      )}
    </div>
  );
}
