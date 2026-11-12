import type { Metadata } from "next";
import { AdminField, AdminForm, FormSection } from "@/components/admin/AdminForm";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";
import { Input } from "@/components/ui/Input";
import { saveSettingsAction } from "@/server/actions/settings.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getSettingsForEdit } from "@/server/services/settings-admin.service";

export const metadata: Metadata = { title: "Settings · Social" };

/** Settings → Social (07 §3.6). Blank links are hidden on the site. */
export default async function SocialSettingsPage() {
  await requireAdmin();
  const s = await getSettingsForEdit();
  return (
    <SettingsFrame>
      <AdminForm action={saveSettingsAction}>
        <input type="hidden" name="section" value="social" />
        <FormSection title="Social pages" description="Leave a field empty to hide that icon.">
          <AdminField name="facebookUrl" label="Facebook">
            <Input
              name="facebookUrl"
              type="url"
              defaultValue={s.facebookUrl ?? ""}
              maxLength={255}
            />
          </AdminField>
          <AdminField name="instagramUrl" label="Instagram">
            <Input
              name="instagramUrl"
              type="url"
              defaultValue={s.instagramUrl ?? ""}
              maxLength={255}
            />
          </AdminField>
          <AdminField name="youtubeUrl" label="YouTube">
            <Input name="youtubeUrl" type="url" defaultValue={s.youtubeUrl ?? ""} maxLength={255} />
          </AdminField>
        </FormSection>
      </AdminForm>
    </SettingsFrame>
  );
}
