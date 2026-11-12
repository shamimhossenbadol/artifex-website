"use client";
// Colour swatches + WhatsApp inquiry + mobile sticky bar (F1.4, F3, 05 §3). The selected colour goes
// into the WhatsApp message. Without JavaScript the WhatsApp link still works (no colour).
import { Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export type InquiryColor = { id: number; name: string; hex: string };

type ProductInquiryProps = {
  colors: InquiryColor[];
  whatsappNumber: string | null;
  template: string;
  business: string;
  productTitle: string;
  productUrl: string;
  priceLabel: string;
  phone: string | null;
  telHref: string | null;
};

export function ProductInquiry({
  colors,
  whatsappNumber,
  template,
  business,
  productTitle,
  productUrl,
  priceLabel,
  phone,
  telHref,
}: ProductInquiryProps) {
  const [selected, setSelected] = useState<InquiryColor | null>(null);
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
          color: selected?.name ?? null,
          price: priceLabel,
        }),
      })
    : null;

  return (
    <>
      {colors.length > 0 && (
        <fieldset className="mt-6">
          <legend className="text-small text-ink-soft mb-3">
            Colour: <span className="text-ink font-medium">{selected?.name ?? "Choose one"}</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const isSelected = selected?.id === color.id;
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : color)}
                  aria-pressed={isSelected}
                  aria-label={color.name}
                  title={color.name}
                  className="inline-flex size-11 items-center justify-center rounded-full"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "border-line block size-7 rounded-full border",
                      isSelected && "ring-ink ring-offset-bg ring-2 ring-offset-2",
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div ref={ctaRef} className="mt-8 flex flex-col gap-3">
        {whatsappHref && (
          <ButtonLink href={whatsappHref} external variant="whatsapp" size="lg" fullWidth>
            <WhatsAppIcon className="size-5" />
            Message on WhatsApp
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

      {/* Mobile sticky bar. Its presence also hides the floating WhatsApp button on mobile. */}
      {whatsappHref && (
        <div
          data-hide-whatsapp-fab
          aria-hidden={!showBar}
          className={cn(
            "border-line bg-bg fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 transition-transform duration-200 ease-out lg:hidden",
            showBar ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-price text-ink min-w-0 truncate">{priceLabel}</p>
            <ButtonLink
              href={whatsappHref}
              external
              variant="whatsapp"
              tabIndex={showBar ? undefined : -1}
            >
              <WhatsAppIcon className="size-4" />
              WhatsApp
            </ButtonLink>
          </div>
        </div>
      )}
    </>
  );
}
