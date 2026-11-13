# 07 — Admin Dashboard

URL: `/admin` (login at `/admin/login`). The dashboard is `noindex`, uncached, and **excluded from the sitemap and blocked in robots.txt**.

## 1. Accounts & authentication

- **One predefined admin** is created by the seed from `ADMIN_EMAIL` + `ADMIN_INITIAL_PASSWORD` with `mustChangePassword = true`. There is **no sign-up page**.
- **First login** redirects to `/admin/account/password` and blocks every other admin route until the password is changed.
- **Change password** (`/admin/account`): current password, new password, and confirmation.
  - Rules: ≥ 10 characters, not equal to the current password, not equal to the email, and not in a small blocklist of common passwords.
  - On success: hash with bcrypt (cost 12), set `mustChangePassword=false`, **increment `sessionVersion`** (logs out other devices), and re-issue the current session.
- The admin can also change their display name and email (email change requires the current password).
- **Forgot password / lockout recovery:** no email flow (shared hosting mail is unreliable, and email-based reset adds attack surface). Instead there's a CLI over cPanel Terminal/SSH:
  `npm run admin:reset-password -- --email admin@…`, run from a developer machine through the SSH DB tunnel (ADR-030; prompts for a new password, sets `mustChangePassword=true`, bumps `sessionVersion`, clears the lockout). This is documented in 10 §8.
- The schema allows more admins later, but v1 has no UI to add them (out of scope; it can be enabled later with the same table).

Session and security mechanics are in `09-SECURITY-GUIDELINES.md` §2.

## 2. Layout

- Left sidebar (collapsible to a drawer on mobile): Dashboard · Products · Categories · Blog · Homepage · Settings · Account · "View site ↗" · Logout.
- Top bar: page title, primary action button (e.g. "New product").
- It uses the same tokens as the public site, with a denser layout (Inter 14 px, `bg-surface` panels on `bg-bg`).
- Must be usable on a phone (the owner may update products from mobile). Tables become stacked cards below md.

## 3. Screens

### 3.1 Dashboard
- Counts: published/draft products, categories, published posts.
- Quick links: Add product, Write post, Edit homepage.
- "Recently updated products" (5).
- Optional (Phase 8): top 5 products by WhatsApp clicks (last 30 days).
- Warnings: products without images, the WhatsApp number not set, the hero image missing.

### 3.2 Products
- **List:** search by title, filter by category/status/flags, and sort by updated/price. Columns: thumb, title, category, price, status, flags (★ featured, 🔥 popular, New), updated. Row actions: Edit, View, Duplicate, Delete (with confirmation). Paginated at 20.
- **Create/Edit form** (one page with sections; sticky Save bar):
  1. *Basics*: title, slug (auto, editable, with a warning on change after publish), category, short description (counter 300), full description (Markdown textarea with a toolbar: bold, italic, heading, list, link, and preview tab).
  2. *Pricing*: regular price (blank = Price on request), discount price, with a live preview "৳ 38,675 ~~৳ 45,500~~ -15%".
  3. *Images*: drag & drop multi-upload (max 12, ≤ 10 MB each, JPEG/PNG/WebP), per-file upload progress, drag-to-reorder, "Set as featured" (primary), alt text per image (required), and delete.
  4. *Colours*: repeatable rows (name + colour picker/hex), reorderable.
  5. *Specifications*: repeatable label/value rows, reorderable, with quick-add presets per category (e.g. Sofas: Frame, Upholstery, Seating capacity, Cushion, Warranty).
  6. *Details*: SKU, material, dimensions, made-to-order, keywords (comma-separated synonyms for search).
  7. *Visibility*: status (Draft/Published), Featured, Popular, New arrival, home sort order.
  8. *SEO* (collapsed): SEO title and description with a counter and a Google-style preview; defaults are derived when blank.
- Validation errors show inline and in a summary at the top. A failed save keeps the form state.
- Unsaved-changes guard (`beforeunload`).
- "Duplicate" copies everything except slug/SKU/images as a Draft.

### 3.3 Categories
- List with move up/down buttons (saves `sortOrder`; ADR-033 replaces drag-to-reorder), switches for Active and Show on home, and a product count.
- Form: name, slug (blank = derived from the name), description, image (with "Remove the current image"), Active, Show on home, SEO fields.
- Delete is blocked while products exist: the row shows "View products" (link to the filtered product list) instead of Delete, and the server refuses with a message.
- Renaming a category recomputes `searchText` for its products (04 §4).

### 3.4 Blog
- List: title, status, published date, updated; search plus a status filter.
- Form: title, slug, excerpt, cover image + alt, author name (defaults to the admin's name), tags, content (Markdown editor with preview and "Insert image"), status, publish date (editable for back-dating), SEO.

### 3.5 Homepage
- **Hero:** heading, eyebrow, subheading, image, two CTA label/link pairs, with a live preview card.
- **Promo banners:** list + form (title, subtitle, image, link, active, date range, order).
- **Featured content:** three reorderable lists (New arrivals, Featured, Popular) showing flagged products; add via product picker search and remove (unflags). This is a convenience view over the product flags + `homeSortOrder`.
- **Home categories:** shortcut to the category ordering and visibility.

### 3.6 Settings (tabs)
- *Business*: name, tagline, about short, about page content.
- *Contact*: phone, WhatsApp number (validated, with a "Test link" button that opens wa.me), email, default WhatsApp message, product message template (with placeholder help and a preview).
- *Location*: address, city, map embed URL (with paste help: Google Maps → Share → Embed a map → copy the `src`), directions link, lat/lng, opening hours editor (rows: days, open, close, closed).
- *Social*: Facebook (prefilled with the brand page), Instagram, YouTube.
- *SEO*: default title, description, default OG image.

### 3.7 Account
- Profile (name, email) and change password (see §1). Logout everywhere (bumps `sessionVersion`).

## 4. Behaviour rules

- Every mutation is a **Server Action** that runs `requireAdmin()` → Zod validation → service → **revalidate tags** → returns `{ ok, error?, fieldErrors? }`.
- Toast feedback on success or error (a small custom component, no library).
- Destructive actions use a confirm dialog naming the item.
- Image uploads go one file per request (keeps memory low on shared hosting); the client queues them with a concurrency of 2.
- All lists are server-paginated.

## 5. Cache revalidation map

| Action | Tags revalidated |
|---|---|
| Product create/update/delete/publish | `products`, `product:<slug>` (old + new slug), `home`, `categories` (counts) |
| Product image change | `product:<slug>`, `products`, `home` |
| Category change | `categories`, `products`, `home` |
| Blog change | `blog`, `post:<slug>`, `home` |
| Hero / promo change | `home` |
| Settings change | `settings` (layout, footer, contact, about, WhatsApp links everywhere) |
The sitemap is dynamic and reads from the cached services, so it updates automatically.
