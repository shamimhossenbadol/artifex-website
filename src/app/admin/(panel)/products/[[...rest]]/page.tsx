import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { requireAdmin } from "@/server/services/auth.service";

export const metadata: Metadata = { title: "Products" };

// Placeholder until milestone 7d replaces this catch-all with the real pages.
export default async function ProductsPlaceholder() {
  await requireAdmin();
  return <ComingSoon title="Products" milestone="Phase 7, milestone 7d" />;
}
