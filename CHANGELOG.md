# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Fixed
- 2026-11-13 — Admin: opening a product edit page right after creating it (and other in-admin navigation to forms) could show "Something went wrong"; form labels now always reach their fields, including the Category and Status dropdowns (ADR-038). CI is green again.
- 2026-11-13 — Homepage hero/banner photos didn't show after upload: the build pointed image URLs at the site instead of the media domain (a GitHub variable). Builds now stop with a clear error when `NEXT_PUBLIC_MEDIA_URL` equals the site URL.
- 2026-11-13 — Deploy bundle: image processing (sharp) now ships with its native libraries, so admin image uploads work on the server (ADR-032).
- 2026-11-13 — Search: words typed into the search box while the page is still loading on a slow connection now show suggestions as soon as loading finishes.
- 2026-11-12 — Mobile menu now opens instantly, even before the page's JavaScript has loaded on slow connections (ADR-024).
- 2026-11-12 — Test site showed a blank white page after the Phase 2 deploy: the deploy bundle was missing Turbopack's Prisma alias. Packaging now recreates and verifies it, CI boots the real bundle, and the deploy health check requires a complete page (ADR-023).

### Changed
- 2026-11-13 — Header: always compact (64 px with a 40 px logo, bottom border) instead of shrinking and growing while scrolling; the small scroll script was removed.
- 2026-11-13 — Cleanup (ADR-042): the unused "Featured" product tick and "Homepage order" field were removed from the admin and the database (they no longer affected the website); "Popular" now explains that it ranks search results and related products. Dead code and stale comments removed. Footer shows "Developed by Shamim Hossen Badol", linked to WhatsApp.
- 2026-11-13 — Product photos: up to 5 per product, 1 main photo (cards, listings, sharing) and up to 4 gallery photos shown only on the product page; the admin now says "main photo" instead of "featured" (ADR-041).
- 2026-11-13 — Homepage "Our story" section is more compact: a smaller logo panel (narrower column, shorter shape) and less padding.
- 2026-11-13 — Homepage hero: up to 5 background photos that visitors move through with arrows, dots or a swipe (no autoplay); the hero is about a quarter shorter. Admin → Homepage has a new "Hero photos" section that works like product photos, so hero photos can now be deleted (their files are removed from R2 too); an already-uploaded hero photo becomes the first slide (ADR-039).
- 2026-11-13 — Layout (ADR-035): Journal, About and Contact moved into the header (Chairs removed from it); compact footer (logo, description, social icons, address, phone, WhatsApp); Messenger floating button above WhatsApp; homepage shows "Collections" and "New arrivals" headings only, without the Featured and Most loved rails; the help band heading fits on one line; product photos are square on cards and less tall on product pages.
- 2026-11-13 — Contact page: "Get directions" opens Google Maps directions to the Artifex Furniture place; new "Message us on Facebook" link (Messenger); removed the "Times are Dhaka time." note.
- 2026-11-12 — Opening hours set to every day, 10:00 AM – 10:00 PM, shown in 12-hour format; the contact page map now shows the showroom (tap to load).
- 2026-11-12 — Product range: Doors and Tables removed, Chandeliers added (ADR-026).
- 2026-11-12 — Header simplified to a single row with the logo (no top utility bar); Journal/About/Contact remain in the footer and mobile menu.
- 2026-11-12 — Hosting plan confirmed as **Namecheap Stellar**. Deploys will run from **GitHub Actions over SSH** (ADR-016); deployment guide §5.1 added.
- 2026-11-10 — Runtime pinned to **Node.js 24 LTS** on cPanel and on build machines (ADR-015).
- 2026-11-10 — Image storage moved from local disk to **Cloudflare R2** served at `media.<domain>` (ADR-014). Docs updated: architecture, database, SEO, security, deployment, roadmap, and testing.

### Added
- 2026-11-13 — Admin dashboard "Visitors & inquiries": visitors, page and product views, WhatsApp/Messenger/call taps, inquiry rate, most viewed and most inquired products and top pages for the last 7, 30 or 90 days, compared with the period before. Counted by the website itself without cookies; the owner's own visits aren't counted (ADR-040).
- 2026-11-13 — Facebook (Meta) Pixel: enter the Pixel ID under Settings → Tracking and the site sends PageView, ViewContent (products), Search and Contact (WhatsApp/Messenger/call taps) to Meta for ads (ADR-040).
- 2026-11-13 — Phase 8: draft preview for admins ("Preview" on the edit page of a draft product or post), `sitemap.xml` and `robots.txt`; upload hardening tests; header, dependency and bundle checks recorded.
- 2026-11-13 — Admin (Phase 7e): Journal: list with search and status filter; write and edit posts with a Markdown editor (toolbar, preview, insert image), cover photo, author, tags, back-dating and SEO preview; delete with its images.
- 2026-11-13 — Admin (Phase 7d): Products: searchable, filterable list (category, status, featured/popular/new/on sale/without photos, sort, 20 per page); add and edit products with Markdown description (toolbar + preview), live price preview, colours, specifications with quick-add labels per category, details, visibility flags and SEO preview; photos with drag & drop multi-upload, featured photo, order, descriptions and delete; duplicate as draft; delete with photos; unsaved-changes warning.
- 2026-11-13 — Admin (Phase 7c): Categories: create and edit (name, web address, description, image, visibility, SEO), reorder, Active / Show on home switches, product counts; delete only when a category has no products. Changes show on the site immediately.
- 2026-11-13 — Admin (Phase 7b): Settings pages for business details, contact and WhatsApp (with a test link and message preview), location, map and opening hours, social links, and SEO with a share image; Homepage editor for the hero (live preview and photo upload) and promo banners (schedule, order, edit, delete).
- 2026-11-13 — Admin (Phase 7a): secure sign-in with lockout protection, a forced password change on first sign-in, account page (profile, password, sign out other devices), admin dashboard with counts, recent products and setup warnings, and a mobile-friendly admin menu.
- 2026-11-12 — Homepage (Phase 6): hero, shop-by-category tiles, New arrivals / Featured / Most loved rails, brand story, promo banners, WhatsApp help band and latest Journal posts; empty sections hide themselves. Organization, WebSite (search) and store structured data.
- 2026-11-12 — Journal (blog) with featured post, reading time, share links and related posts; Contact page with opening hours, a live "Open now / Closed now" badge, directions and a tap-to-load map; About page (Phase 5).
- 2026-11-12 — Global search (Phase 4): a search overlay from the header with instant suggestions (products with photo and price, plus categories), keyboard navigation, and a results page with pagination and a helpful no-results state.
- 2026-11-12 — Product catalogue (Phase 3): All furniture and category pages with sorting, "On sale" filter and pagination; product pages with a swipeable gallery, colour swatches that go into the WhatsApp message, a sticky mobile WhatsApp bar, specifications, description, related products, and Product/Breadcrumb structured data.
- 2026-11-12 — Image pipeline for Cloudflare R2: validation, EXIF stripping and 480/960/1600 px WebP variants, with rollback on failed uploads.
- 2026-11-12 — Optional demo catalogue (`SEED_DEMO=true`) for CI and test servers.
- 2026-11-12 — Artifex brand logo in the header (with a subtle reveal) and footer (with "Decor your dreams"), plus favicons and an Apple touch icon (ADR-022).

### Changed
- 2026-11-12 — Real contact details: WhatsApp/phone +880 1757-758388, Uttara showroom address, Facebook, Instagram and YouTube links.
- 2026-11-12 — Design system & layout shell (Phase 2): colour/type tokens, Cormorant Garamond + Inter, buttons, badges, prices (৳ lakh format), form fields, breadcrumbs, skeletons; sticky header with category nav, mobile menu drawer, footer with contact and opening hours, floating WhatsApp button; branded 404 and error pages; dev style guide at `/_styleguide`.
- 2026-11-12 — Subtle CSS-only animations (entrance, scroll reveal, hover), disabled for reduced-motion users (ADR-021).
- 2026-11-12 — Test environment at `artifex.codespherestudio.site` (cPanel subdomain, Node 24 app, MariaDB database) (ADR-019).
- 2026-11-12 — Code hosted on GitHub; CI green on the first push (Phase 1 complete).
- 2026-11-12 — Project foundation (Phase 1): Next.js 16.4 app scaffold with strict TypeScript, Tailwind CSS 4, ESLint (Prisma import restrictions, unsafe-raw-query ban) and Prettier.
- 2026-11-12 — Prisma 7 schema for all entities, first migration, and an idempotent seed (7 categories, site settings, home hero, predefined admin).
- 2026-11-12 — Environment validation at server start, security headers + CSP, custom image loader for R2 variants.
- 2026-11-12 — Vitest and Playwright test setups, standalone deploy bundle script, and GitHub Actions CI + one-click deploy (backup, migrate, seed, swap, health check, rollback).
- 2026-11-10 — `docs/history/`: archive of the planning chat (summary + full transcript export).
- 2026-11-10 — Project documentation set: `AGENTS.md`, `PROGRESS.md`, `DECISIONS.md` (ADR-001…013), `CHANGELOG.md`, `README.md`, and `docs/01`–`12` plus `TESTING-GUIDELINES.md`.
