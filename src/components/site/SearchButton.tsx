"use client";
// Header search trigger. Uses Invoker Commands so the search dialog opens before JavaScript loads
// (ADR-024); the onClick fallback only acts in browsers without them.
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const SEARCH_DIALOG_ID = "search-dialog";

const OPEN_COMMAND = { commandfor: SEARCH_DIALOG_ID, command: "show-modal" } as Record<
  string,
  string
>;

export function SearchButton({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      {...OPEN_COMMAND}
      onClick={() => {
        if (typeof HTMLButtonElement !== "undefined" && "command" in HTMLButtonElement.prototype)
          return;
        (document.getElementById(SEARCH_DIALOG_ID) as HTMLDialogElement | null)?.showModal();
      }}
      aria-haspopup="dialog"
      aria-controls={SEARCH_DIALOG_ID}
      className={cn(
        "text-ink hover:text-walnut inline-flex size-11 items-center justify-center transition-colors",
        className,
      )}
    >
      <Search aria-hidden strokeWidth={1.5} className={cn("size-5", iconClassName)} />
      <span className="sr-only">Search</span>
    </button>
  );
}
