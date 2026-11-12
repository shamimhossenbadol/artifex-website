import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { requireAdmin } from "@/server/services/auth.service";

export const metadata: Metadata = { title: "Journal" };

// Placeholder until milestone 7e replaces this catch-all with the real pages.
export default async function JournalPlaceholder() {
  await requireAdmin();
  return <ComingSoon title="Journal" milestone="Phase 7, milestone 7e" />;
}
