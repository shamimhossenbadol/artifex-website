import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BannerFields } from "@/components/admin/home/BannerFields";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { idSchema } from "@/lib/validation/home";
import { updateBannerAction } from "@/server/actions/home.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getBanner } from "@/server/services/home-admin.service";

export const metadata: Metadata = { title: "Edit banner" };

export default async function EditBannerPage({
  params,
}: PageProps<"/admin/homepage/banners/[id]">) {
  await requireAdmin();
  const id = idSchema.safeParse((await params).id);
  const banner = id.success ? await getBanner(id.data) : null;
  if (!banner) notFound();

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Homepage", href: "/admin/homepage" }, { label: banner.title }]}
      />
      <AdminPageHeader title="Edit banner" />
      <div className="max-w-3xl">
        <AdminForm action={updateBannerAction} submitLabel="Save banner">
          <BannerFields banner={banner} />
        </AdminForm>
      </div>
    </>
  );
}
