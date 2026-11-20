// Shared pieces of the printable A4 sheets (delivery challan ADR-046, invoice ADR-067), so both
// always carry the same letterhead: logo left, address/phones/email right, a brand-red rule, a
// faint logo watermark, and the website on a red band across the foot of the page.
import Image from "next/image";
import fullLogo from "@/assets/brand/artifex-logo.svg";
import type { ChallanBusiness } from "@/lib/challan";
import { cn } from "@/lib/utils";

/** Business details printed in the letterhead (same data for every sheet). */
export type LetterheadBusiness = ChallanBusiness;

/**
 * Classes for the A4 sheet itself: exactly one page (210 × 297 mm) for the preview and the print
 * copy. `challan-sheet` is the hook for the print CSS in globals.css (shared by all sheets).
 */
export const A4_SHEET_CLASS =
  "challan-sheet bg-surface text-ink relative isolate flex h-[297mm] w-[210mm] flex-col overflow-hidden px-[16mm] pt-[14mm] pb-[12mm]";

/** Small uppercase label used on the sheets ("Delivered to", "Date"…). */
export const SHEET_LABEL = "text-eyebrow text-muted";

/** True when a sheet's content runs past the bottom of the A4 page (forms measure the preview). */
export function sheetOverflows(sheet: HTMLElement | null): boolean {
  return sheet !== null && sheet.scrollHeight > sheet.clientHeight + 1;
}

/** Faint logo behind the content, as on the printed letterhead. */
export function SheetWatermark() {
  return (
    <Image
      src={fullLogo}
      alt=""
      aria-hidden
      loading="eager"
      className="pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[150mm] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
    />
  );
}

/** Logo and contact details, then the brand-red rule. */
export function SheetLetterhead({ business }: { business: LetterheadBusiness }) {
  return (
    <>
      <header className="flex items-start justify-between gap-8">
        <Image src={fullLogo} alt={business.name} loading="eager" className="h-[24mm] w-auto" />
        <div className="text-body text-ink-soft max-w-[110mm] pt-1 text-right leading-relaxed">
          {business.address && <p>{business.address}</p>}
          {business.phones.length > 0 && <p>Cell: {business.phones.join(", ")}</p>}
          <p>Email: {business.email}</p>
        </div>
      </header>
      <div aria-hidden className="border-brand mt-4 border-t-2" />
    </>
  );
}

/** Website on a brand-red band across the foot of the page, optionally after a label. */
export function SheetFooterBand({
  website,
  label,
  className,
}: {
  website: string;
  /** e.g. "Visit our website:" (invoice, ADR-081); the challan prints the address alone. */
  label?: string;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "bg-brand text-small -mx-[16mm] mt-8 -mb-[12mm] py-3 text-center font-medium tracking-[0.08em] text-white",
        className,
      )}
    >
      <span>
        {label && <span className="mr-2 tracking-normal">{label}</span>}
        {website}
      </span>
    </footer>
  );
}
