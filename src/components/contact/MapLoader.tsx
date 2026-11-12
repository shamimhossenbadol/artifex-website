"use client";
// Google Map, loaded only on request (F5): the embed is ~500 KB of third-party code, so it never
// loads unless the visitor asks for it (ADR-028). Until then: a light placeholder with directions.
import { MapPin } from "lucide-react";
import { useState } from "react";

export function MapLoader({ embedUrl, title }: { embedUrl: string; title: string }) {
  const [show, setShow] = useState(false);
  if (show) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="border-line h-full min-h-80 w-full border-0"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setShow(true)}
      className="bg-sand text-ink hover:bg-line flex h-full min-h-80 w-full flex-col items-center justify-center gap-3 transition-colors"
    >
      <MapPin aria-hidden strokeWidth={1.5} className="text-walnut size-8" />
      <span className="font-medium">Tap to load the map</span>
      <span className="text-small text-muted">Loads Google Maps</span>
    </button>
  );
}
