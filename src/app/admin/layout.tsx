import type { Metadata } from "next";

// The admin is private: never indexed (07, 08 §1). proxy.ts also sends no-store + X-Robots-Tag.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Artifex" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="bg-bg text-ink-soft min-h-dvh text-sm">{children}</div>;
}
