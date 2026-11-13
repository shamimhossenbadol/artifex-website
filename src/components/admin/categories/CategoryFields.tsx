import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { AdminCategoryVM } from "@/server/services/category-admin.service";
import { AdminField, FormSection } from "../AdminForm";
import { ImageField } from "../ImageField";

/** Category fields (07 §3.3), shared by the create and edit pages. */
export function CategoryFields({ category }: { category: AdminCategoryVM | null }) {
  return (
    <>
      {category && <input type="hidden" name="id" value={category.id} />}
      <FormSection title="Details">
        <AdminField name="name" label="Name">
          <Input name="name" defaultValue={category?.name ?? ""} required maxLength={80} />
        </AdminField>
        <AdminField
          name="slug"
          label="Web address"
          hint={
            category
              ? "Changing this breaks links people have saved or shared. Only change it if you must."
              : "Leave blank to create it from the name, e.g. “Dining Tables” → dining-tables."
          }
        >
          <Input
            name="slug"
            defaultValue={category?.slug ?? ""}
            maxLength={100}
            placeholder="dining-tables"
            autoCapitalize="none"
            spellCheck={false}
          />
        </AdminField>
        <AdminField
          name="description"
          label="Description (optional)"
          hint="Shown at the top of the category page."
        >
          <Textarea
            name="description"
            rows={4}
            defaultValue={category?.description ?? ""}
            maxLength={1000}
          />
        </AdminField>
      </FormSection>

      <FormSection
        title="Image"
        description="Used on the homepage category tile. Portrait photos work best (4:5)."
      >
        <ImageField
          key={category?.imagePath ?? "new"}
          name="image"
          label="Category image (optional)"
          currentPath={category?.imagePath ?? null}
          currentAlt={category?.name}
          aspect="aspect-[4/5] max-w-xs"
        />
        {category?.imagePath && (
          <label className="text-small flex min-h-11 items-center gap-2">
            <input type="checkbox" name="removeImage" className="accent-ink size-4" />
            Remove the current image
          </label>
        )}
      </FormSection>

      <FormSection title="Visibility">
        <label className="text-small flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={category?.isActive ?? true}
            className="accent-ink size-4"
          />
          Active (shown in the menu and has its own page)
        </label>
        <label className="text-small flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="showOnHome"
            defaultChecked={category?.showOnHome ?? true}
            className="accent-ink size-4"
          />
          Show on the homepage
        </label>
      </FormSection>

      <FormSection
        title="Search engines (optional)"
        description="Leave blank to use the category name and description."
      >
        <AdminField name="seoTitle" label="SEO title" hint="Up to 70 characters.">
          <Input name="seoTitle" defaultValue={category?.seoTitle ?? ""} maxLength={70} />
        </AdminField>
        <AdminField name="seoDescription" label="SEO description" hint="Up to 170 characters.">
          <Textarea
            name="seoDescription"
            rows={3}
            defaultValue={category?.seoDescription ?? ""}
            maxLength={170}
          />
        </AdminField>
      </FormSection>
    </>
  );
}
