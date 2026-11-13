import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoryFields } from "@/components/admin/categories/CategoryFields";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { idSchema } from "@/lib/validation/home";
import { updateCategoryAction } from "@/server/actions/category.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getCategory } from "@/server/services/category-admin.service";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  const id = idSchema.safeParse((await params).id);
  const category = id.success ? await getCategory(id.data) : null;
  if (!category) notFound();

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Categories", href: "/admin/categories" }, { label: category.name }]}
      />
      <AdminPageHeader
        title="Edit category"
        description={`${category.productCount} product${category.productCount === 1 ? "" : "s"} in this category.`}
        action={
          category.isActive ? (
            <Link
              href={`/categories/${category.slug}`}
              target="_blank"
              className="text-small text-ink-soft hover:text-ink inline-flex min-h-11 items-center gap-1 underline underline-offset-4"
            >
              View on site
              <ExternalLink aria-hidden strokeWidth={1.5} className="size-4" />
            </Link>
          ) : undefined
        }
      />
      <div className="max-w-3xl">
        <AdminForm action={updateCategoryAction} submitLabel="Save category">
          <CategoryFields category={category} />
        </AdminForm>
      </div>
    </>
  );
}
