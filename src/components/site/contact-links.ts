// Derives the contact links shared by the header, mobile menu, footer and WhatsApp button.
import { toTelHref } from "@/lib/phone";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { SiteSettings } from "@/server/services/settings.service";

export type ContactLinks = {
  phone: string | null;
  telHref: string | null;
  whatsappHref: string | null;
};

export function getContactLinks(settings: SiteSettings): ContactLinks {
  const phone = settings.phone.trim() || null;
  const hasWhatsApp = settings.whatsappNumber.replace(/\D/g, "").length >= 8;
  return {
    phone,
    telHref: phone ? toTelHref(phone) : null,
    whatsappHref: hasWhatsApp
      ? buildWhatsAppUrl({
          number: settings.whatsappNumber,
          message: settings.whatsappDefaultMessage,
        })
      : null,
  };
}
