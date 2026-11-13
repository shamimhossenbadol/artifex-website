import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandIntro } from "@/components/home/BrandIntro";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { Hero } from "@/components/home/Hero";
import { LatestPosts } from "@/components/home/LatestPosts";
import { ProductRail } from "@/components/home/ProductRail";
import { PromoBanners } from "@/components/home/PromoBanners";
import { WhatsAppBand } from "@/components/home/WhatsAppBand";
import { getContactLinks } from "@/components/site/contact-links";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/ui/JsonLd";
import { Skeleton } from "@/components/ui/Skeleton";
import { toOpeningHoursSpecification } from "@/lib/opening-hours";
import {
  absoluteImageUrl,
  localBusinessJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { getLatestPosts } from "@/server/services/blog.service";
import {
  getHomeCategories,
  getHomeHero,
  getHomeRail,
  getPromoBanners,
} from "@/server/services/home.service";
import { getSiteSettings } from "@/server/services/settings.service";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: { absolute: settings.defaultSeoTitle },
    description: settings.defaultSeoDescription,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      title: settings.defaultSeoTitle,
      description: settings.defaultSeoDescription,
      url: "/",
      // The admin's share image (Settings → SEO), else the logo mark.
      images: settings.ogImagePath
        ? [{ url: absoluteImageUrl(settings.ogImagePath), alt: settings.businessName }]
        : [{ url: "/logo-mark-512.png", width: 512, height: 512, alt: settings.businessName }],
    },
  };
}

async function HeroSection() {
  return <Hero hero={await getHomeHero()} />;
}

/** Everything below the hero, fetched in parallel; empty sections render nothing (F6). */
async function HomeSections() {
  const [settings, categories, newArrivals, banners, posts] = await Promise.all([
    getSiteSettings(),
    getHomeCategories(),
    getHomeRail("new"),
    getPromoBanners(),
    getLatestPosts(3),
  ]);
  const { phone, telHref, whatsappHref } = getContactLinks(settings);
  const sameAs = [settings.facebookUrl, settings.instagramUrl, settings.youtubeUrl].filter(
    (u): u is string => Boolean(u),
  );

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd({ name: settings.businessName, sameAs }),
          websiteJsonLd(settings.businessName),
          localBusinessJsonLd({
            name: settings.businessName,
            phone,
            email: settings.email,
            addressLine: settings.addressLine,
            city: settings.city,
            latitude: settings.latitude,
            longitude: settings.longitude,
            mapLinkUrl: settings.mapLinkUrl,
            sameAs,
            openingHoursSpecification: toOpeningHoursSpecification(settings.openingHours),
          }),
        ]}
      />
      <CategoryTiles categories={categories} />
      <ProductRail
        id="new-arrivals"
        title="New arrivals"
        products={newArrivals}
        link={{ href: "/products", label: "View all" }}
        tinted
      />
      <BrandIntro text={settings.aboutShort} />
      <PromoBanners banners={banners} />
      <WhatsAppBand whatsappHref={whatsappHref} phone={phone} telHref={telHref} />
      <LatestPosts posts={posts} />
    </>
  );
}

function HeroSkeleton() {
  return (
    <div aria-hidden className="flex min-h-[60svh] items-end md:min-h-[68vh] md:items-center">
      <Container className="py-16">
        <Skeleton className="h-4 w-40 md:mx-auto" />
        <Skeleton className="mt-6 h-14 w-full max-w-2xl md:mx-auto md:h-20" />
        <Skeleton className="mt-6 h-12 w-64 md:mx-auto" />
      </Container>
    </div>
  );
}

function SectionsSkeleton() {
  return (
    <Container aria-hidden className="py-16">
      <Skeleton className="h-8 w-56" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5]" />
        ))}
      </div>
    </Container>
  );
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<SectionsSkeleton />}>
        <HomeSections />
      </Suspense>
    </>
  );
}
