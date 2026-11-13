import type { Metadata } from "next";
import { AdminField, AdminForm, FormSection } from "@/components/admin/AdminForm";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";
import { Input } from "@/components/ui/Input";
import { saveSettingsAction } from "@/server/actions/settings.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getSettingsForEdit } from "@/server/services/settings-admin.service";

export const metadata: Metadata = { title: "Settings · Tracking" };

/** Settings → Tracking (ADR-040): the Meta (Facebook) Pixel ID for ads. */
export default async function TrackingSettingsPage() {
  await requireAdmin();
  const s = await getSettingsForEdit();
  return (
    <SettingsFrame>
      <AdminForm action={saveSettingsAction}>
        <input type="hidden" name="section" value="tracking" />
        <FormSection
          title="Facebook Pixel"
          description="Lets Facebook Ads measure visits and inquiries from your ads and build audiences. Leave empty to turn it off."
        >
          <AdminField
            name="facebookPixelId"
            label="Pixel ID"
            hint="Only the number, e.g. 123456789012345. Find it in Meta Events Manager → Data sources → your pixel. Don't paste the whole code: the website adds it for you."
          >
            <Input
              name="facebookPixelId"
              defaultValue={s.facebookPixelId ?? ""}
              inputMode="numeric"
              autoComplete="off"
              maxLength={25}
              placeholder="123456789012345"
            />
          </AdminField>
          <div className="text-small text-ink-soft flex flex-col gap-2">
            <p>When it&apos;s set, every page of the website sends:</p>
            <ul className="list-disc pl-5">
              <li>
                <strong>PageView</strong> on every page
              </li>
              <li>
                <strong>ViewContent</strong> on product pages (product, price in BDT)
              </li>
              <li>
                <strong>Search</strong> on search results
              </li>
              <li>
                <strong>Contact</strong> when someone taps WhatsApp, Messenger or call
              </li>
            </ul>
            <p>The admin pages never load the pixel.</p>
          </div>
        </FormSection>
      </AdminForm>
    </SettingsFrame>
  );
}
