import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminPageHeader";
import { BannerList } from "@/components/admin/home/BannerList";
import { HeroForm } from "@/components/admin/home/HeroForm";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { requireAdmin } from "@/server/services/auth.service";
import { getHeroForEdit, listBanners } from "@/server/services/home-admin.service";

export const metadata: Metadata = { title: "Homepage" };

/** Homepage editor (07 §3.5): hero and promo banners. Featured lists arrive in milestone 7f. */
export default async function HomepageAdminPage() {
  await requireAdmin();
  const [hero, banners] = await Promise.all([getHeroForEdit(), listBanners()]);

  return (
    <>
      <AdminPageHeader
        title="Homepage"
        description="The top of the homepage and the promotional banners. Changes go live when you save."
      />
      <div className="grid max-w-3xl gap-10">
        <section aria-labelledby="hero-title">
          <h2 id="hero-title" className="text-h3 mb-4">
            Hero
          </h2>
          <HeroForm hero={hero} />
        </section>

        <section aria-labelledby="banners-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="banners-title" className="text-h3">
              Promo banners
            </h2>
            <ButtonLink href="/admin/homepage/banners/new" variant="secondary">
              <Plus aria-hidden strokeWidth={1.5} className="size-4" />
              New banner
            </ButtonLink>
          </div>
          <AdminPanel>
            <BannerList banners={banners} />
          </AdminPanel>
        </section>

        <AdminPanel title="Also on the homepage">
          <ul className="text-ink-soft flex flex-col gap-2">
            <li>
              Category tiles follow the order and “Show on home” switches in{" "}
              <Link href="/admin/categories" className="text-ink underline underline-offset-4">
                Categories
              </Link>
              .
            </li>
            <li>
              New arrivals, Featured and Popular rails use the flags on each{" "}
              <Link href="/admin/products" className="text-ink underline underline-offset-4">
                product
              </Link>
              .
            </li>
          </ul>
        </AdminPanel>
      </div>
    </>
  );
}
