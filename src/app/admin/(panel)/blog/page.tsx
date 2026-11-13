import { ExternalLink, ImageOff, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminPageHeader";
import { PostRowActions } from "@/components/admin/blog/PostRowActions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { formatPostDate } from "@/lib/blog";
import { adminPostQuerySchema, type AdminPostQuery } from "@/lib/validation/blog";
import { requireAdmin } from "@/server/services/auth.service";
import { listAdminPosts } from "@/server/services/blog-admin.service";

export const metadata: Metadata = { title: "Journal" };

function listHref(query: AdminPostQuery, page: number): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/blog?${qs}` : "/admin/blog";
}

const ICON_LINK = "text-ink-soft hover:text-ink inline-flex size-11 items-center justify-center";

/** Journal (07 §3.4): search, status filter, 20 per page. */
export default async function BlogAdminPage({ searchParams }: PageProps<"/admin/blog">) {
  await requireAdmin();
  const query = adminPostQuerySchema.parse(await searchParams);
  const list = await listAdminPosts(query);
  const filtered = Boolean(query.q || query.status);

  return (
    <>
      <AdminPageHeader
        title="Journal"
        description={`${list.total} post${list.total === 1 ? "" : "s"}${filtered ? " match these filters" : ""}.`}
        action={
          <ButtonLink href="/admin/blog/new">
            <Plus aria-hidden strokeWidth={1.5} className="size-4" />
            Write post
          </ButtonLink>
        }
      />

      <form
        action="/admin/blog"
        role="search"
        aria-label="Filter posts"
        className="mb-6 grid gap-3 sm:grid-cols-[1fr_12rem_auto]"
      >
        <label>
          <span className="sr-only">Search by title</span>
          <Input
            name="q"
            type="search"
            defaultValue={query.q ?? ""}
            placeholder="Search by title"
            maxLength={60}
          />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <Select name="status" defaultValue={query.status ?? ""}>
            <option value="">Any status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </Select>
        </label>
        <div className="flex gap-3">
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          {filtered && (
            <Link
              href="/admin/blog"
              className="text-small text-ink-soft hover:text-ink inline-flex min-h-11 items-center underline underline-offset-4"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <AdminPanel>
        {list.items.length === 0 ? (
          <p className="text-muted">
            {filtered ? "No posts match these filters." : "No posts yet. Write your first one."}
          </p>
        ) : (
          <ul className="divide-line flex flex-col divide-y">
            {list.items.map((post) => {
              const live = post.status === "PUBLISHED";
              return (
                <li key={post.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="bg-sand relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-sm">
                      {post.coverImagePath ? (
                        <Image
                          src={post.coverImagePath}
                          alt=""
                          fill
                          sizes="5rem"
                          className="object-cover"
                        />
                      ) : (
                        <ImageOff
                          aria-hidden
                          strokeWidth={1.5}
                          className="text-muted absolute inset-0 m-auto size-5"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-ink block truncate font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                      <p className="text-small text-muted truncate">
                        {post.publishedAt ? `Published ${formatPostDate(post.publishedAt)} · ` : ""}
                        Updated {formatPostDate(post.updatedAt)}
                      </p>
                      <div className="mt-1">
                        <Badge variant={live ? "new" : "neutral"}>
                          {live ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/blog/${post.id}`} className={ICON_LINK}>
                      <Pencil aria-hidden strokeWidth={1.5} className="size-5" />
                      <span className="sr-only">Edit “{post.title}”</span>
                    </Link>
                    {live && (
                      <Link href={`/blog/${post.slug}`} target="_blank" className={ICON_LINK}>
                        <ExternalLink aria-hidden strokeWidth={1.5} className="size-5" />
                        <span className="sr-only">View “{post.title}” on the site</span>
                      </Link>
                    )}
                    <PostRowActions id={post.id} title={post.title} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination
          page={list.page}
          pageCount={list.pageCount}
          hrefFor={(page) => listHref(query, page)}
        />
      </AdminPanel>
    </>
  );
}
