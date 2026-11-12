"use server";
// Settings tabs (07 §3.6): requireAdmin → Zod → service → revalidate "settings" (07 §5).
import { updateTag } from "next/cache";
import { invalid, type ActionResult } from "@/lib/action-result";
import { settingsFormSchema } from "@/lib/validation/settings";
import { requireAdmin } from "@/server/services/auth.service";
import { pickFile } from "@/server/services/media.service";
import { saveSettings } from "@/server/services/settings-admin.service";

export async function saveSettingsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const ogImage = pickFile(formData.get("ogImage"));
  formData.delete("ogImage");
  const parsed = settingsFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const result = await saveSettings(parsed.data, parsed.data.section === "seo" ? ogImage : null);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      fieldErrors: result.field ? { [result.field]: [result.error] } : undefined,
    };
  }
  // Header, footer, contact/about pages, WhatsApp links and metadata all read settings.
  updateTag("settings");
  return { ok: true, message: "Settings saved. The website is updated." };
}
