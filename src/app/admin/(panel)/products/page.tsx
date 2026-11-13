import { ExternalLink, ImageOff, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminPageHeader";
import { ProductRowActions } from "@/components/admin/products/ProductRowActions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Price } from "@/components/ui/Price";
import { Select } from "@/components/ui/Select";
import { formatPostDate } from "@/lib/blog";
import { adminProductQuerySchema, type AdminProductQuery } from "@/lib/validation/product";
import { requireAdmin } from "@/server/services/auth.service";
import { getCategoryOptions, listAdminProducts } from "@/server/services/product-admin.service";

export const metadata: Metadata = { title: "Products" };

function listHref(query: AdminProductQuery, page: number): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.status) params.set("status", query.status);
  if (query.flag) params.set("flag", query.flag);
  if (query.sort) params.set("sort", query.sort);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

const ICON_LINK = "text-ink-soft hover:text-ink inline-flex size-11 items-center justify-center";

/** Products (07 §3.2): search, filters, sort, 20 per page. */
export default async function ProductsAdminPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const query = adminProductQuerySchema.parse(await searchParams);
  const [list, categories] = await Promise.all([listAdminProducts(query), getCategoryOptions()]);
  const filtered = Boolean(query.q || query.category || query.status || query.flag);
  const countText = `${list.total} product${list.total === 1 ? "" : "s"}${filtered ? " match these filters" : ""}.`;

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={countText}
        action={
          <ButtonLink href="/admin/products/new">
            <Plus aria-hidden strokeWidth={1.5} className="size-4" />
            Add product
          </ButtonLink>
        }
      />

      {/* A plain GET form: filters work without JavaScript and the URL can be bookmarked. */}
      <form
        action="/admin/products"
        role="search"
        aria-label="Filter products"
        className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
      >
        <label className="lg:col-span-2">
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
          <span className="sr-only">Category</span>
          <Select name="category" defaultValue={query.category ?? ""}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <Select name="status" defaultValue={query.status ?? ""}>
            <option value="">Any status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </Select>
        </label>
        <label>
          <span className="sr-only">Show only</span>
          <Select name="flag" defaultValue={query.flag ?? ""}>
            <option value="">All products</option>
            <option value="popular">Popular</option>
            <option value="new">New arrivals</option>
            <option value="sale">On sale</option>
            <option value="no-images">Without photos</option>
          </Select>
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <Select name="sort" defaultValue={query.sort ?? "updated"}>
            <option value="updated">Recently updated</option>
            <option value="title">Title A–Z</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </Select>
        </label>
        <div className="flex gap-3 sm:col-span-2 lg:col-span-6">
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          {filtered && (
            <Link
              href="/admin/products"
              className="text-small text-ink-soft hover:text-ink inline-flex min-h-11 items-center underline underline-offset-4"
            >
              Clear filters
            </Link>
          )}
        </div>
      </form>

      <AdminPanel>
        {list.items.length === 0 ? (
          <p className="text-muted">
            {filtered ? "No products match these filters." : "No products yet. Add your first one."}
          </p>
        ) : (
          <ul className="divide-line flex flex-col divide-y">
            {list.items.map((p) => {
              const live = p.status === "PUBLISHED" && p.category.isActive;
              return (
                <li key={p.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="bg-sand relative size-16 shrink-0 overflow-hidden rounded-sm">
                      {p.imagePath ? (
                        <Image
                          src={p.imagePath}
                          alt=""
                          fill
                          sizes="4rem"
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
                        href={`/admin/products/${p.id}`}
                        className="text-ink block truncate font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-small text-muted truncate">
                        {p.category.name} · Updated {formatPostDate(p.updatedAt)}
                        {p.imageCount === 0 && " · No photos"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant={p.status === "PUBLISHED" ? "new" : "neutral"}>
                          {p.status === "PUBLISHED" ? "Published" : "Draft"}
                        </Badge>
                        {p.isPopular && <Badge>Popular</Badge>}
                        {p.isNewArrival && <Badge>New</Badge>}
                      </div>
                    </div>
                  </div>
                  <Price
                    regularPrice={p.regularPrice}
                    discountPrice={p.discountPrice}
                    className="text-small md:w-44 md:justify-end md:text-right"
                  />
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/products/${p.id}`} className={ICON_LINK}>
                      <Pencil aria-hidden strokeWidth={1.5} className="size-5" />
                      <span className="sr-only">Edit “{p.title}”</span>
                    </Link>
                    {live && (
                      <Link href={`/products/${p.slug}`} target="_blank" className={ICON_LINK}>
                        <ExternalLink aria-hidden strokeWidth={1.5} className="size-5" />
                        <span className="sr-only">View “{p.title}” on the site</span>
                      </Link>
                    )}
                    <ProductRowActions id={p.id} title={p.title} />
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
