import { PostCard } from "@/components/blog/PostCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Container } from "@/components/ui/Container";
import type { PostCardVM } from "@/server/services/blog.service";

/** "From the Journal" (05 §3): the 3 latest posts; hidden when there are none. */
export function LatestPosts({ posts }: { posts: PostCardVM[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="journal-heading" className="reveal py-16 md:py-24">
      <Container>
        <SectionHeading
          id="journal-heading"
          eyebrow="Journal"
          title="Ideas for your home"
          link={{ href: "/blog", label: "All stories" }}
        />
        <ul className="grid gap-x-8 gap-y-12 md:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} headingLevel={3} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
