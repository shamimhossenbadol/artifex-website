import type { Metadata } from "next";
import { AdminField, AdminForm, FormSection } from "@/components/admin/AdminForm";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";
import {
  ProductTemplateField,
  WhatsAppNumberField,
} from "@/components/admin/settings/WhatsAppFields";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { saveSettingsAction } from "@/server/actions/settings.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getSettingsForEdit } from "@/server/services/settings-admin.service";

export const metadata: Metadata = { title: "Settings · Contact" };

/** Settings → Contact (07 §3.6): phone, WhatsApp number + messages, email. */
export default async function ContactSettingsPage() {
  await requireAdmin();
  const s = await getSettingsForEdit();
  return (
    <SettingsFrame>
      <AdminForm action={saveSettingsAction}>
        <input type="hidden" name="section" value="contact" />
        <FormSection title="Phone and email">
          <AdminField name="phone" label="Phone (as shown on the site)">
            <Input
              name="phone"
              defaultValue={s.phone}
              inputMode="tel"
              required
              maxLength={30}
              placeholder="+880 1757-758388"
            />
          </AdminField>
          <AdminField name="email" label="Email (optional)">
            <Input name="email" type="email" defaultValue={s.email ?? ""} maxLength={120} />
          </AdminField>
        </FormSection>
        <FormSection
          title="WhatsApp"
          description="Every “WhatsApp” button on the site opens a chat with this number."
        >
          <WhatsAppNumberField initial={s.whatsappNumber} />
          <AdminField
            name="whatsappDefaultMessage"
            label="Default message"
            hint="Pre-filled when someone taps the general WhatsApp button."
          >
            <Textarea
              name="whatsappDefaultMessage"
              defaultValue={s.whatsappDefaultMessage}
              rows={2}
              maxLength={300}
              required
            />
          </AdminField>
          <ProductTemplateField initial={s.whatsappProductTemplate} businessName={s.businessName} />
        </FormSection>
      </AdminForm>
    </SettingsFrame>
  );
}
