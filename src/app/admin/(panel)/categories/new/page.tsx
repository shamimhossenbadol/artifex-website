import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoryFields } from "@/components/admin/categories/CategoryFields";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createCategoryAction } from "@/server/actions/category.actions";
import { requireAdmin } from "@/server/services/auth.service";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  await requireAdmin();
  return (
    <>
      <Breadcrumbs
        items={[{ label: "Categories", href: "/admin/categories" }, { label: "New category" }]}
      />
      <AdminPageHeader title="New category" />
      <div className="max-w-3xl">
        <AdminForm
          action={createCategoryAction}
          submitLabel="Create category"
          redirectTo="/admin/categories"
        >
          <CategoryFields category={null} />
        </AdminForm>
      </div>
    </>
  );
}
