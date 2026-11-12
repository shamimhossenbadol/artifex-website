import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { requireAdmin } from "@/server/services/auth.service";

export const metadata: Metadata = { title: "Categories" };

// Placeholder until milestone 7c replaces this catch-all with the real pages.
export default async function CategoriesPlaceholder() {
  await requireAdmin();
  return <ComingSoon title="Categories" milestone="Phase 7, milestone 7c" />;
}
