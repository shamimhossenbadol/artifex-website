# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Changed
- 2026-11-20 — Admin → Invoice: the terms & conditions can be moved down and back up (2 mm steps, up to the free space), like the signature. The red website band touches the bottom edge of the paper again (ADR-083).

### Changed
- 2026-11-20 — Admin → Invoice: the bottom signature can be moved up and down with Move up / Move down buttons (2 mm steps, up to the free space). Invoice numbers are digits only and print as 6 digits (88 → 000088). Units are picked from a list (pcs by default, set, feet, inch, yds, meter, sft, rft, kg). A fifth standard term, Delivery & Labor Charges, can be ticked. The page’s help texts are removed (ADR-082).

### Added
- 2026-11-20 — Admin → Invoice: choose how the advance was paid (Cash, Card or Bank; printed as "Advance paid (Cash)"), put the authorised signature on the left or right and at the bottom, after the totals or Auto, and tick any of the standard terms & conditions (Advance Payment, Product Collection, No Return or Exchange, Remaining Payment) to print them under the totals (ADR-081).

### Fixed
- 2026-11-20 — Invoice print: the phone number no longer runs past the right margin, and the table and totals now end exactly on it. The red band sits clear of the paper edge so it prints whole, with "Visit our website: …" centred in it (ADR-081).

### Changed
- 2026-11-19 — Admin → Invoice: the authorised signature now adapts to the items. It stays at the bottom of the page while there is room and moves up beside the totals when the items fill the page, so more or longer rows fit before the "Too much for one A4 page" warning (ADR-080).
- 2026-11-19 — Admin → Dashboard: the visitor & inquiry numbers can now be shown for **Today** and **Yesterday** (Dhaka days), next to 7, 30 and 90 days. Today compares with the same time yesterday; Yesterday with the day before (ADR-079).
- 2026-11-19 — Admin → Invoice: more compact sheet. Less space at the top, a bigger "Invoice" title without the red line and with the invoice no. and date on the same line, no "Bill to" heading, no line between the customer and the items, and only the authorised signature (on the left), closer to the red band. About 30 mm stays free with 15 items (ADR-078).

### Fixed
- 2026-11-19 — Admin → Invoice: the "Too much for one A4 page" warning appeared at 11 items. The sheet is tighter so 15 ordinary items (with discount and advance) fit one A4 page, and "Print invoice" now measures the sheet when clicked and shows the warning instead of printing an overfull page. The printable sheets also keep the same text sizes on narrow screens, so the preview matches the print (ADR-077).
- 2026-11-17 — Admin product form: saving with **Price range** or **No price** failed with "Invalid input: expected string, received undefined". Price fields the form doesn’t show are now treated as blank (ADR-076).

### Added
- 2026-11-17 — Products can show a **price range** (e.g. `৳ 40,000 – ৳ 60,000`) instead of a fixed price. Admin → Product → Pricing now offers Fixed price, Price range or No price. New nullable `Product.maxPrice` column (migration `20261117000000_product_price_range`) (ADR-076).
- 2026-11-17 — Product pages: the "Ask on Messenger" link now carries the product (`m.me/<page>?ref=product-<slug>`), so the Page inbox shows which product a chat started from (ADR-074).

### Added
- 2026-11-16 — Homepage: a product rail for each category that has products (Sofas, Dining Tables, Beds, Curtains…), after New arrivals, each with "View all" (ADR-072).
- 2026-11-16 — Admin → Invoice: print customer invoices on the same letterhead as the delivery challan. Items with quantity, unit and unit price (line totals calculated), optional discount and advance, amount due, optional invoice number; one A4 page, nothing stored (ADR-067).

### Added
- 2026-11-16 — Delivery challan: optional driver details (driver name, phone, vehicle number), switched on with a checkbox and printed as a "Driver & vehicle" row under the items; blank fields print as lines to fill in by hand (ADR-066).

### Removed
- 2026-11-16 — Product colours are gone everywhere: no colour rows in the admin product form, no colour swatches on product pages, no colour in the WhatsApp message, and the `ProductColor` database table is dropped by a migration (ADR-054).

### Fixed
- 2026-11-16 — Product page on desktop: a product with only one photo showed it as a small thumbnail; it now fills the gallery (ADR-061).
- 2026-11-16 — Admin image uploads: some photos failed with a connection error while others worked. Photos are now resized (max 2400 px) and re-encoded in the browser before upload, failed requests are retried automatically up to twice, and the server processes images with much less memory. Large originals up to 40 MB can be chosen (ADR-058).
- 2026-11-16 — Product page on desktop: the main photo used a 4:3 frame that cut off the top and bottom of square product photos. Product images are now square (1:1) everywhere: product page, thumbnails, cards, search results and the admin photo preview (ADR-057).
- 2026-11-15 — Deploys no longer fail at the seed step after the temporary admin password secret is deleted: the seed treats an empty secret as not set, and the deploy's "Run the seed" option is now off by default (tick it only when new categories or settings must be created).
- 2026-11-13 — Phones: the homepage was wider than the screen (it could slide sideways); "not found" pages for missing products or posts showed the header and footer twice; the header logo appeared late on every page (ADR-044).
- 2026-11-13 — Mobile menu and search overlay could vanish if opened in the first moment after a page started loading (when the full header streamed in, it replaced them). They now stay open (ADR-043); this also fixes the flaky mobile tests in CI.
- 2026-11-13 — Admin: opening a product edit page right after creating it (and other in-admin navigation to forms) could show "Something went wrong"; form labels now always reach their fields, including the Category and Status dropdowns (ADR-038). CI is green again.
- 2026-11-13 — Homepage hero/banner photos didn't show after upload: the build pointed image URLs at the site instead of the media domain (a GitHub variable). Builds now stop with a clear error when `NEXT_PUBLIC_MEDIA_URL` equals the site URL.
- 2026-11-13 — Deploy bundle: image processing (sharp) now ships with its native libraries, so admin image uploads work on the server (ADR-032).
- 2026-11-13 — Search: words typed into the search box while the page is still loading on a slow connection now show suggestions as soon as loading finishes.
- 2026-11-12 — Mobile menu now opens instantly, even before the page's JavaScript has loaded on slow connections (ADR-024).
- 2026-11-12 — Test site showed a blank white page after the Phase 2 deploy: the deploy bundle was missing Turbopack's Prisma alias. Packaging now recreates and verifies it, CI boots the real bundle, and the deploy health check requires a complete page (ADR-023).

### Changed
- 2026-11-17 — Admin product form: new Sofas products start with 11 default specifications (Product Type, Frame Material, Upholstery, Foam, Legs, Seating Configuration, Seater Dimensions, 1 Seater Dimensions, Sofa Width, Pillow Filling, Pillow Quantity) (ADR-075).
- 2026-11-16 — Admin challan and invoice: printing no longer clears the form; press Clear to start a new one (ADR-073).
- 2026-11-16 — Phones: the product page footer no longer shows the © line and developer credit; every other page shows both again (ADR-071).
- 2026-11-16 — Deploys: one GitHub Actions run per deploy; CI no longer also runs separately on every push to main (ADR-070).
- 2026-11-16 — Products without a price: the buttons now say "Ask for price on WhatsApp/Messenger", and the card invites customers to message for their price or visit the Uttara showroom (ADR-069).
- 2026-11-16 — Phones: tighter product page (less space around the line, before Specifications and before "You may also like"); the footer no longer sits under the fixed price/contact bar on product pages (ADR-068).
- 2026-11-16 — Delivery challan: the title is now "Delivery Challan / Gate Pass" in a smaller size so it no longer runs into the salesman and date; the letterhead logo and contact details are a little larger (ADR-066).
- 2026-11-16 — Phones: the product page no longer shows the Home / Category / Product path above the title (ADR-065).
- 2026-11-16 — Product page: products without a fixed price show a "Priced to your design" quote card (made to your size, your fabric and finish, free quote) with "Get a quote on WhatsApp/Messenger" buttons, instead of "Price on request" and a separate Made to order badge (ADR-063). Phones: a more compact footer, with no line under the logo and tighter spacing (ADR-064).
- 2026-11-16 — Admin product form: the Quick add specification buttons are gone; add rows with "Add specification". Dining Tables still start with their default rows (ADR-062).
- 2026-11-16 — Phones: the footer shows just the logo, address, email and social icons (no description or copyright line). Product page: no "Description" heading (the text starts under the line), less space above the line and before the related products, which are now titled "You may also like" (ADR-061).
- 2026-11-16 — Product page: shows only the full description and specifications; the short description and quick facts under the buttons are gone. In the admin, the short description is now the required **SEO description** in the Search engines section (Google and link previews only); any SEO description already typed replaces it (ADR-060).
- 2026-11-16 — Admin product form: Dining Tables start with 12 default specifications (removable; each kept row needs a value). SKU, material and dimensions are now specification rows (existing values are moved automatically); the Details section is gone, with Search keywords and Made to order in Basic info. Save sits at the top right and stays visible. The SEO section is always open and its title/description now also drive Facebook/WhatsApp link previews; reopened edit forms always show the saved values (ADR-059).
- 2026-11-16 — Admin product list: each product has a Draft/Published switch, so you can publish or unpublish without opening the edit form (ADR-056).
- 2026-11-16 — Admin: a more premium look (ADR-055): Manrope font, a fixed dark espresso sidebar that no longer scrolls with the page, champagne-gold accents, softer rounded cards with gentle shadows, and subtle animations (pages fade in, cards lift on hover, sidebar items and stats appear one after another, toasts pop in). Saving a new or edited product now returns to the product list (ADR-054).
- 2026-11-15 — Phones: homepage sections are 32 px apart instead of 64 px, and the floating Messenger/WhatsApp buttons no longer show on the homepage (ADR-053).
- 2026-11-15 — Phones: the same space between all homepage sections; the "Not sure what fits your space?" section is now an inset card like the story; no location icon in the footer (ADR-052).
- 2026-11-15 — Phones: the hero title and description sit over the photo again, with the buttons below it; the slider dots are closer together and lower (ADR-051).
- 2026-11-15 — Homepage: the Collections heading is gone (the hero button already leads to all furniture); on phones the hero buttons fill the width, the story section is a centred card, and the footer drops the phone and WhatsApp buttons (the floating buttons cover them). Footer bottom line: © on the left, developer credit on the right (below © on phones) (ADR-050).
- 2026-11-15 — Mobile homepage refinements (ADR-049): on phones the hero photo is a short wide band with the dots at its bottom and the heading, subheading and two buttons below it; on larger screens the text sits over the photo; the slow zoom no longer snaps back when photos change. Collections show as a 3-column grid on phones and tablets (6 across on desktop). Dining tables have a proper dining-table icon, and the mobile menu shows category icons where a category has no photo. The footer is shorter and centred on phones, with phone and WhatsApp as rounded buttons. Section titles are a little smaller.
- 2026-11-15 — Hero on phones: the photo is behind the text again, in a shorter frame, with a compact heading, subheading and two small buttons side by side; the pause button is removed. On desktop the hero is a little taller (78% of the screen height).
- 2026-11-15 — Homepage hero slider: plays on its own in an endless loop with a smooth crossfade and slow zoom; arrows removed (dots and a pause button remain). On phones the photo shows as a wide band with the heading and buttons below it instead of being cropped behind the text (ADR-048).
- 2026-11-14 — Production launch prepared for **artifexfurniturebd.com** (new hosting, new Cloudflare R2, fresh database): step-by-step checklist in `docs/PRODUCTION-LAUNCH.md`; the seeded contact email is now artifexdecoryourdreams@gmail.com (ADR-047).
- 2026-11-14 — Product page on phones: the photo starts right under the header (no gap); the separate category label above the title is gone (the breadcrumbs already show it); "Made to order" sits on its own line with its note below.
- 2026-11-14 — Mobile header logo: the F of FURNITURE is enlarged like the A of ARTIFEX (ADR-045).
- 2026-11-13 — Mobile header logo now reads "ARTIFEX FURNITURE" on one line, with "Furniture" matched to the logo's lettering (ADR-045).
- 2026-11-13 — Mobile design pass (ADR-044): Messenger next to WhatsApp everywhere (product page and its sticky bar, homepage help band, contact, about); smaller floating buttons that stay clear of the phone's home bar; tighter spacing; full-width buttons; "View all" beside section titles; swipeable journal row on the homepage and compact rows on the Journal page; shorter sort labels; full-width product photo placeholder; a compact text-only hero.
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
- 2026-11-14 — Admin → Challan: make and print a delivery challan (customer, products and quantities, salesman and date, signatures, the website on a red band) on exactly one A4 page in the style of the shop's letterhead, with a live A4 preview. Nothing is saved; the form clears after printing (ADR-046).
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
- 2026-11-16 — Products without a price: the buttons now say "Ask for price on WhatsApp/Messenger", and the card invites customers to message for their price or visit the Uttara showroom (ADR-069).
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
