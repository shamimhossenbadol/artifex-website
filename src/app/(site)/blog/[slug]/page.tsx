import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostCard } from "@/components/blog/PostCard";
import { ShareLinks } from "@/components/blog/ShareLinks";
import { PreviewBanner } from "@/components/site/PreviewBanner";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Markdown } from "@/components/ui/Markdown";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPostDate } from "@/lib/blog";
import { absoluteImageUrl, absoluteUrl, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { slugSchema } from "@/lib/validation/catalog";
import {
  getPostBySlug,
  getPostPreview,
  getRelatedPosts,
  type PostDetailVM,
} from "@/server/services/blog.service";
import { isAdminPreview } from "@/server/services/preview.service";

type Props = PageProps<"/blog/[slug]">;

async function loadPost(params: Props["params"], preview: boolean): Promise<PostDetailVM | null> {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) return null;
  // Draft preview is uncached and only for a signed-in admin.
  return preview ? getPostPreview(slug) : getPostBySlug(slug);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const preview = await isAdminPreview(searchParams);
  const post = await loadPost(params, preview);
  if (!post) return { title: "Post not found", robots: { index: false } };
  return {
    ...(preview ? { robots: { index: false, follow: false } } : {}),
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    alternates: { canonical: post.href },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: post.href,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      ...(post.cover
        ? { images: [{ url: absoluteImageUrl(post.cover.path), alt: post.cover.alt }] }
        : {}),
    },
  };
}

async function PostContent({ params, searchParams }: Props) {
  const preview = await isAdminPreview(searchParams);
  const post = await loadPost(params, preview);
  if (!post) notFound();
  const url = absoluteUrl(post.href);

  return (
    <article>
      {preview && <PreviewBanner editHref={`/admin/blog/${post.id}`} />}
      <JsonLd
        data={[
          articleJsonLd({
            title: post.title,
            description: post.excerpt,
            path: post.href,
            coverPath: post.cover?.path ?? null,
            authorName: post.authorName,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/blog" },
            { name: post.title, path: post.href },
          ]),
        ]}
      />
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Journal", href: "/blog" },
            { label: post.title },
          ]}
        />
        <h1 className="text-h1 mt-6">{post.title}</h1>
        <p className="text-small text-muted mt-4">
          {post.authorName} ·{" "}
          <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt)}</time>{" "}
          · {post.readingMinutes} min read
        </p>
      </div>

      {post.cover && (
        <div className="bg-sand relative mx-auto mt-8 aspect-[3/2] max-w-5xl overflow-hidden md:mt-12">
          <Image
            src={post.cover.path}
            alt={post.cover.alt}
            fill
            preload
            sizes="(min-width:1024px) 1024px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="mx-auto mt-10 max-w-3xl md:mt-14">
        <Markdown allowImages className="mx-auto">
          {post.content}
        </Markdown>
        <div className="border-line mt-12 border-t pt-8">
          <ShareLinks url={url} title={post.title} />
        </div>
      </div>

      <Suspense fallback={null}>
        <RelatedPosts postId={post.id} tags={post.tags} />
      </Suspense>
    </article>
  );
}

async function RelatedPosts({ postId, tags }: { postId: number; tags: string[] }) {
  const related = await getRelatedPosts(postId, tags);
  if (related.length === 0) return null;
  return (
    <aside aria-labelledby="related-posts" className="reveal mt-20">
      <SectionHeading id="related-posts" eyebrow="Keep reading" title="More from the Journal" />
      <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {related.map((post) => (
          <li key={post.id}>
            <PostCard post={post} headingLevel={3} />
          </li>
        ))}
      </ul>
    </aside>
  );
}

function PostSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading post" className="mx-auto max-w-3xl">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-6 h-12 w-full" />
      <Skeleton className="mt-4 h-4 w-64" />
      <Skeleton className="mt-10 aspect-[3/2] w-full" />
    </div>
  );
}

export default function PostPage({ params, searchParams }: Props) {
  return (
    <Container className="py-8 md:py-12">
      <Suspense fallback={<PostSkeleton />}>
        <PostContent params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
