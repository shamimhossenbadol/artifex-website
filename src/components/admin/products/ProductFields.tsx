import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MAX_SPECS } from "@/lib/validation/product";
import type { AdminProductRow, CategoryOption } from "@/server/services/product-admin.service";
import { AdminField, FormSection } from "../AdminForm";
import { MarkdownEditor } from "../MarkdownEditor";
import { PricingFields } from "./PricingFields";
import { SpecsEditor } from "./RowsEditor";
import { SeoFields } from "../SeoFields";

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

      <FormSection title="Basic info">
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

      <FormSection title="Pricing">
        <PricingFields
          regularPrice={product?.regularPrice ?? null}
          discountPrice={product?.discountPrice ?? null}
        />
      </FormSection>

      <FormSection
        title="Specifications"
        description="Shown as a table on the product page. Material, Dimensions and SKU are specifications too. Remove rows you don't need; every row that stays needs a value."
      >
        <SpecsEditor
          initial={product?.specs ?? []}
          max={MAX_SPECS}
          categories={categories.map(({ id, slug }) => ({ id, slug }))}
          fillDefaultsOnStart={!product}
        />
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
              name="isPopular"
              defaultChecked={product?.isPopular ?? false}
              className={BOX}
            />
            Popular (ranked higher in search and related products)
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
      </FormSection>

      <FormSection
        title="Search engines"
        description="Used only for the Google result and for link previews on Facebook and WhatsApp. Not shown on the product page (ADR-060)."
      >
        <SeoFields
          seoTitle={product?.seoTitle ?? null}
          seoDescription={product?.shortDescription ?? null}
          slug={product?.slug ?? ""}
          descriptionName="shortDescription"
          descriptionMax={300}
          descriptionRequired
        />
      </FormSection>
    </>
  );
}
