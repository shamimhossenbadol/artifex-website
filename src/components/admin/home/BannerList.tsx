"use client";
// Promo banner list (07 §3.5): status, order (move up/down), edit, delete with confirmation.
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import type { ActionResult } from "@/lib/action-result";
import { deleteBannerAction, moveBannerAction } from "@/server/actions/home.actions";
import type { AdminBannerVM, BannerState } from "@/server/services/home-admin.service";
import { ConfirmButton } from "../ConfirmButton";
import { useToast } from "../Toaster";

const STATE_LABEL: Record<BannerState, string> = {
  live: "Live",
  scheduled: "Scheduled",
  ended: "Ended",
  hidden: "Hidden",
};

export function BannerList({ banners }: { banners: AdminBannerVM[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await task();
      if (!result.ok) toast.error(result.error);
      else if (result.message) toast.success(result.message);
      router.refresh();
    });
  }

  if (banners.length === 0) {
    return <p className="text-muted">No banners yet. Banners appear below the product rails.</p>;
  }

  return (
    <ol className="flex flex-col gap-3" aria-busy={pending}>
      {banners.map((banner, index) => (
        <li
          key={banner.id}
          className="border-line flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center"
        >
          <div className="bg-sand relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-sm sm:w-36">
            <Image
              src={banner.imagePath}
              alt=""
              fill
              sizes="(min-width: 640px) 9rem, 100vw"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-ink truncate font-medium">{banner.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={banner.state === "live" ? "new" : "neutral"}>
                {STATE_LABEL[banner.state]}
              </Badge>
              {banner.subtitle && (
                <span className="text-small text-muted truncate">{banner.subtitle}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pending || index === 0}
              onClick={() => run(() => moveBannerAction(banner.id, "up"))}
              className="text-ink-soft hover:text-ink inline-flex size-11 items-center justify-center disabled:opacity-30"
            >
              <ArrowUp aria-hidden strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Move “{banner.title}” up</span>
            </button>
            <button
              type="button"
              disabled={pending || index === banners.length - 1}
              onClick={() => run(() => moveBannerAction(banner.id, "down"))}
              className="text-ink-soft hover:text-ink inline-flex size-11 items-center justify-center disabled:opacity-30"
            >
              <ArrowDown aria-hidden strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Move “{banner.title}” down</span>
            </button>
            <Link
              href={`/admin/homepage/banners/${banner.id}`}
              className="text-ink-soft hover:text-ink inline-flex size-11 items-center justify-center"
            >
              <Pencil aria-hidden strokeWidth={1.5} className="size-5" />
              <span className="sr-only">Edit “{banner.title}”</span>
            </Link>
            <ConfirmButton
              variant="ghost"
              disabled={pending}
              title={`Delete “${banner.title}”?`}
              description="The banner and its image are removed from the website. This can't be undone."
              onConfirm={() => run(() => deleteBannerAction(banner.id))}
            >
              Delete
            </ConfirmButton>
          </div>
        </li>
      ))}
    </ol>
  );
}
