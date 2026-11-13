import Link from "next/link";

/** Shown on a product or post page opened with ?preview=1 by a signed-in admin. */
export function PreviewBanner({ editHref }: { editHref: string }) {
  return (
    <p
      role="status"
      className="border-walnut bg-sand text-ink mb-6 flex flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-3 text-sm"
    >
      <span>
        <strong>Preview.</strong> Only you can see this while it&apos;s a draft or hidden.
      </span>
      <Link href={editHref} className="font-medium underline underline-offset-4">
        Back to editing
      </Link>
    </p>
  );
}
