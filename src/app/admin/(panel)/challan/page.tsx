import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ChallanMaker } from "@/components/admin/challan/ChallanMaker";
import { requireAdmin } from "@/server/services/auth.service";
import { getChallanSetup } from "@/server/services/challan.service";

export const metadata: Metadata = { title: "Delivery challan" };

/** Delivery challan maker (07 §3.8, ADR-046): fill, preview, print. Nothing is stored. */
export default async function ChallanPage() {
  await requireAdmin();
  const { business, products, issuedAt } = await getChallanSetup();
  return (
    <>
      <AdminPageHeader
        title="Delivery challan"
        description="Fill in the customer and items, check the preview, then print. Nothing is saved: the form clears after printing."
      />
      <ChallanMaker business={business} products={products} issuedAt={issuedAt} />
    </>
  );
}
