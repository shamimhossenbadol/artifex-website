import type { Metadata } from "next";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { requireAdmin } from "@/server/services/auth.service";

export const metadata: Metadata = { title: "Settings" };

// Placeholder until milestone 7b replaces this catch-all with the real pages.
export default async function SettingsPlaceholder() {
  await requireAdmin();
  return <ComingSoon title="Settings" milestone="Phase 7, milestone 7b" />;
}
