import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Hind_Siliguri, Inter } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE } from "@/config/site";
import "@/styles/globals.css";

// 03 §2: self-hosted at build time by next/font, only the weights we use.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Bangla (ADR-089): journal titles and excerpts, marked lang="bn". Bengali subset only, so its
// unicode-range keeps it off Latin text; not preloaded, so it downloads only where Bangla shows.
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
  variable: "--font-hind",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL ?? "";
const mediaOrigin = mediaUrl ? new URL(mediaUrl).origin : null;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_TAGLINE,
};

export const viewport: Viewport = {
  themeColor: "#F8F6F2",
  // Lets fixed bottom UI (floating buttons, product bar) use env(safe-area-inset-bottom).
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${hindSiliguri.variable}`}>
      <head>
        {/* 08 §3: start the image CDN connection early (skipped while media is same-origin). */}
        {mediaOrigin && mediaOrigin !== new URL(siteUrl).origin && (
          <link rel="preconnect" href={mediaOrigin} crossOrigin="" />
        )}
      </head>
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
