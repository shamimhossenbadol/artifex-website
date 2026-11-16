"use client";
// Publish/unpublish switch on the product list (ADR-056): changes the status without opening the
// edit form. Optimistic: the switch flips at once and goes back if the save fails.
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";
import { setProductStatusAction } from "@/server/actions/product.actions";
import { useToast } from "../Toaster";

type Status = "DRAFT" | "PUBLISHED";

export function ProductStatusToggle({
  id,
  title,
  status,
}: {
  id: number;
  title: string;
  status: Status;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(status);
  const on = shown === "PUBLISHED";

  function toggle() {
    const next: Status = on ? "DRAFT" : "PUBLISHED";
    startTransition(async () => {
      setShown(next);
      try {
        const result = await setProductStatusAction(id, next);
        if (!result.ok) toast.error(result.error);
        else toast.success(result.message ?? "Saved.");
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`Published: “${title}”`}
      disabled={pending}
      onClick={toggle}
      className="group inline-flex min-h-11 items-center gap-2.5 rounded-md pr-1 disabled:cursor-wait"
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-300",
          on ? "border-espresso bg-espresso" : "border-line bg-sand group-hover:border-muted",
        )}
      >
        <span
          className={cn(
            "bg-surface shadow-card absolute left-0.5 size-[18px] rounded-full transition-transform duration-300 ease-out",
            on && "bg-gold translate-x-5",
            pending && "animate-pulse",
          )}
        />
      </span>
      <span
        aria-hidden
        className={cn(
          "tracking-badge w-16 text-left text-[11px] font-semibold uppercase transition-colors",
          on ? "text-ink" : "text-muted",
        )}
      >
        {on ? "Published" : "Draft"}
      </span>
    </button>
  );
}
