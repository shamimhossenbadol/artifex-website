import type { ReactNode } from "react";

/** Page title + optional primary action (07 §2 top bar). */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-h2">{title}</h1>
        {description && <p className="text-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** White panel used for admin sections. */
export function AdminPanel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="border-line bg-surface rounded-md border p-5 sm:p-6">
      {title && <h2 className="text-ink mb-5 text-base font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
