import { CircleAlert, CircleCheck } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

/** Form-level result, announced to screen readers (05 §5). */
export function FormMessage({ state }: { state: ActionResult | null }) {
  if (!state) return <div aria-live="polite" />;
  const text = state.ok ? state.message : state.error;
  if (!text) return <div aria-live="polite" />;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-md border px-4 py-3 text-sm",
        state.ok
          ? "border-success/30 bg-success/10 text-success"
          : "border-danger/30 bg-danger/10 text-danger",
      )}
    >
      {state.ok ? (
        <CircleCheck aria-hidden strokeWidth={1.5} className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CircleAlert aria-hidden strokeWidth={1.5} className="mt-0.5 size-4 shrink-0" />
      )}
      {text}
    </div>
  );
}

/** First error for a field, for <Field error={…}>. */
export function fieldError(state: ActionResult | null, name: string): string | undefined {
  return state && !state.ok ? state.fieldErrors?.[name]?.[0] : undefined;
}
