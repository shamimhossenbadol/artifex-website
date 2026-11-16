"use client";
// WhatsApp/Messenger inquiry + mobile sticky bar (F3, 05 §3). Without JavaScript the links still
// work. Products have no colour choice (ADR-054).
// Messenger sits beside WhatsApp everywhere: the sales team answers on both (ADR-044).
import { Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MessengerIcon } from "@/components/site/SocialIcons";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

type ProductInquiryProps = {
  whatsappNumber: string | null;
  template: string;
  business: string;
  productTitle: string;
  productUrl: string;
  priceLabel: string;
  phone: string | null;
  telHref: string | null;
  messengerHref: string | null;
  /** No fixed price (ADR-063): the buttons ask for a quote and sit right under the quote card. */
  quote?: boolean;
};

export function ProductInquiry({
  whatsappNumber,
  template,
  business,
  productTitle,
  productUrl,
  priceLabel,
  phone,
  telHref,
  messengerHref,
  quote = false,
}: ProductInquiryProps) {
  const verb = quote ? "Get a quote on" : "Message on";
  const [showBar, setShowBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Show the sticky bar once the main CTA has scrolled above the viewport. A passive scroll check
  // (once per frame) instead of IntersectionObserver: a fast fling can jump past the CTA without it
  // ever intersecting, and then an observer never fires.
  useEffect(() => {
    const cta = ctaRef.current;
    if (!cta) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setShowBar(cta.getBoundingClientRect().bottom < 0));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const whatsappHref = whatsappNumber
    ? buildWhatsAppUrl({
        number: whatsappNumber,
        message: buildProductMessage({
          template,
          business,
          product: productTitle,
          url: productUrl,
          price: priceLabel,
        }),
      })
    : null;

  return (
    <>
      <div ref={ctaRef} className={cn("flex flex-col gap-3", quote ? "mt-5" : "mt-8")}>
        {whatsappHref && (
          <ButtonLink href={whatsappHref} external variant="whatsapp" size="lg" fullWidth>
            <WhatsAppIcon className="size-5" />
            {`${verb} WhatsApp`}
          </ButtonLink>
        )}
        {messengerHref && (
          <ButtonLink href={messengerHref} external variant="messenger" size="lg" fullWidth>
            <MessengerIcon className="size-5" />
            {`${verb} Messenger`}
          </ButtonLink>
        )}
        {telHref && (
          <a
            href={telHref}
            className="text-ink-soft hover:text-ink inline-flex min-h-11 items-center justify-center gap-2 text-sm"
          >
            <Phone aria-hidden strokeWidth={1.5} className="size-4" />
            Or call us{phone ? ` at ${phone}` : ""}
          </a>
        )}
      </div>

      {/* Mobile sticky bar: price, Messenger and WhatsApp. It replaces the floating buttons here. */}
      {(whatsappHref || messengerHref) && (
        <div
          data-hide-whatsapp-fab
          aria-hidden={!showBar}
          className={cn(
            "border-line bg-bg fixed inset-x-0 bottom-0 z-30 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-200 ease-out lg:hidden",
            showBar ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="flex items-center gap-2">
            <p className="text-price text-ink min-w-0 flex-1 truncate">{priceLabel}</p>
            {messengerHref && (
              <a
                href={messengerHref}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={showBar ? undefined : -1}
                className="bg-messenger hover:bg-ink inline-flex size-11 shrink-0 items-center justify-center rounded-md text-white transition-colors"
              >
                <MessengerIcon className="size-5" />
                <span className="sr-only">{`${verb} Messenger`}</span>
              </a>
            )}
            {whatsappHref && (
              <ButtonLink
                href={whatsappHref}
                external
                variant="whatsapp"
                tabIndex={showBar ? undefined : -1}
                className="shrink-0"
              >
                <WhatsAppIcon className="size-4" />
                WhatsApp
              </ButtonLink>
            )}
          </div>
        </div>
      )}
    </>
  );
}
