import type { Metadata } from "next";
import { AdminField, AdminForm, FormSection } from "@/components/admin/AdminForm";
import { ImageField } from "@/components/admin/ImageField";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { saveSettingsAction } from "@/server/actions/settings.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getSettingsForEdit } from "@/server/services/settings-admin.service";

export const metadata: Metadata = { title: "Settings · SEO" };

/** Settings → SEO (07 §3.6): homepage title/description and the default share image. */
export default async function SeoSettingsPage() {
  await requireAdmin();
  const s = await getSettingsForEdit();
  return (
    <SettingsFrame>
      <AdminForm action={saveSettingsAction}>
        <input type="hidden" name="section" value="seo" />
        <FormSection
          title="Search results"
          description="The homepage title and description shown by Google and when the link is shared."
        >
          <AdminField name="defaultSeoTitle" label="Title" hint="Up to 70 characters.">
            <Input
              name="defaultSeoTitle"
              defaultValue={s.defaultSeoTitle}
              required
              maxLength={70}
            />
          </AdminField>
          <AdminField name="defaultSeoDescription" label="Description" hint="Up to 170 characters.">
            <Textarea
              name="defaultSeoDescription"
              defaultValue={s.defaultSeoDescription}
              rows={3}
              required
              maxLength={170}
            />
          </AdminField>
        </FormSection>
        <FormSection
          title="Share image"
          description="Shown when the homepage is shared on Facebook or WhatsApp. Without one, the logo is used."
        >
          <ImageField
            key={s.ogImagePath ?? "none"}
            name="ogImage"
            label="Image (best at 1200 × 630)"
            currentPath={s.ogImagePath}
            currentAlt="Current share image"
            aspect="aspect-[1200/630]"
          />
          {s.ogImagePath && (
            <label className="text-small flex min-h-11 items-center gap-2">
              <input type="checkbox" name="removeOgImage" className="accent-ink size-4" />
              Remove the share image (use the logo)
            </label>
          )}
        </FormSection>
      </AdminForm>
    </SettingsFrame>
  );
}
