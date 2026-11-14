// Line icons for categories without a photo (ADR-029), shared by the homepage tiles and the mobile
// menu. Lucide has no dining-table icon (its "table" icons are spreadsheets), so a matching one is
// drawn here in the same 24 px, round-cap line style.
import { Armchair, BedDouble, Blinds, LampCeiling, Sofa } from "lucide-react";
import type { SVGProps } from "react";

type IconProps = Pick<SVGProps<SVGSVGElement>, "className" | "aria-hidden"> & {
  strokeWidth?: number;
};

/** A dining table with a chair on each side. */
export function DiningTableIcon({ className, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Tabletop and legs */}
      <path d="M6 10h12" />
      <path d="M8.5 10v9" />
      <path d="M15.5 10v9" />
      {/* Left chair: back, seat, front leg */}
      <path d="M2.5 7v12" />
      <path d="M2.5 14.5h3" />
      <path d="M5.5 14.5V19" />
      {/* Right chair */}
      <path d="M21.5 7v12" />
      <path d="M18.5 14.5h3" />
      <path d="M18.5 14.5V19" />
    </svg>
  );
}

/** The line icon for a category slug, with the sofa as the fallback. */
export function CategoryIcon({ slug, ...props }: IconProps & { slug: string }) {
  switch (slug) {
    case "dining-tables":
      return <DiningTableIcon {...props} />;
    case "chairs":
      return <Armchair {...props} />;
    case "beds":
      return <BedDouble {...props} />;
    case "curtains":
      return <Blinds {...props} />;
    case "chandeliers":
      return <LampCeiling {...props} />;
    default:
      return <Sofa {...props} />;
  }
}
