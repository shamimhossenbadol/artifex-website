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

- Left sidebar (collapsible to a drawer on mobile): Dashboard · Products · Categories · Blog · Homepage · Challan · Invoice · Settings · Account · "View site ↗" · Logout.
- Top bar: page title, primary action button (e.g. "New product").
- It uses the same tokens as the public site, with a denser layout (Inter 14 px, `bg-surface` panels on `bg-bg`).
- Must be usable on a phone (the owner may update products from mobile). Tables become stacked cards below md.

## 3. Screens

### 3.1 Dashboard
- Counts: published/draft products, categories, published posts.
- Quick links: Add product, Write post, Edit homepage.
- "Recently updated products" (5).
- **Visitors & inquiries (ADR-040):** period switch 7/30/90 days (`?range=`, default 30); KPI cards with the change vs the previous period: visitors (unique per day), page views, product views, inquiries, WhatsApp / Messenger / call taps, inquiry rate; lists: most viewed products, most inquired products, top pages. Signed-in admin visits aren't counted.
- Warnings: products without images, the WhatsApp number not set, no hero photos.

### 3.2 Products
- **List:** search by title, filter by category/status/flags, and sort by updated/price. Columns: thumb, title, category, price, status, flags (Popular, New), updated. Row actions: Edit, View, Duplicate, Delete (with confirmation). Paginated at 20.
- **Status switch (ADR-056):** each row has a Draft/Published switch that changes the status straight from the list (optimistic, with a toast; same publish-date rule and cache revalidation as the form).
- **Create/Edit form** (one page with sections; Save in a sticky top bar, top right, ADR-059):
  1. *Basic info*: title, slug (auto, editable, with a warning on change after publish), category, full description (Markdown textarea with a toolbar: bold, italic, heading, list, link, and preview tab), search keywords (comma-separated synonyms), made-to-order.
  2. *Pricing*: choose **Fixed price** (price + optional discount), **Price range** (From / To, for when the exact price shouldn’t be shared) or **No price** (custom-quote card), with a live preview ("৳ 38,675 ~~৳ 45,500~~ -15%" or "৳ 40,000 – ৳ 60,000") (ADR-076).
  3. *Images*: drag & drop multi-upload (max 5: 1 main + 4 gallery, ADR-041; originals up to 40 MB each, shrunk in the browser to ≤ 2400 px before upload (ADR-058), JPEG/PNG/WebP), per-file upload progress, move up/down, "Set as main photo" (primary: cards, listings, sharing), alt text per image (required), and delete. Gallery photos show only on the product page.
  4. *Specifications*: repeatable label/value rows, reorderable, added with "Add specification" (no Quick add buttons, ADR-062). SKU, Material and Dimensions are specification rows (ADR-059). **Dining Tables** start with 12 default rows (Product Name, Product Type, Material, Tabletop, Seating Capacity, Number of Chairs, Chair Upholstery, Surface Finish, Color & Design, Style, Room Type, Usage) and **Sofas** with 11 (Product Type, Frame Material, Upholstery, Foam, Legs, Seating Configuration, Seater Dimensions, 1 Seater Dimensions, Sofa Width, Pillow Filling, Pillow Quantity; ADR-075): removable, but every row that stays needs a value.
  5. *Visibility*: status (Draft/Published), Popular (ranks search and related products), New arrival (badge + homepage New arrivals). Featured and home sort order were removed (ADR-042).
  6. *Search engines*: SEO title (optional, falls back to "{Title} — {Category}") and **SEO description** (required, up to 300, stored as `shortDescription`; ADR-060), with counters and a Google-style preview. Used for Google and Facebook/WhatsApp link previews only, never shown on the product page.
- Validation errors show inline and in a summary at the top. A failed save keeps the form state.
- Unsaved-changes guard (`beforeunload`).
- "Duplicate" copies everything except the slug and images as a Draft.
- **As built (ADR-034):** photos are added on the edit page after the first save ("Save and add photos"), in a Photos panel that saves on its own, outside the details form. Reorder uses move up/down buttons (not drag), upload progress is a per-file status (waiting / uploading / uploaded / failed) rather than a byte percentage, and new photos get the product title as default alt text. Specs reorder with up/down buttons. Colours were removed (ADR-054).
- **After saving (ADR-054):** creating or editing a product returns to the product list with a toast; photos are added by opening the product from the list.

### 3.3 Categories
- List with move up/down buttons (saves `sortOrder`; ADR-033 replaces drag-to-reorder), switches for Active and Show on home, and a product count.
- Form: name, slug (blank = derived from the name), description, image (with "Remove the current image"), Active, Show on home, SEO fields.
- Delete is blocked while products exist: the row shows "View products" (link to the filtered product list) instead of Delete, and the server refuses with a message.
- Renaming a category recomputes `searchText` for its products (04 §4).

### 3.4 Blog
- List: title, status, published date, updated; search plus a status filter.
- Form: title, slug, excerpt, cover image + alt, author name (defaults to the admin's name), tags, content (Markdown editor with preview and "Insert image"), status, publish date (editable for back-dating), SEO.
- **As built (ADR-036):** the publish date can be today or earlier, never in the future (no scheduling). "Insert image" uploads one photo to R2 (`blog/` folder) and inserts `![Describe the image](blog/…)`; images removed from the Markdown are deleted from R2 when the post is saved, and all of a post's images when it is deleted. Blank cover description uses the title.

### 3.5 Homepage
- **Hero:** heading, eyebrow, subheading, two CTA label/link pairs, with a live preview card over the first photo.
- **Hero photos (ADR-039):** up to 5 slides managed like product photos (multi-upload queue, alt text, move up/down, delete; changes save immediately).
- **Promo banners:** list + form (title, subtitle, image, link, active, date range, order).
- ~~Featured content~~: not built (7f skipped); the Featured/Most loved rails were removed (ADR-035) and the Featured flag dropped (ADR-042).
- **Home categories:** shortcut to the category ordering and visibility.

### 3.6 Settings (tabs)
- *Business*: name, tagline, about short, about page content.
- *Contact*: phone, WhatsApp number (validated, with a "Test link" button that opens wa.me), email, default WhatsApp message, product message template (with placeholder help and a preview).
- *Location*: address, city, map embed URL (with paste help: Google Maps → Share → Embed a map → copy the `src`), directions link, lat/lng, opening hours editor (rows: days, open, close, closed).
- *Social*: Facebook (prefilled with the brand page), Instagram, YouTube.
- *SEO*: default title, description, default OG image.
- *Tracking* (ADR-040): Meta (Facebook) Pixel ID, digits only; the site adds the pixel code itself. Empty turns it off.

### 3.7 Account
- Profile (name, email) and change password (see §1). Logout everywhere (bumps `sessionVersion`).

### 3.8 Delivery challan (ADR-046)
- **Route:** `/admin/challan` ("Challan" in the sidebar). Requires admin like every admin page.
- **Form:** customer name, phone, delivery address; items (product picked from a type-ahead list of all products, or any free text; optional note such as size or finish; quantity 1–999; up to 10 rows); date (pre-filled from the request time in Dhaka, editable); salesman name; optional driver details (ADR-066): a "Print driver details under the items" checkbox, off by default, that reveals driver name, driver phone and vehicle number (all optional). No challan number and no general notes section.
- **Preview:** a live sheet of exactly one A4 page (210 × 297 mm) in the letterhead style of the shop's printed paper: logo with tagline left (24 mm tall); address, "Cell: 01757758388, 01716498858" and "Email: artifexdecoryourdreams@gmail.com" right in body-size text (`CHALLAN_LETTERHEAD`); brand-red rule; faint logo watermark; "Delivery Challan / Gate Pass" (serif at the h3 size so it never runs into the salesman block, short brand-red accent bar) with Salesman and Date beside it as labelled blocks split by a hairline; "Delivered to" rows with the label left, the value right and a dotted leader between (Customer Name, Phone Number, Customer Address); items table (item · note) with total quantity; when driver details are on, a "Driver & vehicle" row under the items with three columns (Driver name, Driver phone, Vehicle number), each value on a dotted line and left blank when empty so it can be written in by hand; customer and salesman signature lines (salesman name under the line); the website on a brand-red band across the foot of the page.
- **One page only:** the form measures the preview; if the content would run past the page (long address, long item notes or many items) it says "Too much for one A4 page…" and printing is blocked. About 9 items with notes fit (7 with driver details on), more without notes.
- **Print:** "Print challan" checks the required fields (name, phone, address, ≥ 1 item, valid quantities, date) and calls `window.print()`. Only the sheet prints (a copy portalled under `<body>`; print CSS hides everything else; named `@page challan`: A4, no margins, background colours kept). Long challans continue on a second page.
- **Nothing is stored:** no server action, no table, no browser storage. Printing keeps the form (reprint or adjust freely); only "Clear" empties it (ADR-073).

### 3.9 Invoice (ADR-067)
- **Route:** `/admin/invoice` ("Invoice" in the sidebar). Requires admin. Works like the challan: built and printed in the browser, nothing stored; the form stays filled until "Clear" (ADR-073).
- **Form:** customer name (required), phone and address (optional); up to 15 items: description (product type-ahead or any text), quantity (up to two decimals), unit (pcs, set, yds, feet, sft, rft, meter, kg or any text), unit price (৳, up to two decimals), line total shown; discount and advance paid (optional) with a live Subtotal / Amount due summary; date (pre-filled, Dhaka) and optional invoice number.
- **Sheet:** the same letterhead, watermark and red website band as the challan (`components/admin/print/Letterhead.tsx`); title "Invoice" with invoice no. and date; "Bill to"; table SL · Description · Qty · Unit · Unit price · Total; right-aligned Subtotal, Discount and Advance paid (only when set) and a bold Amount due; customer's and authorised signatures. Exactly one A4 page: rows are compact and name and phone share a line, so 15 one-line items with discount and advance fit (ADR-077); the form warns when it would overflow (e.g. long descriptions that wrap).
- **Print:** "Print invoice" checks the name, ≥ 1 item with quantity > 0 and a unit price, valid discount/advance (discount ≤ subtotal) and the date, and measures the sheet at that moment (an overfull sheet shows the warning instead of printing, ADR-077), then prints only the sheet (`#invoice-print-root`). Use "Save as PDF" to keep a copy.

## 4. Behaviour rules

- Every mutation is a **Server Action** that runs `requireAdmin()` → Zod validation → service → **revalidate tags** → returns `{ ok, error?, fieldErrors? }`.
- Toast feedback on success or error (a small custom component, no library).
- Destructive actions use a confirm dialog naming the item.
- Image uploads go one file per request (keeps memory low on shared hosting); the client queues them with a concurrency of 2. Each photo is resized and re-encoded in the browser first and retried up to twice if the request fails (ADR-058).
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
