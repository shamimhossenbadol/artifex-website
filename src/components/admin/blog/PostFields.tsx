import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toDhakaDateInput } from "@/lib/validation/home";
import { uploadPostImageAction } from "@/server/actions/blog.actions";
import type { AdminPostRow } from "@/server/services/blog-admin.service";
import { AdminField, FormSection } from "../AdminForm";
import { ImageField } from "../ImageField";
import { MarkdownEditor } from "../MarkdownEditor";
import { SeoFields } from "../SeoFields";

/** Journal post fields (07 §3.4), shared by the create and edit pages. */
export function PostFields({
  post,
  defaultAuthor,
  today,
}: {
  post: AdminPostRow | null;
  defaultAuthor: string;
  /** Today in Dhaka ("YYYY-MM-DD"): the latest allowed publish date. */
  today: string;
}) {
  const published = post?.status === "PUBLISHED";
  return (
    <>
      {post && <input type="hidden" name="id" value={post.id} />}

      <FormSection title="Post">
        <AdminField name="title" label="Title">
          <Input name="title" defaultValue={post?.title ?? ""} required maxLength={160} />
        </AdminField>
        <AdminField
          name="slug"
          label="Web address"
          hint={
            published
              ? "This post is live: changing the address breaks links people have saved or shared."
              : "Leave blank to create it from the title."
          }
        >
          <Input
            name="slug"
            defaultValue={post?.slug ?? ""}
            maxLength={180}
            placeholder="choosing-the-right-sofa"
            autoCapitalize="none"
            spellCheck={false}
          />
        </AdminField>
        <AdminField
          name="excerpt"
          label="Excerpt"
          hint="One or two sentences shown on post cards. Up to 300 characters."
        >
          <Textarea
            name="excerpt"
            rows={3}
            defaultValue={post?.excerpt ?? ""}
            required
            maxLength={300}
          />
        </AdminField>
        <AdminField
          name="content"
          label="Content"
          hint="Use the image button to add photos inside the post; replace “Describe the image” with a short description."
        >
          <MarkdownEditor
            name="content"
            label="Post editor"
            defaultValue={post?.content ?? ""}
            maxLength={100000}
            rows={18}
            uploadImage={uploadPostImageAction}
          />
        </AdminField>
      </FormSection>

      <FormSection
        title="Cover photo"
        description="Shown on post cards and at the top of the post."
      >
        <ImageField
          key={post?.coverImagePath ?? "new"}
          name="cover"
          label="Cover photo (optional)"
          currentPath={post?.coverImagePath ?? null}
          currentAlt={post?.coverImageAlt ?? ""}
        />
        <AdminField
          name="coverImageAlt"
          label="Cover description"
          hint="What the photo shows, for screen readers. Blank uses the title."
        >
          <Input name="coverImageAlt" defaultValue={post?.coverImageAlt ?? ""} maxLength={160} />
        </AdminField>
        {post?.coverImagePath && (
          <label className="text-small flex min-h-11 items-center gap-2">
            <input type="checkbox" name="removeCover" className="accent-ink size-4" />
            Remove the cover photo
          </label>
        )}
      </FormSection>

      <FormSection title="Details">
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField name="authorName" label="Author">
            <Input
              name="authorName"
              defaultValue={post?.authorName ?? defaultAuthor}
              required
              maxLength={80}
            />
          </AdminField>
          <AdminField
            name="tags"
            label="Tags (optional)"
            hint="Comma-separated, e.g. sofas, living room. Related posts share tags."
          >
            <Input name="tags" defaultValue={post?.tags ?? ""} maxLength={255} />
          </AdminField>
        </div>
      </FormSection>

      <FormSection
        title="Publishing"
        description="Drafts are only visible here. Published posts appear in the Journal and on the homepage."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField name="status" label="Status">
            <Select name="status" defaultValue={post?.status ?? "DRAFT"}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </Select>
          </AdminField>
          <AdminField
            name="publishDate"
            label="Publish date"
            hint="Blank = today when you publish. Set an earlier date to back-date a post."
          >
            <Input
              name="publishDate"
              type="date"
              max={today}
              defaultValue={toDhakaDateInput(post?.publishedAt ?? null)}
            />
          </AdminField>
        </div>
      </FormSection>

      <details className="border-line bg-surface rounded-md border">
        <summary className="text-ink flex min-h-14 cursor-pointer items-center px-5 font-semibold sm:px-6">
          Search engines (optional)
        </summary>
        <div className="px-5 pb-6 sm:px-6">
          <SeoFields
            seoTitle={post?.seoTitle ?? null}
            seoDescription={post?.seoDescription ?? null}
            slug={post?.slug ?? ""}
            path="blog"
            summaryField="excerpt"
            summaryLabel="excerpt"
          />
        </div>
      </details>
    </>
  );
}
