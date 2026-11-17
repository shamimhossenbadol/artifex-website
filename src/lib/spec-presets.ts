// Default specification rows per category (07 §3.2, ADR-059), keyed by category slug. Labels only:
// the admin fills in the values. A new product in that category starts with these rows (or gets
// them when switching to it while the rows are still empty). They're ordinary rows: remove any you
// don't need, but every row that stays needs a value before the product can be saved. There are no
// Quick add buttons (ADR-062): other rows are added with "Add specification".
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

const SOFA_SPECS = [
  "Product Type",
  "Frame Material",
  "Upholstery",
  "Foam",
  "Legs",
  "Seating Configuration",
  "Seater Dimensions",
  "1 Seater Dimensions",
  "Sofa Width",
  "Pillow Filling",
  "Pillow Quantity",
];

const DEFAULTS: Record<string, string[]> = {
  sofas: SOFA_SPECS, // ADR-075
  "dining-tables": DINING_TABLE_SPECS, // ADR-059
};

/** Rows a new product in this category starts with (empty values). */
export function defaultSpecsFor(categorySlug: string | null | undefined): string[] {
  return (categorySlug && DEFAULTS[categorySlug]) || [];
}
