import type { Metadata } from "next";
import { Manrope } from "next/font/google";

// Admin interface font (ADR-055). Loaded here, so public pages never download it.
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

// The admin is private: never indexed (07, 08 §1). proxy.ts also sends no-store + X-Robots-Tag.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Artifex" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className={`${manrope.variable} admin-root admin-canvas text-ink-soft min-h-dvh text-sm`}>
      {children}
    </div>
  );
}
