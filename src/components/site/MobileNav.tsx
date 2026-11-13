"use client";
// Mobile menu (05 §2). A native modal <dialog> gives focus trapping, Esc to close and an inert page
// behind it for free; we only add the backdrop click and closing when a link is followed.
// Open/close use Invoker Commands, so they work before hydration (ADR-024).
//
// The drawer is rendered once by SiteShell, *outside* the header's Suspense boundary (ADR-043):
// when the streamed header replaced its fallback, a drawer opened during that moment used to be
// removed from the page. Now only the button lives in the header; the drawer's data-backed links
// stream into it (see MobileMenuContent) without closing it.
import { Menu, X } from "lucide-react";
import { useRef, type ReactNode } from "react";

export const MOBILE_MENU_ID = "mobile-menu";

// Invoker Commands: the browser opens/closes the dialog itself, so the menu works the moment the
// HTML arrives, before any JavaScript has loaded (slow mobile networks). Lowercase attribute names
// are passed through to the DOM as-is; they aren't in React's types yet.
const OPEN_COMMAND = { commandfor: MOBILE_MENU_ID, command: "show-modal" } as Record<
  string,
  string
>;
const CLOSE_COMMAND = { commandfor: MOBILE_MENU_ID, command: "close" } as Record<string, string>;

/** True when the browser handles `command`/`commandfor` natively (Chrome/Edge 135+, Firefox 144+, Safari 26.2+). */
function supportsInvokerCommands(): boolean {
  return typeof HTMLButtonElement !== "undefined" && "command" in HTMLButtonElement.prototype;
}

function menuDialog(): HTMLDialogElement | null {
  return document.getElementById(MOBILE_MENU_ID) as HTMLDialogElement | null;
}

/** Header button that opens the drawer. */
export function MobileMenuButton() {
  return (
    <button
      type="button"
      {...OPEN_COMMAND}
      onClick={() => {
        // Fallback for older browsers; native command handling already opened it otherwise.
        if (!supportsInvokerCommands()) menuDialog()?.showModal();
      }}
      aria-haspopup="dialog"
      aria-controls={MOBILE_MENU_ID}
      className="text-ink -ml-2 inline-flex size-11 items-center justify-center"
    >
      <Menu aria-hidden strokeWidth={1.5} className="size-6" />
      <span className="sr-only">Open menu</span>
    </button>
  );
}

/** The drawer itself; `children` are the menu's links (streamed in by SiteShell). */
export function MobileMenu({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <dialog
      id={MOBILE_MENU_ID}
      ref={dialogRef}
      aria-label="Menu"
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a click on the backdrop;
        // following any link inside closes the menu too.
        const target = event.target as Element;
        if (target === event.currentTarget || target.closest("a[href]")) close();
      }}
      className="drawer bg-bg text-ink-soft backdrop:bg-ink/40 m-0 h-dvh max-h-none w-[min(22rem,88vw)] max-w-none p-0"
    >
      <div className="flex h-full flex-col overflow-y-auto px-5 pb-8">
        <div className="bg-bg sticky top-0 flex h-16 items-center justify-between">
          <p className="text-eyebrow text-muted">Menu</p>
          <button
            type="button"
            {...CLOSE_COMMAND}
            onClick={() => {
              if (!supportsInvokerCommands()) close();
            }}
            className="text-ink -mr-2 inline-flex size-11 items-center justify-center"
          >
            <X aria-hidden strokeWidth={1.5} className="size-6" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
