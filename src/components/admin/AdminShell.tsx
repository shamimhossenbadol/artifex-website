"use client";
// Admin chrome (07 §2): sidebar on desktop, a drawer on mobile (native dialog opened with Invoker
// Commands, so it works before JS loads), and logout. No session reads here: pages call
// requireAdmin() inside their own Suspense boundary (Cache Components, ADR-030).
import { LogOut, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useRef, type ReactNode } from "react";
import { logoutAction } from "@/server/actions/auth.actions";
import wordmark from "@/assets/brand/artifex-wordmark.svg";
import { AdminNav, AdminNavLinks } from "./AdminNav";
import { ToastProvider } from "./Toaster";

const DRAWER_ID = "admin-drawer";
const OPEN = { commandfor: DRAWER_ID, command: "show-modal" } as Record<string, string>;
const CLOSE = { commandfor: DRAWER_ID, command: "close" } as Record<string, string>;

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="text-ink-soft hover:bg-sand hover:text-ink flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors"
      >
        <LogOut aria-hidden strokeWidth={1.5} className="size-5" />
        Log out
      </button>
    </form>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="inline-flex items-center gap-2 py-1">
      <Image src={wordmark} alt="Artifex Furniture" className="h-8 w-auto" />
      <span className="text-eyebrow text-muted">Admin</span>
    </Link>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const close = () => drawerRef.current?.close();

  return (
    <ToastProvider>
      <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="border-line bg-surface hidden border-r lg:flex lg:flex-col lg:gap-6 lg:p-4">
          <Brand />
          <Suspense fallback={<AdminNavLinks pathname={null} />}>
            <AdminNav />
          </Suspense>
          <div className="mt-auto">
            <LogoutButton />
          </div>
        </aside>

        {/* Mobile top bar + drawer */}
        <div className="border-line bg-surface sticky top-0 z-30 flex h-14 items-center justify-between border-b px-3 lg:hidden">
          <button
            type="button"
            {...OPEN}
            onClick={() => {
              if (!("command" in HTMLButtonElement.prototype)) drawerRef.current?.showModal();
            }}
            className="text-ink inline-flex size-11 items-center justify-center"
          >
            <Menu aria-hidden strokeWidth={1.5} className="size-6" />
            <span className="sr-only">Open admin menu</span>
          </button>
          <Brand />
          <span className="size-11" aria-hidden />
        </div>
        <dialog
          id={DRAWER_ID}
          ref={drawerRef}
          aria-label="Admin menu"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          className="drawer bg-surface backdrop:bg-ink/40 m-0 h-dvh max-h-none w-[min(18rem,85vw)] max-w-none p-4"
        >
          <div className="flex h-full flex-col gap-6">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                {...CLOSE}
                onClick={() => {
                  if (!("command" in HTMLButtonElement.prototype)) close();
                }}
                className="text-ink inline-flex size-11 items-center justify-center"
              >
                <X aria-hidden strokeWidth={1.5} className="size-6" />
                <span className="sr-only">Close admin menu</span>
              </button>
            </div>
            <Suspense fallback={<AdminNavLinks pathname={null} onNavigate={close} />}>
              <AdminNav onNavigate={close} />
            </Suspense>
            <div className="mt-auto">
              <LogoutButton />
            </div>
          </div>
        </dialog>

        <main id="admin-main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
