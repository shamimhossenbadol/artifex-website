// Quick-add specification labels per category (07 §3.2). Keyed by category slug; anything else
// gets the general list. Labels only: the admin fills in the values.
const GENERAL = ["Material", "Dimensions", "Finish", "Warranty"];

const PRESETS: Record<string, string[]> = {
  sofas: ["Frame", "Upholstery", "Seating capacity", "Cushion", "Warranty"],
  "dining-tables": ["Top", "Base", "Seating capacity", "Finish", "Warranty"],
  chairs: ["Frame", "Seat", "Upholstery", "Finish", "Warranty"],
  beds: ["Frame", "Headboard", "Mattress size", "Storage", "Warranty"],
  curtains: ["Fabric", "Lining", "Width", "Drop", "Heading style"],
  chandeliers: ["Frame", "Shade", "Bulbs", "Diameter", "Height", "Warranty"],
};

export function specPresetsFor(categorySlug: string | null | undefined): string[] {
  return (categorySlug && PRESETS[categorySlug]) || GENERAL;
}
