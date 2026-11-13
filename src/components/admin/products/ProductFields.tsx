import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { MAX_COLORS, MAX_SPECS } from "@/lib/validation/product";
import type { AdminProductRow, CategoryOption } from "@/server/services/product-admin.service";
import { AdminField, FormSection } from "../AdminForm";
import { MarkdownEditor } from "./MarkdownEditor";
import { PricingFields } from "./PricingFields";
import { ColorsEditor, SpecsEditor } from "./RowsEditor";
import { SeoFields } from "./SeoFields";

const CHECK = "text-small flex min-h-11 items-center gap-2";
const BOX = "accent-ink size-4";

/** Product form sections (07 §3.2), shared by the create and edit pages. Photos live apart. */
export function ProductFields({
  product,
  categories,
  defaultCategoryId,
}: {
  product: AdminProductRow | null;
  categories: CategoryOption[];
  defaultCategoryId?: number;
}) {
  const published = product?.status === "PUBLISHED";
  return (
    <>
      {product && <input type="hidden" name="id" value={product.id} />}

      <FormSection title="Basics">
        <AdminField name="title" label="Title">
          <Input name="title" defaultValue={product?.title ?? ""} required maxLength={150} />
        </AdminField>
        <AdminField
          name="slug"
          label="Web address"
          hint={
            published
              ? "This product is live: changing the address breaks links people have saved or shared."
              : "Leave blank to create it from the title."
          }
        >
          <Input
            name="slug"
            defaultValue={product?.slug ?? ""}
            maxLength={170}
            placeholder="oslo-3-seater-sofa"
            autoCapitalize="none"
            spellCheck={false}
          />
        </AdminField>
        <AdminField name="categoryId" label="Category">
          <Select
            name="categoryId"
            defaultValue={String(product?.categoryId ?? defaultCategoryId ?? "")}
            required
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isActive ? "" : " (hidden)"}
              </option>
            ))}
          </Select>
        </AdminField>
        <AdminField
          name="shortDescription"
          label="Short description"
          hint="One or two sentences, shown near the price. Up to 300 characters."
        >
          <Textarea
            name="shortDescription"
            rows={3}
            defaultValue={product?.shortDescription ?? ""}
            required
            maxLength={300}
          />
        </AdminField>
        <AdminField
          name="description"
          label="Full description (optional)"
          hint="Formatting: **bold**, _italic_, ## heading, - list. Use Preview to check it."
        >
          <MarkdownEditor
            name="description"
            defaultValue={product?.description ?? ""}
            maxLength={20000}
          />
        </AdminField>
      </FormSection>

      <FormSection title="Pricing">
        <PricingFields
          regularPrice={product?.regularPrice ?? null}
          discountPrice={product?.discountPrice ?? null}
        />
      </FormSection>

      <FormSection
        title="Colours"
        description="Customers pick one before messaging you on WhatsApp. Leave empty if there's no choice."
      >
        <ColorsEditor initial={product?.colors ?? []} max={MAX_COLORS} />
      </FormSection>

      <FormSection title="Specifications" description="Shown as a table on the product page.">
        <SpecsEditor
          initial={product?.specs ?? []}
          max={MAX_SPECS}
          categories={categories.map(({ id, slug }) => ({ id, slug }))}
        />
      </FormSection>

      <FormSection title="Details">
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField name="sku" label="SKU (optional)">
            <Input name="sku" defaultValue={product?.sku ?? ""} maxLength={50} />
          </AdminField>
          <AdminField name="material" label="Material (optional)" hint="e.g. Solid mahogany">
            <Input name="material" defaultValue={product?.material ?? ""} maxLength={120} />
          </AdminField>
        </div>
        <AdminField
          name="dimensions"
          label="Dimensions (optional)"
          hint="e.g. W 220 × D 95 × H 85 cm"
        >
          <Input name="dimensions" defaultValue={product?.dimensions ?? ""} maxLength={120} />
        </AdminField>
        <AdminField
          name="keywords"
          label="Search keywords (optional)"
          hint="Other words people might search for, separated by commas: couch, settee."
        >
          <Input name="keywords" defaultValue={product?.keywords ?? ""} maxLength={255} />
        </AdminField>
        <label className={CHECK}>
          <input
            type="checkbox"
            name="isMadeToOrder"
            defaultChecked={product?.isMadeToOrder ?? false}
            className={BOX}
          />
          Made to order (custom size or finish)
        </label>
      </FormSection>

      <FormSection
        title="Visibility"
        description="Drafts are only visible here. Publish when the photos and details are ready."
      >
        <AdminField name="status" label="Status">
          <Select name="status" defaultValue={product?.status ?? "DRAFT"}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </Select>
        </AdminField>
        <div className="flex flex-col">
          <label className={CHECK}>
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product?.isFeatured ?? false}
              className={BOX}
            />
            Featured (homepage “Featured pieces”)
          </label>
          <label className={CHECK}>
            <input
              type="checkbox"
              name="isPopular"
              defaultChecked={product?.isPopular ?? false}
              className={BOX}
            />
            Popular (homepage “Most loved”)
          </label>
          <label className={CHECK}>
            <input
              type="checkbox"
              name="isNewArrival"
              defaultChecked={product?.isNewArrival ?? false}
              className={BOX}
            />
            New arrival (badge + homepage “New arrivals”)
          </label>
        </div>
        <AdminField
          name="homeSortOrder"
          label="Homepage order"
          hint="Lower numbers come first in the Featured and Most loved rails."
        >
          <Input
            name="homeSortOrder"
            type="number"
            inputMode="numeric"
            min={0}
            max={9999}
            defaultValue={product?.homeSortOrder ?? 0}
            className="max-w-40"
          />
        </AdminField>
      </FormSection>

      <details className="border-line bg-surface group rounded-md border">
        <summary className="text-ink flex min-h-14 cursor-pointer items-center px-5 font-semibold sm:px-6">
          Search engines (optional)
        </summary>
        <div className="px-5 pb-6 sm:px-6">
          <SeoFields
            seoTitle={product?.seoTitle ?? null}
            seoDescription={product?.seoDescription ?? null}
            slug={product?.slug ?? ""}
          />
        </div>
      </details>
    </>
  );
}
