// Delivery challan (07 §3.8, ADR-046): only reads what the printable sheet needs. Challans
// themselves are never sent to the server or stored.
import { connection } from "next/server";
import { CHALLAN_LETTERHEAD } from "@/config/site";
import type { ChallanBusiness } from "@/lib/challan";
import { findProductNamesForChallan } from "@/server/repositories/product-admin.repo";
import { getSiteSettings } from "./settings.service";

export type ChallanProductOption = { id: number; label: string };

export async function getChallanSetup(): Promise<{
  business: ChallanBusiness;
  products: ChallanProductOption[];
  issuedAt: string;
}> {
  await connection();
  const [settings, products] = await Promise.all([getSiteSettings(), findProductNamesForChallan()]);
  return {
    business: {
      name: settings.businessName,
      address: [settings.addressLine, settings.city].filter(Boolean).join(", "),
      phones: CHALLAN_LETTERHEAD.phones,
      email: CHALLAN_LETTERHEAD.email,
      website: CHALLAN_LETTERHEAD.website,
    },
    products: products.map((p) => ({ id: p.id, label: p.title })),
    // The request time, so the server and the browser start with the same date.
    issuedAt: new Date().toISOString(),
  };
}
