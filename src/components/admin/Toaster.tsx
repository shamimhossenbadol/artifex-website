"use client";
// Tiny toast system for admin feedback (07 §4): no library. Toasts are announced politely and
// disappear after 4 s.
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; kind: "success" | "error"; text: string };
type ToastApi = { success: (text: string) => void; error: (text: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>");
  return api;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (kind: Toast["kind"], text: string) => {
      const id = nextId++;
      setToasts((t) => [...t.slice(-2), { id, kind, text }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );
  const api = useMemo<ToastApi>(
    () => ({ success: (t) => push("success", t), error: (t) => push("error", t) }),
    [push],
  );

  return (
    <ToastContext value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className={cn(
              "animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md px-4 py-3 text-sm shadow-sm",
              toast.kind === "success" ? "bg-ink text-bg" : "bg-danger text-white",
            )}
          >
            {toast.kind === "success" ? (
              <CircleCheck aria-hidden strokeWidth={1.5} className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleAlert aria-hidden strokeWidth={1.5} className="mt-0.5 size-4 shrink-0" />
            )}
            <span className="flex-1">{toast.text}</span>
            <button type="button" onClick={() => dismiss(toast.id)} className="-m-1 p-1">
              <X aria-hidden strokeWidth={1.5} className="size-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
