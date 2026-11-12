import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { requireAdmin } from "@/server/services/auth.service";

export const metadata: Metadata = { title: "Homepage" };

// Placeholder until milestone 7b replaces this catch-all with the real pages.
export default async function HomepagePlaceholder() {
  await requireAdmin();
  return <ComingSoon title="Homepage" milestone="Phase 7, milestone 7b" />;
}
