# 01 — Project Overview

## 1. The business

**Artifex Furniture** is a furniture brand based in **Dhaka, Bangladesh** ([Facebook page](https://www.facebook.com/profile.php?id=61560352716152)).
Customers in Bangladesh usually discover furniture on Facebook and then inquire on WhatsApp or Messenger before buying. The website formalises this into a premium brand presence: **discover → fall in love with the product → message on WhatsApp**.

## 2. Goals

1. Present the catalogue the way a premium brand would, with large photography and calm layouts.
2. Make product discovery effortless through categories, search, and featured/popular/new collections.
3. Turn interest into **WhatsApp conversations** with one tap, pre-filled with the product name and link.
4. Build trust: showroom location, opening hours, phone, brand story, and blog articles.
5. Let a non-technical owner manage everything through a simple admin panel.
6. Run fast and reliably on **Namecheap shared hosting**.

### Success measures
- Lighthouse mobile scores of ≥ 90 for Performance, Accessibility, Best Practices, and SEO on the home, category, and product pages.
- A WhatsApp CTA is visible without scrolling on product pages on mobile.
- The owner can add a product with 6 photos in under 5 minutes.

## 3. Scope

### In scope
- Public site: Home, All Products, Category listing, Product detail, Search, Blog list/detail, About, Contact & Location.
- WhatsApp inquiry (product-specific and general).
- Admin dashboard with a **single predefined admin account** (seeded from env). The password can be changed in the panel, and there's a CLI reset for lockouts.
- Admin management of products, categories, images, colours, specs, blog posts, homepage content (hero, promo banners, featured categories/products), and site settings (contact, WhatsApp, address, map, hours, social links, default SEO).
- SEO: metadata, Open Graph, sitemap, robots, JSON-LD.

### Out of scope (explicit)
Cart, checkout, payments, customer accounts, orders, reviews, newsletter, multi-language, and live chat. See `AGENTS.md` §5.

## 4. Product categories (seeded, editable)

| Category | Slug | Notes |
|---|---|---|
| Sofas | `sofas` | Seat count and fabric are key specs |
| Dining Tables | `dining-tables` | Seating capacity, top material |
| Doors | `doors` | Often made to order: size and wood type |
| Chairs | `chairs` | |
| Curtains | `curtains` | Often priced per unit or per measurement, so "Price on request" is common |
| Tables | `tables` | Coffee, side, and study tables |
| Beds | `beds` | Size (King/Queen/Semi-double/Single), storage |

Admins can add, rename, reorder, and hide categories.

## 5. Audience

- **Primary:** Urban Dhaka homeowners and newly-weds (ages 25–45) furnishing a flat. They're mobile-first (≈ 80 % of traffic expected on phones), they arrive from Facebook, and they're price-aware but quality-seeking.
- **Secondary:** Interior designers and offices looking for doors, tables, and chairs in bulk or made to order.

Implications: design for mobile first, keep pages light (3G/4G), show prices clearly in **৳ BDT**, and keep WhatsApp always within reach.

## 6. Competitor & reference research (2026-11-10)

| Reference | What they do well | What we take | What we avoid |
|---|---|---|---|
| **HATIL** (hatil.com), the BD market leader | Room- and category-based navigation, strong product photography, a showroom locator, visible prices with discounts | Clear category nav, prominent ৳ price with strike-through discount, showroom info | A heavy JS app shell with a loading GIF before content (hurts LCP). Full e-commerce flows. |
| **Otobi, Brothers Furniture, Navana, Akhtar, Regal** (BD) | Wide catalogues, Facebook-driven inquiries, frequent promos | Promo banners, the "inquire on WhatsApp/Messenger" culture | Cluttered home pages, too many sliders and pop-ups, inconsistent imagery |
| **International premium** (e.g. West Elm, HAY, Muuto, Kave Home) | Whitespace, editorial typography, 4:5 product imagery, restrained colour | Serif and sans type pairing, neutral warm palette, editorial blog, calm grids | Mega menus and complex filtering (overkill for our catalogue size) |

**Positioning:** *"Crafted furniture for modern Bangladeshi homes."* The site should feel closer to a European design studio than to a local marketplace, while staying familiar to local buyers (৳ prices, WhatsApp, showroom address).

> Note: hatil.com is client-rendered, so this research relied on general knowledge of the brands plus a light check. Re-verify specific patterns if needed.

## 7. Content that must be supplied by the business

See `PROGRESS.md` → *Open questions*. Key items: logo, WhatsApp number, address and map pin, opening hours, product photos and data, About-us story, and 3–5 initial blog posts.

## 8. Brand voice

Calm, confident, warm. Short sentences. Focus on craft, materials, and comfort. No ALL-CAPS shouting and no "BEST PRICE!!!".
Example product intro: *"Deep seats, solid mahogany frame, and a linen-blend weave that softens with time."*
