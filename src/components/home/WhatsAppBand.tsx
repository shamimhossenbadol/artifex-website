import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";

/** WhatsApp CTA band (05 §3): sand background, the general message, plus the phone number. */
export function WhatsAppBand({
  whatsappHref,
  phone,
  telHref,
}: {
  whatsappHref: string | null;
  phone: string | null;
  telHref: string | null;
}) {
  if (!whatsappHref && !telHref) return null;
  return (
    <section aria-labelledby="help-heading" className="reveal bg-sand py-16 md:py-20">
      <Container className="flex flex-col items-center gap-6 text-center">
        <h2 id="help-heading" className="text-h2 max-w-4xl text-balance">
          Not sure what fits your space? Talk to us.
        </h2>
        <p className="text-body-lg max-w-xl">
          Send a photo of your room and we&apos;ll help with sizes, fabrics and finishes.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {whatsappHref && (
            <ButtonLink href={whatsappHref} external variant="whatsapp" size="lg">
              <WhatsAppIcon className="size-5" />
              Message on WhatsApp
            </ButtonLink>
          )}
          {phone && telHref && (
            <ButtonLink href={telHref} variant="secondary" size="lg">
              <Phone aria-hidden strokeWidth={1.5} className="size-4" />
              {phone}
            </ButtonLink>
          )}
        </div>
      </Container>
    </section>
  );
}
