import { Phone } from "lucide-react";
import { MessengerIcon } from "@/components/site/SocialIcons";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";

/**
 * Help band (05 §3): sand background with WhatsApp, Messenger (the sales team's two channels,
 * ADR-044) and the phone number. Buttons stack full width on phones.
 */
export function WhatsAppBand({
  whatsappHref,
  messengerHref,
  phone,
  telHref,
}: {
  whatsappHref: string | null;
  messengerHref: string | null;
  phone: string | null;
  telHref: string | null;
}) {
  if (!whatsappHref && !messengerHref && !telHref) return null;
  return (
    <section aria-labelledby="help-heading" className="reveal bg-sand py-12 md:py-20">
      <Container className="flex flex-col items-center gap-5 text-center md:gap-6">
        <h2 id="help-heading" className="text-h2 max-w-4xl text-balance">
          Not sure what fits your space? Talk to us.
        </h2>
        <p className="text-body-lg max-w-xl">
          Send a photo of your room and we&apos;ll help with sizes, fabrics and finishes.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
          {whatsappHref && (
            <ButtonLink
              href={whatsappHref}
              external
              variant="whatsapp"
              size="lg"
              className="w-full sm:w-auto"
            >
              <WhatsAppIcon className="size-5" />
              WhatsApp
            </ButtonLink>
          )}
          {messengerHref && (
            <ButtonLink
              href={messengerHref}
              external
              variant="messenger"
              size="lg"
              className="w-full sm:w-auto"
            >
              <MessengerIcon className="size-5" />
              Messenger
            </ButtonLink>
          )}
          {phone && telHref && (
            <ButtonLink href={telHref} variant="secondary" size="lg" className="w-full sm:w-auto">
              <Phone aria-hidden strokeWidth={1.5} className="size-4" />
              {phone}
            </ButtonLink>
          )}
        </div>
      </Container>
    </section>
  );
}
