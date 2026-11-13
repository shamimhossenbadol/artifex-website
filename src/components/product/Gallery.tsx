"use client";
// Product gallery (F1.5, 03 §5): CSS scroll-snap swipe on mobile, thumbnails (below on mobile, a
// vertical strip on desktop), and a native <dialog> fullscreen viewer with arrow keys + Esc.
// No carousel library; the first image is preloaded (LCP), the rest are lazy.
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ImagePlaceholder } from "./ImagePlaceholder";

export type GalleryImage = { id: number; path: string; alt: string; width: number; height: number };

const MAIN_SIZES = "(min-width:1024px) 58vw, 100vw";

export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDialogElement>(null);
  const count = images.length;

  const goTo = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const next = (index + count) % count;
      setActive(next);
      const scroller = scrollerRef.current;
      if (scroller) scroller.scrollTo({ left: next * scroller.clientWidth, behavior });
    },
    [count],
  );

  // Keep the active index in sync when the user swipes the strip.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || count < 2) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setActive(Math.round(scroller.scrollLeft / Math.max(1, scroller.clientWidth)));
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [count]);

  if (count === 0) {
    return (
      <div className="-mx-4 aspect-square sm:-mx-6 lg:mx-0 lg:aspect-[4/3]">
        <ImagePlaceholder />
      </div>
    );
  }

  const current = images[active] ?? images[0]!;

  return (
    <div className="lg:grid lg:grid-cols-[5.5rem_1fr] lg:gap-4">
      {/* Main image strip */}
      <div className="relative -mx-4 sm:-mx-6 lg:order-2 lg:mx-0">
        <div
          ref={scrollerRef}
          className="relative flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto lg:overflow-hidden [&::-webkit-scrollbar]:hidden"
          aria-roledescription="carousel"
          aria-label={`${title} photos`}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className="bg-sand relative aspect-square w-full shrink-0 snap-center lg:aspect-[4/3]"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
            >
              <Image
                src={image.path}
                alt={image.alt}
                fill
                sizes={MAIN_SIZES}
                preload={index === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => viewerRef.current?.showModal()}
          className="bg-bg/90 text-ink absolute right-4 bottom-4 inline-flex size-11 items-center justify-center rounded-full sm:right-6 lg:right-4"
        >
          <Expand aria-hidden strokeWidth={1.5} className="size-5" />
          <span className="sr-only">View image fullscreen</span>
        </button>
        {count > 1 && (
          <p className="bg-bg/90 text-small text-ink absolute bottom-4 left-4 rounded-sm px-2 py-1 tabular-nums sm:left-6 lg:hidden">
            {active + 1} / {count}
          </p>
        )}
      </div>

      {/* Thumbnails: row below on mobile, vertical strip on desktop */}
      {count > 1 && (
        <ul className="relative mt-3 flex gap-2 overflow-x-auto lg:order-1 lg:mt-0 lg:flex-col lg:overflow-visible">
          {images.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={`View image ${index + 1} of ${count}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "bg-sand relative block aspect-square w-16 overflow-hidden border transition-colors lg:w-full",
                  index === active ? "border-ink" : "hover:border-line border-transparent",
                )}
              >
                <Image src={image.path} alt="" fill sizes="88px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Fullscreen viewer */}
      <dialog
        ref={viewerRef}
        aria-label={`${title}, image ${active + 1} of ${count}`}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") goTo(active + 1, "instant");
          if (event.key === "ArrowLeft") goTo(active - 1, "instant");
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) viewerRef.current?.close();
        }}
        className="bg-ink backdrop:bg-ink m-0 h-dvh max-h-none w-screen max-w-none p-0"
      >
        <div className="relative h-full w-full">
          <Image
            key={current.id}
            src={current.path}
            alt={current.alt}
            fill
            sizes="100vw"
            className="object-contain"
          />
          <button
            type="button"
            onClick={() => viewerRef.current?.close()}
            className="bg-bg text-ink absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full"
          >
            <X aria-hidden strokeWidth={1.5} className="size-5" />
            <span className="sr-only">Close</span>
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(active - 1, "instant")}
                className="bg-bg text-ink absolute top-1/2 left-4 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full"
              >
                <ChevronLeft aria-hidden strokeWidth={1.5} className="size-5" />
                <span className="sr-only">Previous image</span>
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1, "instant")}
                className="bg-bg text-ink absolute top-1/2 right-4 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full"
              >
                <ChevronRight aria-hidden strokeWidth={1.5} className="size-5" />
                <span className="sr-only">Next image</span>
              </button>
              <p className="text-small bg-bg text-ink absolute bottom-4 left-1/2 -translate-x-1/2 rounded-sm px-2 py-1 tabular-nums">
                {active + 1} / {count}
              </p>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
