"use client";
// Mobile menu drawer (05 §2). A native modal <dialog> gives focus trapping, Esc to close and an
// inert page behind it for free; we only add the backdrop click and closing on navigation.
// Open/close use Invoker Commands, so they work before hydration (ADR-024).
import { Menu, Phone, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { FacebookIcon } from "./SocialIcons";

export type MobileNavProps = {
  categories: { name: string; href: string; imagePath: string | null }[];
  companyLinks: readonly { label: string; href: string }[];
  phone: string | null;
  telHref: string | null;
  whatsappHref: string | null;
  facebookUrl: string | null;
};

const ROW = "flex min-h-11 items-center gap-3 py-2 text-ink";
const DIALOG_ID = "mobile-menu";

// Invoker Commands: the browser opens/closes the dialog itself, so the menu works the moment the
// HTML arrives, before any JavaScript has loaded (slow mobile networks). Lowercase attribute names
// are passed through to the DOM as-is; they aren't in React's types yet.
const OPEN_COMMAND = { commandfor: DIALOG_ID, command: "show-modal" } as Record<string, string>;
const CLOSE_COMMAND = { commandfor: DIALOG_ID, command: "close" } as Record<string, string>;

/** True when the browser handles `command`/`commandfor` natively (Chrome/Edge 135+, Firefox 144+, Safari 26.2+). */
function supportsInvokerCommands(): boolean {
  return typeof HTMLButtonElement !== "undefined" && "command" in HTMLButtonElement.prototype;
}

export function MobileNav({
  categories,
  companyLinks,
  phone,
  telHref,
  whatsappHref,
  facebookUrl,
}: MobileNavProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        {...OPEN_COMMAND}
        onClick={() => {
          // Fallback for older browsers; native command handling already opened it otherwise.
          if (!supportsInvokerCommands()) dialogRef.current?.showModal();
        }}
        aria-haspopup="dialog"
        aria-controls={DIALOG_ID}
        className="text-ink -ml-2 inline-flex size-11 items-center justify-center"
      >
        <Menu aria-hidden strokeWidth={1.5} className="size-6" />
        <span className="sr-only">Open menu</span>
      </button>

      <dialog
        id={DIALOG_ID}
        ref={dialogRef}
        aria-label="Menu"
        onClick={(event) => {
          // A click on the dialog element itself (not its content) is a click on the backdrop.
          if (event.target === event.currentTarget) close();
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

          {categories.length > 0 && (
            <nav aria-label="Categories" className="border-line border-b pb-4">
              <ul>
                {categories.map((category) => (
                  <li key={category.href}>
                    <Link href={category.href} onClick={close} className={ROW}>
                      <span className="bg-sand relative size-12 shrink-0 overflow-hidden">
                        {category.imagePath && (
                          <Image
                            src={category.imagePath}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="text-base font-medium">{category.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <nav aria-label="Company" className="border-line border-b py-4">
            <ul>
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={close} className={ROW}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="flex flex-col gap-1 pt-4">
            {phone && telHref && (
              <li>
                <a href={telHref} className={ROW}>
                  <Phone aria-hidden strokeWidth={1.5} className="text-walnut size-5" />
                  {phone}
                </a>
              </li>
            )}
            {whatsappHref && (
              <li>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={ROW}>
                  <WhatsAppIcon className="text-whatsapp-dark size-5" />
                  WhatsApp us
                </a>
              </li>
            )}
            {facebookUrl && (
              <li>
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className={ROW}>
                  <FacebookIcon className="text-walnut size-5" />
                  Facebook
                </a>
              </li>
            )}
          </ul>
        </div>
      </dialog>
    </>
  );
}
