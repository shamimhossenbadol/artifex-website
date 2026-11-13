"use client";
// Counts page views and contact clicks for the admin dashboard (first-party, cookieless) and, when
// a Pixel ID is set, sends the same moments to Meta for ads (ADR-040). Renders nothing.
// Contact clicks are caught with one delegated listener, so every WhatsApp/Messenger/phone link on
// the site is covered without touching each button.
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { classifyContactLink, productSlugFromPath, type SiteEventType } from "@/lib/analytics";
import { disablePixel, enablePixel, pixelTrack } from "@/lib/meta-pixel";

function send(type: SiteEventType, path: string): void {
  const body = JSON.stringify({ type, path });
  try {
    if (navigator.sendBeacon?.("/api/track", body)) return;
    void fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => undefined);
  } catch {
    // Counting is best-effort.
  }
}

export function SiteTracker({ pixelId }: { pixelId: string | null }) {
  const pathname = usePathname();

  // Declared first so it runs before the page-view effect below.
  useEffect(() => {
    if (pixelId) enablePixel(pixelId);
    else disablePixel();
  }, [pixelId]);

  useEffect(() => {
    send("view", pathname);
    pixelTrack("PageView");
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button > 1) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const channel = classifyContactLink(link.getAttribute("href") ?? "");
      if (!channel) return;
      const path = window.location.pathname;
      send(channel, path);
      const slug = productSlugFromPath(path);
      pixelTrack("Contact", {
        content_category: channel,
        ...(slug ? { content_ids: [slug], content_type: "product" } : {}),
      });
    }
    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("auxclick", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("auxclick", onClick, { capture: true });
    };
  }, []);

  return null;
}

/** Product page: tells the pixel which product was viewed (for ad audiences). */
export function TrackProductView({
  slug,
  name,
  price,
}: {
  slug: string;
  name: string;
  price: number | null;
}) {
  useEffect(() => {
    pixelTrack("ViewContent", {
      content_ids: [slug],
      content_name: name,
      content_type: "product",
      ...(price !== null ? { value: price, currency: "BDT" } : {}),
    });
  }, [slug, name, price]);
  return null;
}

/** Search results page: tells the pixel what was searched for. */
export function TrackSearch({ query }: { query: string }) {
  useEffect(() => {
    pixelTrack("Search", { search_string: query });
  }, [query]);
  return null;
}
