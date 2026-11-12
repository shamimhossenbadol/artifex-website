"use client";
// "Open now / Closed now" (F5). Computed in the browser in Asia/Dhaka time, so a cached page never
// shows a stale status; refreshes every minute. Renders nothing on the server or if hours are unclear.
import { useSyncExternalStore } from "react";
import { getOpenStatus } from "@/lib/opening-hours";
import { cn } from "@/lib/utils";
import type { OpeningHoursEntry } from "@/lib/validation/settings";

function subscribe(onChange: () => void): () => void {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

export function OpeningStatus({ hours }: { hours: OpeningHoursEntry[] }) {
  const minute = useSyncExternalStore(subscribe, currentMinute, serverMinute);
  if (minute === null) return null;
  const status = getOpenStatus(hours, new Date(minute * 60_000));
  if (!status) return null;
  return (
    <p className="text-small inline-flex items-center gap-2 font-medium">
      <span
        aria-hidden
        className={cn("size-2 rounded-full", status.open ? "bg-success" : "bg-muted")}
      />
      <span className={status.open ? "text-success" : "text-ink-soft"}>{status.label}</span>
    </p>
  );
}
