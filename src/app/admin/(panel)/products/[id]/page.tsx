import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductFields } from "@/components/admin/products/ProductFields";
import { ProductImages } from "@/components/admin/products/ProductImages";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { idSchema } from "@/lib/validation/home";
import { MAX_PRODUCT_IMAGES } from "@/lib/validation/product";
import { updateProductAction } from "@/server/actions/product.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getCategoryOptions, getProductForEdit } from "@/server/services/product-admin.service";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const id = idSchema.safeParse((await params).id);
  const [product, categories] = await Promise.all([
    id.success ? getProductForEdit(id.data) : null,
    getCategoryOptions(),
  ]);
  if (!product) notFound();
  const live = product.status === "PUBLISHED" && product.category.isActive;

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Products", href: "/admin/products" }, { label: product.title }]}
      />
      <AdminPageHeader
        title="Edit product"
        description={
          live
            ? "Published: changes go live when you save."
            : "Draft: only visible here until you publish it."
        }
        action={
          live ? (
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="text-small text-ink-soft hover:text-ink inline-flex min-h-11 items-center gap-1 underline underline-offset-4"
            >
              View on site
              <ExternalLink aria-hidden strokeWidth={1.5} className="size-4" />
            </Link>
          ) : undefined
        }
      />
      <div className="flex max-w-3xl flex-col gap-8">
        {/* Photos save on their own, so they sit outside the details form. */}
        <section
          id="photos"
          aria-labelledby="photos-title"
          className="border-line bg-surface rounded-md border p-5 sm:p-6"
        >
          <h2 id="photos-title" className="text-ink mb-4 text-base font-semibold">
            Photos
          </h2>
          <ProductImages productId={product.id} images={product.images} max={MAX_PRODUCT_IMAGES} />
        </section>

        <AdminForm action={updateProductAction} submitLabel="Save product" guardUnsaved>
          <ProductFields product={product} categories={categories} />
        </AdminForm>
      </div>
    </>
  );
}
