import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InvoiceMaker } from "@/components/admin/invoice/InvoiceMaker";
import { requireAdmin } from "@/server/services/auth.service";
import { getChallanSetup } from "@/server/services/challan.service";

export const metadata: Metadata = { title: "Invoice" };

/**
 * Invoice maker (07 §3.9, ADR-067): fill, preview, print. Nothing is stored. It reuses the
 * challan's setup (letterhead details and the product names for the item picker).
 */
export default async function InvoicePage() {
  await requireAdmin();
  const { business, products, issuedAt } = await getChallanSetup();
  return (
    <>
      <AdminPageHeader
        title="Invoice"
        description="Fill in the customer, items and payment, check the preview, then print. Nothing is saved: the form clears after printing."
      />
      <InvoiceMaker business={business} products={products} issuedAt={issuedAt} />
    </>
  );
}
