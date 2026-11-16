import type { ReactNode } from "react";

/**
 * Slim sticky bar at the top of an edit page (ADR-059): breadcrumbs (or other context) on the left,
 * and a slot on the right where an AdminForm with `submitSlot={slotId}` shows its Save button, so
 * Save stays in view while the admin scrolls a long form. Sits under the mobile admin top bar.
 */
export function AdminSaveBar({ slotId, children }: { slotId: string; children?: ReactNode }) {
  return (
    <div className="border-line bg-bg/85 sticky top-14 z-20 -mx-4 mb-6 flex min-h-16 items-center justify-between gap-4 border-b px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10 xl:-mx-14 xl:px-14">
      <div className="min-w-0 [&_nav]:mb-0">{children}</div>
      <div id={slotId} className="flex shrink-0 items-center gap-3" />
    </div>
  );
}
