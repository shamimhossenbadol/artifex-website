import { PostCard } from "@/components/blog/PostCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/ui/Container";
import type { PostCardVM } from "@/server/services/blog.service";

/**
 * "From the Journal" (05 §3): the 3 latest posts; hidden when there are none. Phones: a horizontal
 * scroll-snap row with the next post peeking (like the product rail); desktop: 3 columns.
 */
export function LatestPosts({ posts }: { posts: PostCardVM[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="journal-heading" className="reveal py-12 md:py-24">
      <Container>
        <SectionHeading
          id="journal-heading"
          eyebrow="Journal"
          title="Ideas for your home"
          link={{ href: "/blog", label: "All stories" }}
        />
      </Container>
      <Container className="max-md:px-0">
        <ul className="relative flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-2 sm:scroll-px-6 sm:px-6 md:grid md:grid-cols-3 md:gap-x-8 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {posts.map((post) => (
            <li key={post.id} className="w-[80%] shrink-0 snap-start sm:w-[48%] md:w-auto">
              <PostCard post={post} headingLevel={3} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
