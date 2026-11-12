import type { Metadata } from "next";
import { AdminField, AdminForm, FormSection } from "@/components/admin/AdminForm";
import { OpeningHoursEditor } from "@/components/admin/settings/OpeningHoursEditor";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { saveSettingsAction } from "@/server/actions/settings.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getSettingsForEdit } from "@/server/services/settings-admin.service";

export const metadata: Metadata = { title: "Settings · Location" };

/** Settings → Location (07 §3.6): address, map, directions, coordinates, opening hours. */
export default async function LocationSettingsPage() {
  await requireAdmin();
  const s = await getSettingsForEdit();
  return (
    <SettingsFrame>
      <AdminForm action={saveSettingsAction}>
        <input type="hidden" name="section" value="location" />
        <FormSection title="Address">
          <AdminField name="addressLine" label="Street address">
            <Input name="addressLine" defaultValue={s.addressLine} required maxLength={255} />
          </AdminField>
          <AdminField name="city" label="City and postcode">
            <Input name="city" defaultValue={s.city} required maxLength={80} />
          </AdminField>
        </FormSection>
        <FormSection title="Map">
          <AdminField
            name="mapEmbedUrl"
            label="Map embed"
            hint="In Google Maps: open the showroom → Share → Embed a map → Copy HTML, then paste it here. The whole <iframe> code is fine."
          >
            <Textarea
              name="mapEmbedUrl"
              defaultValue={s.mapEmbedUrl ?? ""}
              rows={3}
              className="font-mono text-xs"
            />
          </AdminField>
          <AdminField
            name="mapLinkUrl"
            label="Directions link"
            hint="Google Maps → Share → Copy link. Used by the “Get directions” button."
          >
            <Input name="mapLinkUrl" type="url" defaultValue={s.mapLinkUrl ?? ""} maxLength={500} />
          </AdminField>
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField name="latitude" label="Latitude (optional)">
              <Input
                name="latitude"
                inputMode="decimal"
                defaultValue={s.latitude ?? ""}
                placeholder="23.8570"
              />
            </AdminField>
            <AdminField name="longitude" label="Longitude (optional)">
              <Input
                name="longitude"
                inputMode="decimal"
                defaultValue={s.longitude ?? ""}
                placeholder="90.4001"
              />
            </AdminField>
          </div>
        </FormSection>
        <FormSection
          title="Opening hours"
          description="Shown in the footer and on the Contact page, with an Open now / Closed badge."
        >
          <OpeningHoursEditor initial={s.openingHours} />
        </FormSection>
      </AdminForm>
    </SettingsFrame>
  );
}
