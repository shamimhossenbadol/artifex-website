import { Suspense, type ReactNode } from "react";
import { Footer, FooterFallback } from "./Footer";
import { Header, HeaderFallback } from "./Header";
import { WhatsAppFab } from "./WhatsAppFab";

export const MAIN_CONTENT_ID = "main-content";

/**
 * Public page chrome: skip link, header, main landmark, footer and the floating WhatsApp button.
 * The data-backed parts stream in at request time from the in-memory cache (ADR-020).
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="bg-ink text-bg sr-only z-50 px-4 py-3 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Suspense fallback={<FooterFallback />}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <WhatsAppFab />
      </Suspense>
    </>
  );
}
