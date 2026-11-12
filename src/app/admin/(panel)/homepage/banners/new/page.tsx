import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BannerFields } from "@/components/admin/home/BannerFields";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createBannerAction } from "@/server/actions/home.actions";
import { requireAdmin } from "@/server/services/auth.service";

export const metadata: Metadata = { title: "New banner" };

export default async function NewBannerPage() {
  await requireAdmin();
  return (
    <>
      <Breadcrumbs
        items={[{ label: "Homepage", href: "/admin/homepage" }, { label: "New banner" }]}
      />
      <AdminPageHeader title="New banner" />
      <div className="max-w-3xl">
        <AdminForm
          action={createBannerAction}
          submitLabel="Create banner"
          redirectTo="/admin/homepage"
        >
          <BannerFields banner={null} />
        </AdminForm>
      </div>
    </>
  );
}
