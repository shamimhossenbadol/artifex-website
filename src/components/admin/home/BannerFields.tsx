import { Input } from "@/components/ui/Input";
import { toDhakaDateInput } from "@/lib/validation/home";
import type { AdminBannerRow } from "@/server/services/home-admin.service";
import { AdminField, FormSection } from "../AdminForm";
import { ImageField } from "../ImageField";

/** Promo banner fields (07 §3.5), shared by the create and edit pages. */
export function BannerFields({ banner }: { banner: AdminBannerRow | null }) {
  return (
    <>
      {banner && <input type="hidden" name="id" value={banner.id} />}
      <FormSection title="Content">
        <AdminField name="title" label="Title">
          <Input name="title" defaultValue={banner?.title ?? ""} required maxLength={100} />
        </AdminField>
        <AdminField name="subtitle" label="Subtitle (optional)">
          <Input name="subtitle" defaultValue={banner?.subtitle ?? ""} maxLength={200} />
        </AdminField>
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField name="linkLabel" label="Link text (optional)" hint="e.g. Shop sofas">
            <Input name="linkLabel" defaultValue={banner?.linkLabel ?? ""} maxLength={40} />
          </AdminField>
          <AdminField name="linkHref" label="Link (optional)" hint="e.g. /categories/sofas">
            <Input name="linkHref" defaultValue={banner?.linkHref ?? ""} maxLength={255} />
          </AdminField>
        </div>
      </FormSection>
      <FormSection
        title="Image"
        description="Wide images work best (shown at 16:9 on phones, 21:9 on desktop)."
      >
        <ImageField
          key={banner?.imagePath ?? "new"}
          name="image"
          label="Banner image"
          currentPath={banner?.imagePath ?? null}
          currentAlt={banner?.imageAlt}
          required
        />
        <AdminField
          name="imageAlt"
          label="Image description"
          hint="What the image shows, for screen readers."
        >
          <Input name="imageAlt" defaultValue={banner?.imageAlt ?? ""} required maxLength={160} />
        </AdminField>
      </FormSection>
      <FormSection
        title="Visibility"
        description="Up to two live banners show on the homepage, in list order. Dates are Dhaka time."
      >
        <label className="text-small flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={banner?.isActive ?? true}
            className="accent-ink size-4"
          />
          Show this banner
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField name="startsAt" label="Start date (optional)">
            <Input
              name="startsAt"
              type="date"
              defaultValue={toDhakaDateInput(banner?.startsAt ?? null)}
            />
          </AdminField>
          <AdminField
            name="endsAt"
            label="End date (optional)"
            hint="Shown until the end of this day."
          >
            <Input
              name="endsAt"
              type="date"
              defaultValue={toDhakaDateInput(banner?.endsAt ?? null)}
            />
          </AdminField>
        </div>
      </FormSection>
    </>
  );
}
