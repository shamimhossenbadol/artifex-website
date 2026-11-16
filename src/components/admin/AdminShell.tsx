"use client";
// Admin chrome (07 §2, ADR-055): a fixed espresso sidebar on desktop that never scrolls (only the
// main area does), a drawer on mobile (native dialog opened with Invoker Commands, so it works
// before JS loads), and logout. No session reads here: pages call requireAdmin() inside their own
// Suspense boundary (Cache Components, ADR-030).
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useRef, type ReactNode } from "react";
import { logoutAction } from "@/server/actions/auth.actions";
import wordmark from "@/assets/brand/artifex-wordmark.svg";
import { cn } from "@/lib/utils";
import { AdminNav, AdminNavLinks, SIDEBAR_IDLE, SIDEBAR_ITEM } from "./AdminNav";
import { ToastProvider } from "./Toaster";

const DRAWER_ID = "admin-drawer";
const OPEN = { commandfor: DRAWER_ID, command: "show-modal" } as Record<string, string>;
const CLOSE = { commandfor: DRAWER_ID, command: "close" } as Record<string, string>;

function Brand() {
  return (
    <Link href="/admin" className="inline-flex items-center gap-3 rounded-md py-1">
      <Image src={wordmark} alt="Artifex Furniture" className="h-8 w-auto" priority />
      <span className="text-eyebrow border-gold/40 text-gold rounded-sm border px-1.5 py-0.5 text-[10px]">
        Admin
      </span>
    </Link>
  );
}

/** Sidebar body, shared by the desktop sidebar and the mobile drawer. */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <p className="text-eyebrow text-espresso-muted/70 mb-2 px-3 text-[10px]">Manage</p>
      <Suspense fallback={<AdminNavLinks pathname={null} onNavigate={onNavigate} />}>
        <AdminNav onNavigate={onNavigate} />
      </Suspense>
      <div className="border-espresso-line mt-auto flex flex-col gap-0.5 border-t pt-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(SIDEBAR_ITEM, SIDEBAR_IDLE)}
        >
          <ExternalLink aria-hidden strokeWidth={1.5} className="size-[18px] shrink-0" />
          View site
        </a>
        <form action={logoutAction}>
          <button type="submit" className={cn(SIDEBAR_ITEM, SIDEBAR_IDLE)}>
            <LogOut aria-hidden strokeWidth={1.5} className="size-[18px] shrink-0" />
            Log out
          </button>
        </form>
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const close = () => drawerRef.current?.close();

  return (
    <ToastProvider>
      {/* Desktop sidebar: fixed to the viewport, never scrolls. */}
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden px-4 pt-6 pb-4 lg:flex">
        <div className="mb-6 px-2">
          <Brand />
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="admin-sidebar shadow-card sticky top-0 z-30 flex h-14 items-center justify-between px-3 lg:hidden">
        <button
          type="button"
          {...OPEN}
          onClick={() => {
            if (!("command" in HTMLButtonElement.prototype)) drawerRef.current?.showModal();
          }}
          className="text-bg inline-flex size-11 items-center justify-center rounded-md"
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
        className="drawer admin-sidebar m-0 h-dvh max-h-none w-[min(18rem,85vw)] max-w-none px-4 pt-4 pb-4"
      >
        <div className="flex h-full flex-col">
          <div className="mb-6 flex items-center justify-between pl-2">
            <Brand />
            <button
              type="button"
              {...CLOSE}
              onClick={() => {
                if (!("command" in HTMLButtonElement.prototype)) close();
              }}
              className="text-bg inline-flex size-11 items-center justify-center rounded-md"
            >
              <X aria-hidden strokeWidth={1.5} className="size-6" />
              <span className="sr-only">Close admin menu</span>
            </button>
          </div>
          <SidebarContent onNavigate={close} />
        </div>
      </dialog>

      <main
        id="admin-main"
        className="min-w-0 px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10 xl:px-14"
      >
        <div className="mx-auto max-w-[78rem]">{children}</div>
      </main>
    </ToastProvider>
  );
}
