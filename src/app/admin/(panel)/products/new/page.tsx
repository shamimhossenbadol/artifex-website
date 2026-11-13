import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminPageHeader";
import { ProductFields } from "@/components/admin/products/ProductFields";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createProductAction } from "@/server/actions/product.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getCategoryOptions } from "@/server/services/product-admin.service";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage({ searchParams }: PageProps<"/admin/products/new">) {
  await requireAdmin();
  const [categories, params] = await Promise.all([getCategoryOptions(), searchParams]);
  // "?category=<slug>" preselects a category (e.g. from the category list).
  const preset = typeof params.category === "string" ? params.category : undefined;
  const defaultCategoryId = categories.find((c) => c.slug === preset)?.id;

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Products", href: "/admin/products" }, { label: "Add product" }]}
      />
      <AdminPageHeader
        title="Add product"
        description="Save the details first; you add photos on the next screen."
      />
      <div className="max-w-3xl">
        {categories.length === 0 ? (
          <AdminPanel>
            <p className="text-muted">Create a category first, then add products to it.</p>
          </AdminPanel>
        ) : (
          <AdminForm
            action={createProductAction}
            submitLabel="Save and add photos"
            redirectTo="/admin/products/{id}"
            guardUnsaved
          >
            <ProductFields
              product={null}
              categories={categories}
              defaultCategoryId={defaultCategoryId}
            />
          </AdminForm>
        )}
      </div>
    </>
  );
}
