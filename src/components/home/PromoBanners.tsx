import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import type { PromoBannerVM } from "@/server/services/home.service";

/** 1–2 wide promo banners (05 §3, F6); hidden when none are active and in date. */
export function PromoBanners({ banners }: { banners: PromoBannerVM[] }) {
  if (banners.length === 0) return null;
  return (
    <section aria-label="Offers" className="reveal py-8 md:py-12">
      <Container className={cn("grid gap-4 md:gap-6", banners.length > 1 && "md:grid-cols-2")}>
        {banners.map((banner) => {
          const content = (
            <>
              <Image
                src={banner.imagePath}
                alt={banner.imageAlt}
                fill
                sizes={banners.length > 1 ? "(min-width:768px) 50vw, 100vw" : "100vw"}
                className="object-cover transition-transform duration-500 ease-out motion-safe:md:group-hover:scale-[1.02]"
              />
              <div aria-hidden className="bg-ink/35 absolute inset-0" />
              <div className="text-bg absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p className="text-h3 text-bg">{banner.title}</p>
                {banner.subtitle && <p className="mt-2 max-w-md">{banner.subtitle}</p>}
                {banner.linkHref && (
                  <span className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
                    {banner.linkLabel ?? "Discover"}
                  </span>
                )}
              </div>
            </>
          );
          const classes =
            "group bg-sand relative block aspect-[16/9] overflow-hidden md:aspect-[21/9]";
          return banner.linkHref ? (
            <Link key={banner.id} href={banner.linkHref} className={classes}>
              {content}
            </Link>
          ) : (
            <div key={banner.id} className={classes}>
              {content}
            </div>
          );
        })}
      </Container>
    </section>
  );
}
