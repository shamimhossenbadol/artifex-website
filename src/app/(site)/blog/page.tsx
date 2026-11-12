import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostCard } from "@/components/blog/PostCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { breadcrumbJsonLd } from "@/lib/seo";
import { listingQuerySchema } from "@/lib/validation/catalog";
import { listPosts } from "@/server/services/blog.service";

type Props = PageProps<"/blog">;
const TITLE = "Journal";

function pageHref(page: number): string {
  return page > 1 ? `/blog?page=${page}` : "/blog";
}

async function readPage(searchParams: Props["searchParams"]): Promise<number | null> {
  const parsed = listingQuerySchema.pick({ page: true }).safeParse(await searchParams);
  return parsed.success ? parsed.data.page : null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = (await readPage(searchParams)) ?? 1;
  return {
    title: page > 1 ? `${TITLE} (page ${page})` : TITLE,
    description:
      "Ideas and practical guides for furnishing a home in Dhaka: choosing sofas, dining tables and chandeliers, and caring for wood.",
    alternates: { canonical: pageHref(page) },
  };
}

async function PostList({ searchParams }: Pick<Props, "searchParams">) {
  const page = await readPage(searchParams);
  if (page === null) notFound();
  const { items, pageCount } = await listPosts(page);
  if (page > pageCount) notFound();

  if (items.length === 0) {
    return (
      <p className="border-line bg-surface text-h3 border px-6 py-14 text-center">
        Stories are on their way.
      </p>
    );
  }

  // Page 1: the newest post is featured large, the rest in a 3-column grid (05 §3).
  const [first, ...rest] = items;
  const featured = page === 1 ? first : undefined;
  const grid = page === 1 ? rest : items;

  return (
    <>
      {featured && (
        <div className="mb-14 md:mb-20">
          <PostCard post={featured} featured preload />
        </div>
      )}
      {grid.length > 0 && (
        <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {grid.map((post, i) => (
            <li key={post.id} className={i < 3 ? undefined : "reveal"}>
              <PostCard post={post} preload={!featured && i === 0} />
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} hrefFor={pageHref} />
    </>
  );
}

function PostListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading posts">
      <Skeleton className="aspect-[3/2] w-full md:w-7/12" />
      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/2] w-full" />
        ))}
      </div>
    </div>
  );
}

export default function BlogPage({ searchParams }: Props) {
  return (
    <Container className="py-8 md:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: TITLE, path: "/blog" },
        ])}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: TITLE }]} />
      <h1 className="text-h1 mt-6">{TITLE}</h1>
      <p className="text-body-lg mt-3 mb-10 max-w-2xl md:mb-14">
        Ideas and practical guides for furnishing a home you love.
      </p>
      <Suspense fallback={<PostListSkeleton />}>
        <PostList searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
