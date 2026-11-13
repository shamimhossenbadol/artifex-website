// Meta (Facebook) Pixel for ads (ADR-040). Browser-only. The admin enters just the numeric Pixel
// ID; this module writes the standard loader itself, so no pasted script ever reaches the page
// (AGENTS rule 6). Events fired before the tracker has decided (child effects run first) are
// queued, then sent once the pixel is on, or dropped when no ID is set.

type PixelParams = Record<string, string | number | string[]>;
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export const PIXEL_SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";

/** Pixel IDs are 15–16 digits today; allow a little room either way. */
export const PIXEL_ID_PATTERN = /^\d{10,20}$/;

let state: "pending" | "on" | "off" = "pending";
let queued: [string, PixelParams | undefined][] = [];
let installedId: string | null = null;

/** Sends a standard event (PageView, ViewContent, Search, Contact…) when the pixel is on. */
export function pixelTrack(event: string, params?: PixelParams): void {
  if (state === "off") return;
  if (state === "pending" || !window.fbq) {
    queued.push([event, params]);
    return;
  }
  if (params) window.fbq("track", event, params);
  else window.fbq("track", event);
}

/** The fbq stub from Meta's snippet: calls queue up until fbevents.js loads. */
function installStub(): Fbq {
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq ??= fbq;
  return fbq;
}

/** Loads fbevents.js once the page is idle, so the pixel never competes with the page itself. */
function loadScriptWhenIdle(): void {
  const load = () => {
    if (document.querySelector(`script[src="${PIXEL_SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = PIXEL_SCRIPT_SRC;
    document.head.appendChild(script);
  };
  const idle = () =>
    "requestIdleCallback" in window ? window.requestIdleCallback(load) : setTimeout(load, 1);
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}

export function enablePixel(pixelId: string): void {
  if (!PIXEL_ID_PATTERN.test(pixelId)) {
    disablePixel();
    return;
  }
  if (installedId !== pixelId) {
    const fbq = window.fbq ?? installStub();
    fbq("init", pixelId);
    installedId = pixelId;
    loadScriptWhenIdle();
  }
  state = "on";
  const events = queued;
  queued = [];
  for (const [event, params] of events) pixelTrack(event, params);
}

export function disablePixel(): void {
  state = "off";
  queued = [];
}
