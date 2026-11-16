import type { ReactNode } from "react";

/** Page title + optional primary action (07 §2 top bar), with a gold rule that draws in (ADR-055). */
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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 lg:mb-10">
      <div className="min-w-0">
        <span
          aria-hidden
          className="animate-admin-line bg-gold mb-4 block h-0.5 w-10 rounded-full"
        />
        <h1 className="text-h2 tracking-tight">{title}</h1>
        {description && <p className="text-muted mt-2 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** White panel used for admin sections. */
export function AdminPanel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="admin-card p-5 sm:p-6">
      {title && <h2 className="text-ink mb-5 text-[15px] font-semibold tracking-tight">{title}</h2>}
      {children}
    </section>
  );
}
