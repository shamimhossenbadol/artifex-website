import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PostFields } from "@/components/admin/blog/PostFields";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { toDhakaDateInput } from "@/lib/validation/home";
import { createPostAction } from "@/server/actions/blog.actions";
import { requireAdmin } from "@/server/services/auth.service";

export const metadata: Metadata = { title: "Write post" };

export default async function NewPostPage() {
  const admin = await requireAdmin();
  return (
    <>
      <Breadcrumbs items={[{ label: "Journal", href: "/admin/blog" }, { label: "Write post" }]} />
      <AdminPageHeader title="Write post" />
      <div className="max-w-3xl">
        <AdminForm
          action={createPostAction}
          submitLabel="Create post"
          redirectTo="/admin/blog/{id}"
          guardUnsaved
        >
          <PostFields post={null} defaultAuthor={admin.name} today={toDhakaDateInput(new Date())} />
        </AdminForm>
      </div>
    </>
  );
}
