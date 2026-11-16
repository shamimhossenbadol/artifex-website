// Specification labels per category (07 §3.2), keyed by category slug. Labels only: the admin
// fills in the values.
// - Quick add: one-click buttons above the rows; anything without its own list gets GENERAL.
// - Defaults (ADR-059): rows filled in automatically for a new product in that category (or when
//   switching to it while the rows are still empty). They're ordinary rows: remove any you don't
//   need, but every row that stays needs a value before the product can be saved.
const GENERAL = ["Material", "Dimensions", "Finish", "Warranty", "SKU"];

const DINING_TABLE_SPECS = [
  "Product Name",
  "Product Type",
  "Material",
  "Tabletop",
  "Seating Capacity",
  "Number of Chairs",
  "Chair Upholstery",
  "Surface Finish",
  "Color & Design",
  "Style",
  "Room Type",
  "Usage",
];

const PRESETS: Record<string, string[]> = {
  sofas: [
    "Material",
    "Dimensions",
    "Frame",
    "Upholstery",
    "Seating capacity",
    "Cushion",
    "Warranty",
  ],
  "dining-tables": [...DINING_TABLE_SPECS, "Dimensions", "Warranty", "SKU"],
  chairs: ["Material", "Dimensions", "Frame", "Seat", "Upholstery", "Finish", "Warranty"],
  beds: ["Material", "Dimensions", "Frame", "Headboard", "Mattress size", "Storage", "Warranty"],
  curtains: ["Fabric", "Lining", "Width", "Drop", "Heading style"],
  chandeliers: ["Material", "Dimensions", "Frame", "Shade", "Bulbs", "Warranty"],
};

const DEFAULTS: Record<string, string[]> = {
  "dining-tables": DINING_TABLE_SPECS,
};

export function specPresetsFor(categorySlug: string | null | undefined): string[] {
  return (categorySlug && PRESETS[categorySlug]) || GENERAL;
}

/** Rows a new product in this category starts with (empty values). */
export function defaultSpecsFor(categorySlug: string | null | undefined): string[] {
  return (categorySlug && DEFAULTS[categorySlug]) || [];
}
