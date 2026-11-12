import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Admin panel layout. The shell renders without reading the session; each page calls
 * requireAdmin() inside this Suspense boundary (reading cookies outside one is a build error with
 * Cache Components, ADR-030).
 */
export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminShell>
      <Suspense
        fallback={
          <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-4">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        {children}
      </Suspense>
    </AdminShell>
  );
}
