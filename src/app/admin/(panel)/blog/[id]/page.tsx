import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PostFields } from "@/components/admin/blog/PostFields";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { idSchema, toDhakaDateInput } from "@/lib/validation/home";
import { updatePostAction } from "@/server/actions/blog.actions";
import { requireAdmin } from "@/server/services/auth.service";
import { getPostForEdit } from "@/server/services/blog-admin.service";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse((await params).id);
  const post = id.success ? await getPostForEdit(id.data) : null;
  if (!post) notFound();
  const live = post.status === "PUBLISHED";

  return (
    <>
      <Breadcrumbs items={[{ label: "Journal", href: "/admin/blog" }, { label: post.title }]} />
      <AdminPageHeader
        title="Edit post"
        description={
          live
            ? "Published: changes go live when you save."
            : "Draft: only visible here until you publish it."
        }
        action={
          <Link
            href={live ? `/blog/${post.slug}` : `/blog/${post.slug}?preview=1`}
            target="_blank"
            className="text-small text-ink-soft hover:text-ink inline-flex min-h-11 items-center gap-1 underline underline-offset-4"
          >
            {live ? "View on site" : "Preview"}
            <ExternalLink aria-hidden strokeWidth={1.5} className="size-4" />
          </Link>
        }
      />
      <div className="max-w-3xl">
        <AdminForm action={updatePostAction} submitLabel="Save post" guardUnsaved>
          <PostFields post={post} defaultAuthor={admin.name} today={toDhakaDateInput(new Date())} />
        </AdminForm>
      </div>
    </>
  );
}
