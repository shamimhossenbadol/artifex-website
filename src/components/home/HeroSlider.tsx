"use client";
// Homepage hero slider (ADR-039, ADR-048). Plays on its own in an endless loop: a slow crossfade
// with a gentle zoom on the photo being shown. Visitors can swipe, pick a photo with the dots, or
// pause (WCAG 2.2.2). It pauses while hovered or focused, while the tab is hidden, and doesn't play
// at all for people who ask for reduced motion.
//
// Layout: phones show the photo as a wide band, the dots under it, then the heading and buttons (a tall crop
// of a landscape photo hides the furniture); from md the photo fills the hero with the text on top.
// The first photo is the LCP image: preloaded and never faded in; other photos load when they're
// shown or next in line.
import { Pause, Play } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Slide = { path: string; alt: string };

const SWIPE_PX = 40;
/** How long each photo stays before the next one fades in. */
export const HERO_SLIDE_MS = 6000;

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const [paused, setPaused] = useState(false); // the visitor pressed pause
  const [held, setHeld] = useState(false); // hovered or focused
  const [cycle, setCycle] = useState(0); // restarts the timer after a manual change
  const touchX = useRef<number | null>(null);
  // Server render: assume motion is allowed; the browser value takes over after hydration.
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false,
  );

  const show = useCallback(
    (index: number) => {
      const next = (index + count) % count;
      setCurrent(next);
      setSeen((s) => (s.has(next) ? s : new Set(s).add(next)));
    },
    [count],
  );

  const playing = count > 1 && !paused && !held && !reducedMotion;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      // Don't advance in a background tab; try again on the next tick.
      if (document.hidden) setCycle((c) => c + 1);
      else show(current + 1);
    }, HERO_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [playing, current, cycle, show]);

  function pick(index: number) {
    show(index);
    setCycle((c) => c + 1);
  }

  const upNext = (current + 1) % count;

  return (
    <section
      aria-labelledby={labelledBy}
      aria-roledescription="carousel"
      className={className}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (count < 2 || start === null || end === undefined) return;
        if (end - start > SWIPE_PX) pick(current - 1);
        else if (start - end > SWIPE_PX) pick(current + 1);
      }}
    >
      {/* Photos: a wide band on phones; behind the text from md. */}
      <div className="bg-sand relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] md:absolute md:inset-0 md:-z-10 md:aspect-auto">
        {slides.map((slide, index) => {
          const active = index === current;
          return (
            <div
              key={slide.path}
              aria-hidden={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-[1200ms] ease-in-out motion-reduce:transition-none",
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
                  className={cn("object-cover", active && playing && "animate-hero-zoom")}
                />
              )}
            </div>
          );
        })}
        {/* Solid scrim for legible text, only where the text sits on the photo (md+). */}
        <div aria-hidden className="bg-ink/35 absolute inset-0 hidden md:block" />
      </div>
      {count > 1 && (
        <div
          role="group"
          aria-label="Hero photos"
          className="flex items-center justify-center md:absolute md:right-8 md:bottom-8"
        >
          <ol className="flex items-center">
            {slides.map((slide, index) => (
              <li key={slide.path}>
                <button
                  type="button"
                  onClick={() => pick(index)}
                  aria-current={index === current ? "true" : undefined}
                  className="group inline-flex size-11 items-center justify-center"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "block h-1.5 rounded-full transition-all duration-500 ease-out",
                      index === current
                        ? "bg-ink md:bg-bg w-6"
                        : "bg-ink/25 group-hover:bg-ink/50 md:bg-bg/55 md:group-hover:bg-bg/85 w-1.5",
                    )}
                  />
                  <span className="sr-only">Show photo {index + 1}</span>
                </button>
              </li>
            ))}
          </ol>
          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              className="text-ink-soft hover:text-ink md:text-bg/90 md:hover:text-bg inline-flex size-11 items-center justify-center"
            >
              {paused ? (
                <Play aria-hidden strokeWidth={1.5} className="size-4" />
              ) : (
                <Pause aria-hidden strokeWidth={1.5} className="size-4" />
              )}
              <span className="sr-only">{paused ? "Play slideshow" : "Pause slideshow"}</span>
            </button>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
