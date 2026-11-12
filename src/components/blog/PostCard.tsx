import Image from "next/image";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/product/ImagePlaceholder";
import { formatPostDate } from "@/lib/blog";
import { cn } from "@/lib/utils";
import type { PostCardVM } from "@/server/services/blog.service";

/** Journal card: 3:2 cover, date, title, excerpt (03 §6, 05 §3). `featured` = the large first card. */
export function PostCard({
  post,
  featured = false,
  preload = false,
  headingLevel = 2,
}: {
  post: PostCardVM;
  featured?: boolean;
  preload?: boolean;
  /** 3 when the card sits under a section h2 (e.g. related posts), to keep heading order. */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <article className="group">
      <Link
        href={post.href}
        className={cn("block", featured && "md:grid md:grid-cols-12 md:items-center md:gap-10")}
      >
        <div
          className={cn(
            "bg-sand relative aspect-[3/2] overflow-hidden",
            featured && "md:col-span-7",
          )}
        >
          {post.cover ? (
            <Image
              src={post.cover.path}
              alt={post.cover.alt}
              fill
              preload={preload}
              sizes={featured ? "(min-width:768px) 58vw, 100vw" : "(min-width:1024px) 33vw, 100vw"}
              className="object-cover transition-transform duration-500 ease-out motion-safe:md:group-hover:scale-[1.03]"
            />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
        <div className={cn("mt-4 flex flex-col gap-2", featured && "md:col-span-5 md:mt-0")}>
          <p className="text-small text-muted">
            <time dateTime={post.publishedAt.toISOString()}>
              {formatPostDate(post.publishedAt)}
            </time>
          </p>
          <Heading
            className={cn(
              "text-ink underline-offset-4 group-hover:underline",
              featured ? "text-h2" : "text-h3",
            )}
          >
            {post.title}
          </Heading>
          <p className={cn("line-clamp-3", featured && "text-body-lg")}>{post.excerpt}</p>
        </div>
      </Link>
    </article>
  );
}
