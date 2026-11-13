import type { NextConfig } from "next";

// NEXT_PUBLIC_* values are inlined at build time, so they must be set where `next build` runs
// (CI secrets, or .env locally). Fallbacks keep `next build` working for local smoke builds only.
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
const mediaUrl = new URL(process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://localhost:3000");
const isDev = process.env.NODE_ENV !== "production";

// ADR-014: images live on the R2 media domain and are never served by the app. If the media URL
// is set to the site's own address, every uploaded photo 404s (and CSP would block the real media
// domain), so refuse to build rather than ship broken images. Unset values (local smoke builds) skip this.
if (
  process.env.NEXT_PUBLIC_SITE_URL &&
  process.env.NEXT_PUBLIC_MEDIA_URL &&
  mediaUrl.origin === siteUrl.origin
) {
  throw new Error(
    `NEXT_PUBLIC_MEDIA_URL (${mediaUrl.origin}) must be the R2 media domain, not the site URL. ` +
      "Set the GitHub repository variable NEXT_PUBLIC_MEDIA_URL to e.g. https://media.<domain>.",
  );
}

// 09 §7. 'unsafe-eval' is only needed by the dev server (React refresh), never in production.
// Meta Pixel hosts (ADR-040): its script, the image/beacon endpoint, and its event requests.
const META_SCRIPT = "https://connect.facebook.net";
const META_EVENTS = "https://www.facebook.com";
const contentSecurityPolicy = [
  "default-src 'self'",
  `img-src 'self' data: blob: ${mediaUrl.origin} ${META_EVENTS}`,
  `script-src 'self' 'unsafe-inline' ${META_SCRIPT}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "frame-src https://www.google.com",
  `connect-src 'self' ${META_EVENTS} ${META_SCRIPT}`,
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  // ADR-002: one self-contained server.js for Passenger; build off the server.
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // ADR-011 / 02 §6: "use cache" + cacheTag() with on-demand revalidation.
  cacheComponents: true,
  partialPrefetching: true,

  // ADR-005/014: images are pre-generated WebP variants on R2; no runtime optimisation.
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "11mb", // 10 MB image + multipart overhead (09 §6)
      allowedOrigins: [siteUrl.host],
    },
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
