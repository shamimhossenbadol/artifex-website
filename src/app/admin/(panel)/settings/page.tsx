import type { Metadata } from "next";
import { AdminField, AdminForm, FormSection } from "@/components/admin/AdminForm";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { saveSettingsAction } from "@/server/actions/settings.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getSettingsForEdit } from "@/server/services/settings-admin.service";

export const metadata: Metadata = { title: "Settings · Business" };

/** Settings → Business (07 §3.6): name, tagline, short intro, About page content. */
export default async function BusinessSettingsPage() {
  await requireAdmin();
  const s = await getSettingsForEdit();
  return (
    <SettingsFrame>
      <AdminForm action={saveSettingsAction}>
        <input type="hidden" name="section" value="business" />
        <FormSection title="Business">
          <AdminField name="businessName" label="Business name">
            <Input name="businessName" defaultValue={s.businessName} required maxLength={100} />
          </AdminField>
          <AdminField
            name="tagline"
            label="Tagline"
            hint="A short line under the name, used in the footer and search results."
          >
            <Input name="tagline" defaultValue={s.tagline ?? ""} maxLength={160} />
          </AdminField>
        </FormSection>
        <FormSection title="About">
          <AdminField
            name="aboutShort"
            label="Short introduction"
            hint="Two or three sentences for the homepage and footer."
          >
            <Textarea
              name="aboutShort"
              defaultValue={s.aboutShort ?? ""}
              rows={4}
              maxLength={600}
            />
          </AdminField>
          <AdminField
            name="aboutContent"
            label="About page"
            hint="Markdown: ## for headings, **bold**, - for lists, blank line between paragraphs."
          >
            <Textarea
              name="aboutContent"
              defaultValue={s.aboutContent ?? ""}
              rows={14}
              maxLength={20000}
              className="font-mono text-sm"
            />
          </AdminField>
        </FormSection>
      </AdminForm>
    </SettingsFrame>
  );
}
