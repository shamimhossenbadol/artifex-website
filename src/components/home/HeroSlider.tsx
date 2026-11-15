"use client";
// Homepage hero slider (ADR-039, ADR-048). Plays on its own in an endless loop: a slow crossfade
// with a gentle zoom on the photo being shown. Visitors can swipe or pick a photo with the dots.
// It pauses while hovered or focused and while the tab is hidden, and doesn't play at all for
// people who ask for reduced motion (no pause button, owner's choice).
//
// Phones (ADR-051): a short photo band with the heading and description over it and the dots at
// its foot; the buttons (`actions`) sit below it on ivory. From md the photos fill the whole hero
// behind the text and buttons. The first photo is the LCP image: preloaded and never faded in;
// other photos load when they're shown or next in line.
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
  actions,
}: {
  slides: Slide[];
  className: string;
  labelledBy: string;
  /** Heading and description: over the photo on every size. */
  children: ReactNode;
  /** Buttons: below the photo band on phones, under the text over the photo from md. */
  actions?: ReactNode;
}) {
  const count = slides.length;
  const [current, setCurrent] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0]));
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

  const playing = count > 1 && !held && !reducedMotion;

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
      {/* Phones: the band, photos behind the text. md+: static, so the photos cover the hero. */}
      <div className="relative isolate flex min-h-[60vw] flex-col justify-end md:static md:isolation-auto md:block md:min-h-0">
        <div className="absolute inset-0 -z-10 overflow-hidden">
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
                    className={cn(
                      // Slow zoom by transition, not keyframes: the outgoing photo keeps its zoom
                      // while it fades out and only resets once hidden (after the 1.2 s fade).
                      "object-cover motion-reduce:scale-100 motion-reduce:transition-none",
                      active && !reducedMotion && count > 1
                        ? "scale-[1.06] transition-transform delay-0 duration-[7000ms] ease-out"
                        : "scale-100 transition-transform delay-[1300ms] duration-0",
                    )}
                  />
                )}
              </div>
            );
          })}
          {/* Solid scrim (no gradient outside category tiles, 03 §6) for legible text. */}
          <div aria-hidden className="bg-ink/45 md:bg-ink/35 absolute inset-0" />
          {count > 1 && (
            <div
              role="group"
              aria-label="Hero photos"
              className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center md:bottom-4"
            >
              <ol className="flex items-center">
                {slides.map((slide, index) => (
                  <li key={slide.path}>
                    <button
                      type="button"
                      onClick={() => pick(index)}
                      aria-current={index === current ? "true" : undefined}
                      // Phones: closely spaced dots, each target still at least 24 × 32 px (WCAG 2.5.8).
                      className="group inline-flex h-8 min-w-6 items-center justify-center px-[9px] md:size-11 md:px-0"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "block h-1.5 rounded-full transition-all duration-500 ease-out",
                          index === current ? "bg-bg w-6" : "bg-bg/55 group-hover:bg-bg/85 w-1.5",
                        )}
                      />
                      <span className="sr-only">Show photo {index + 1}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
        {children}
      </div>

      {actions}
    </section>
  );
}
