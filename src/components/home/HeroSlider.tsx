"use client";
// Hero background slider (ADR-039). Visitor-driven only: arrows, dots, swipe and the keyboard (no
// autoplay, 05 §1). The heading and buttons are server-rendered children that stay put while the
// photo behind them changes. The first photo is the LCP image: preloaded and never faded in; a
// slide's photo is loaded only once it is shown or is next in line.
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Slide = { path: string; alt: string };

const SWIPE_PX = 40;

const ARROW =
  "bg-bg/90 text-ink hover:bg-bg inline-flex size-11 items-center justify-center rounded-full transition-colors duration-200 ease-out";

export function HeroSlider({
  slides,
  className,
  labelledBy,
  children,
}: {
  slides: Slide[];
  className: string;
  labelledBy: string;
  children: ReactNode;
}) {
  const count = slides.length;
  const [current, setCurrent] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0]));
  const touchX = useRef<number | null>(null);

  function show(index: number) {
    const next = (index + count) % count;
    setCurrent(next);
    setSeen((s) => (s.has(next) ? s : new Set(s).add(next)));
  }

  const upNext = (current + 1) % count;

  return (
    <section
      aria-labelledby={labelledBy}
      className={className}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (count < 2 || start === null || end === undefined) return;
        if (end - start > SWIPE_PX) show(current - 1);
        else if (start - end > SWIPE_PX) show(current + 1);
      }}
    >
      <div className="absolute inset-0 -z-10">
        {slides.map((slide, index) => {
          const active = index === current;
          return (
            <div
              key={slide.path}
              aria-hidden={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:transition-none",
                active ? "opacity-100" : "opacity-0",
              )}
            >
              {(seen.has(index) || index === upNext) && (
                <Image
                  src={slide.path}
                  alt={active ? slide.alt : ""}
                  fill
                  preload={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              )}
            </div>
          );
        })}
        {/* Solid scrim (no gradient outside category tiles, 03 §6) for legible text. */}
        <div aria-hidden className="bg-ink/35 absolute inset-0" />
      </div>

      {children}

      {count > 1 && (
        <div
          role="group"
          aria-label="Hero photos"
          className="absolute right-4 bottom-4 flex items-center gap-1 sm:right-6 md:right-8 md:bottom-8"
        >
          <button type="button" onClick={() => show(current - 1)} className={ARROW}>
            <ChevronLeft aria-hidden strokeWidth={1.5} className="size-5" />
            <span className="sr-only">Previous photo</span>
          </button>
          <p
            aria-live="polite"
            className="bg-bg/90 text-small text-ink rounded-sm px-2 py-1 tabular-nums sm:sr-only"
          >
            <span className="sr-only">Photo </span>
            {current + 1}
            <span aria-hidden> / </span>
            <span className="sr-only"> of </span>
            {count}
          </p>
          <ol className="hidden items-center sm:flex">
            {slides.map((slide, index) => (
              <li key={slide.path}>
                <button
                  type="button"
                  onClick={() => show(index)}
                  aria-current={index === current ? "true" : undefined}
                  className="group inline-flex size-11 items-center justify-center"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "block size-2 rounded-full transition-colors duration-200 ease-out",
                      index === current ? "bg-bg" : "bg-bg/45 group-hover:bg-bg/80",
                    )}
                  />
                  <span className="sr-only">Show photo {index + 1}</span>
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => show(current + 1)} className={ARROW}>
            <ChevronRight aria-hidden strokeWidth={1.5} className="size-5" />
            <span className="sr-only">Next photo</span>
          </button>
        </div>
      )}
    </section>
  );
}
