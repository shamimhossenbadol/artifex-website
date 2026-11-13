import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminPageHeader";
import { CategoryList } from "@/components/admin/categories/CategoryList";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { requireAdmin } from "@/server/services/auth.service";
import { listCategories } from "@/server/services/category-admin.service";

export const metadata: Metadata = { title: "Categories" };

/** Categories (07 §3.3): order, visibility switches, product counts. */
export default async function CategoriesAdminPage() {
  await requireAdmin();
  const categories = await listCategories();

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="The order here is the order in the menu and on the homepage. Changes go live straight away."
        action={
          <ButtonLink href="/admin/categories/new">
            <Plus aria-hidden strokeWidth={1.5} className="size-4" />
            New category
          </ButtonLink>
        }
      />
      <div className="max-w-4xl">
        <AdminPanel>
          <CategoryList categories={categories} />
        </AdminPanel>
      </div>
    </>
  );
}
