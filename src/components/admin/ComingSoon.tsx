import { Hammer } from "lucide-react";
import { AdminPageHeader, AdminPanel } from "./AdminPageHeader";

/** Temporary page for admin sections still being built (Phase 7 milestones 7b–7e). */
export function ComingSoon({ title, milestone }: { title: string; milestone: string }) {
  return (
    <>
      <AdminPageHeader title={title} />
      <AdminPanel>
        <div className="flex items-start gap-3">
          <Hammer aria-hidden strokeWidth={1.5} className="text-walnut mt-0.5 size-5 shrink-0" />
          <p>
            This section is being built and arrives in the next update ({milestone}). Everything
            else on your site keeps working in the meantime.
          </p>
        </div>
      </AdminPanel>
    </>
  );
}
