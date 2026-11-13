# 04 — Database Design

MySQL 8 or MariaDB 10.6+ (whichever cPanel provides). Accessed via **Prisma ORM** with the **MariaDB/MySQL JS driver adapter** (no Rust query engine binary; see DECISIONS ADR-004). Charset: `utf8mb4`, collation `utf8mb4_unicode_ci` (supports Bangla text and emoji).

## 1. Entity overview

```
Category 1───* Product 1───* ProductImage
                     │ 1───* ProductColor
                     │ 1───* ProductSpec
BlogPost
HomeHero (singleton)   HomeHeroSlide *   PromoBanner *
SiteSetting (singleton)
AdminUser   LoginAttempt
SiteEvent (first-party visit/click counts, ADR-040)
```

## 2. Conventions

- IDs: `Int @id @default(autoincrement())`. Simple and small; slugs are the public identifiers.
- Money: **`Int` in whole Taka (BDT)**. There are no paisa in furniture pricing, and integers avoid floating-point issues. Formatting is done in `lib/format.ts` → `৳ 45,500`.
- Timestamps: `createdAt @default(now())`, `updatedAt @updatedAt` on every content table.
- Publication: `status ContentStatus @default(DRAFT)`; public queries **always** filter `status = PUBLISHED`.
- Ordering: `sortOrder Int @default(0)` where admins arrange items manually.
- Deletes: hard delete with `onDelete: Cascade` for children (images, colours, specs). Image objects are removed from Cloudflare R2 in the service layer after the DB delete succeeds (ADR-014).
- Image columns (`path`, `imagePath`, `coverImagePath`, `ogImagePath`) store the **R2 key base without the width suffix**, e.g. `products/2026/11/ab12cd34ef56`. They never store full URLs, so the media domain can change without a data migration.

## 3. Prisma schema (target)

```prisma
generator client {
  provider        = "prisma-client"        // Prisma 7 style; use "prisma-client-js" if on Prisma 6
  output          = "../src/generated/prisma"
  engineType      = "client"               // JS engine + driver adapter, no native binary
}

datasource db {
  provider = "mysql"
}

enum ContentStatus {
  DRAFT
  PUBLISHED
}

model Category {
  id              Int       @id @default(autoincrement())
  name            String    @db.VarChar(80)
  slug            String    @unique @db.VarChar(100)
  description     String?   @db.Text
  imagePath       String?   @db.VarChar(255)    // card/hero image (variant base path)
  showOnHome      Boolean   @default(true)
  isActive        Boolean   @default(true)
  sortOrder       Int       @default(0)
  seoTitle        String?   @db.VarChar(70)
  seoDescription  String?   @db.VarChar(170)
  products        Product[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([isActive, sortOrder])
}

model Product {
  id                Int            @id @default(autoincrement())
  title             String         @db.VarChar(150)
  slug              String         @unique @db.VarChar(170)
  categoryId        Int
  category          Category       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  shortDescription  String         @db.VarChar(300)
  description       String         @db.Text            // Markdown
  regularPrice      Int?                                // null => "Price on request"
  discountPrice     Int?                                // must be < regularPrice (validated)
  effectivePrice    Int?                                // denormalised: discountPrice ?? regularPrice (price sort, ADR-025)
  sku               String?        @unique @db.VarChar(50)
  material          String?        @db.VarChar(120)    // quick facet shown on cards/detail
  dimensions        String?        @db.VarChar(120)    // e.g. "W 220 × D 95 × H 85 cm"
  isMadeToOrder     Boolean        @default(false)
  isPopular         Boolean        @default(false)     // ranks search results and related products
  isNewArrival      Boolean        @default(false)     // explicit flag; fallback = newest by createdAt
  status            ContentStatus  @default(DRAFT)
  publishedAt       DateTime?
  keywords          String?        @db.VarChar(255)    // admin-entered synonyms: "couch, settee"
  searchText        String         @db.VarChar(1000)   // denormalised: title + category + keywords + material (lowercased)
  seoTitle          String?        @db.VarChar(70)
  seoDescription    String?        @db.VarChar(170)
  images            ProductImage[]
  colors            ProductColor[]
  specs             ProductSpec[]
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@index([status, categoryId, createdAt])
  @@index([status, isPopular, publishedAt])
  @@index([status, isNewArrival, createdAt])
  @@index([status, effectivePrice])
  @@index([searchText(length: 191)])
}

model ProductImage {
  id         Int      @id @default(autoincrement())
  productId  Int
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  path       String   @db.VarChar(255)   // R2 key base without width suffix, e.g. products/2026/11/ab12cd34ef56
  alt        String   @db.VarChar(160)
  width      Int                         // original (max variant) dimensions for aspect ratio
  height     Int
  isPrimary  Boolean  @default(false)    // the main photo (ADR-041); exactly one per product (service-enforced)
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())

  @@index([productId, sortOrder])
}

model ProductColor {
  id         Int     @id @default(autoincrement())
  productId  Int
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  name       String  @db.VarChar(50)     // "Walnut Brown"
  hex        String  @db.Char(7)         // "#5C4033"
  sortOrder  Int     @default(0)

  @@index([productId])
}

model ProductSpec {
  id         Int     @id @default(autoincrement())
  productId  Int
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  label      String  @db.VarChar(60)     // "Frame", "Seating capacity", "Warranty"
  value      String  @db.VarChar(255)
  sortOrder  Int     @default(0)

  @@index([productId])
}

model BlogPost {
  id              Int           @id @default(autoincrement())
  title           String        @db.VarChar(160)
  slug            String        @unique @db.VarChar(180)
  excerpt         String        @db.VarChar(300)
  content         String        @db.MediumText        // Markdown
  coverImagePath  String?       @db.VarChar(255)
  coverImageAlt   String?       @db.VarChar(160)
  authorName      String        @db.VarChar(80)
  tags            String?       @db.VarChar(255)      // comma-separated, used for related posts
  status          ContentStatus @default(DRAFT)
  publishedAt     DateTime?
  seoTitle        String?       @db.VarChar(70)
  seoDescription  String?       @db.VarChar(170)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([status, publishedAt])
}

model HomeHero {                      // singleton, id = 1
  id            Int     @id @default(1)
  eyebrow       String? @db.VarChar(60)
  heading       String  @db.VarChar(120)
  subheading    String? @db.VarChar(240)
  ctaLabel      String  @db.VarChar(40)
  ctaHref       String  @db.VarChar(255)
  secondaryLabel String? @db.VarChar(40)
  secondaryHref  String? @db.VarChar(255)
  updatedAt     DateTime @updatedAt
}

model HomeHeroSlide {                 // hero background photos, max 5, manual slider (ADR-039)
  id          Int      @id @default(autoincrement())
  imagePath   String   @db.VarChar(255)
  imageAlt    String   @db.VarChar(160)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([sortOrder])
}

model PromoBanner {
  id          Int       @id @default(autoincrement())
  title       String    @db.VarChar(100)
  subtitle    String?   @db.VarChar(200)
  imagePath   String    @db.VarChar(255)
  imageAlt    String    @db.VarChar(160)
  linkHref    String?   @db.VarChar(255)
  linkLabel   String?   @db.VarChar(40)
  isActive    Boolean   @default(true)
  startsAt    DateTime?
  endsAt      DateTime?
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isActive, sortOrder])
}

model SiteSetting {                   // singleton, id = 1
  id                    Int     @id @default(1)
  businessName          String  @db.VarChar(100)
  tagline               String? @db.VarChar(160)
  phone                 String  @db.VarChar(30)       // display format
  whatsappNumber        String  @db.VarChar(20)       // digits only, intl format: 8801XXXXXXXXX
  whatsappDefaultMessage String @db.VarChar(300)
  whatsappProductTemplate String @db.VarChar(300)     // "Hello {business}, I'm interested in {product}{color}. {url}"
  email                 String? @db.VarChar(120)
  addressLine           String  @db.VarChar(255)
  city                  String  @db.VarChar(80)
  mapEmbedUrl           String? @db.VarChar(1000)     // Google Maps embed src (validated host)
  mapLinkUrl            String? @db.VarChar(500)      // "Get directions" link
  latitude              Float?
  longitude             Float?
  openingHours          Json                         // [{ days: "Sat–Thu", open: "10:00", close: "21:00" }, { days: "Fri", closed: true }]
  facebookUrl           String? @db.VarChar(255)
  instagramUrl          String? @db.VarChar(255)
  youtubeUrl            String? @db.VarChar(255)
  aboutShort            String? @db.Text             // footer/home brand intro
  aboutContent          String? @db.Text             // About page (Markdown)
  defaultSeoTitle       String  @db.VarChar(70)
  defaultSeoDescription String  @db.VarChar(170)
  ogImagePath           String? @db.VarChar(255)
  facebookPixelId       String? @db.VarChar(20)       // Meta Pixel ID, digits only (ADR-040)
  updatedAt             DateTime @updatedAt
}

model AdminUser {
  id                  Int       @id @default(autoincrement())
  email               String    @unique @db.VarChar(120)
  name                String    @db.VarChar(80)
  passwordHash        String    @db.VarChar(100)       // bcrypt
  mustChangePassword  Boolean   @default(true)
  sessionVersion      Int       @default(1)            // bump to invalidate all sessions
  lastLoginAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model LoginAttempt {
  id         Int      @id @default(autoincrement())
  key        String   @db.VarChar(160)                // "ip:<ip>" or "email:<email>"
  success    Boolean
  createdAt  DateTime @default(now())

  @@index([key, createdAt])
}

model SiteEvent {                     // first-party, cookieless visit/click counts (ADR-040)
  id           Int      @id @default(autoincrement())
  type         String   @db.VarChar(20)               // "view" | "whatsapp" | "messenger" | "call"
  path         String   @db.VarChar(255)              // page path only, no query string
  visitorHash  String   @db.Char(16)                  // HMAC(day + IP + user agent): rotates daily
  createdAt    DateTime @default(now())

  @@index([createdAt])
  @@index([type, createdAt])
}
// Replaces the planned InquiryClick table. Rows older than 400 days are pruned while recording.
```

> Implemented with Prisma 7.10 (ADR-018): the live schema is `prisma/schema.prisma`, the connection URL lives in `prisma.config.ts`, and `engineType` is no longer needed because Prisma 7 is Rust-free by default. The first migration is `prisma/migrations/20261112000000_init`.

## 4. Business rules enforced in services

- `discountPrice` is only allowed when `regularPrice` is set, and it must be strictly less than it. The discount percentage shown is `round((1 - discount/regular) * 100)`.
- Exactly one `isPrimary` image per product. If it's deleted, the next image by `sortOrder` becomes primary. A product can't be published without at least one image.
- `searchText` is recomputed on every product create/update and on category rename (batch update).
- `effectivePrice` (= valid `discountPrice` ?? `regularPrice`) is recomputed on every product create/update (`src/lib/search-text.ts`, ADR-025).
- `publishedAt` is set the first time the status becomes `PUBLISHED`.
- A category can't be deleted while it has products (`onDelete: Restrict`); the admin is told to move the products first.
- `LoginAttempt` rows older than 30 days are pruned opportunistically during login (no cron).
- Slugs: auto-generated from the title (`slugify`, lowercase ASCII, hyphens) and editable; uniqueness is checked with a `-2`, `-3` suffix.

## 5. Key queries & indexes

| Query | Index used |
|---|---|
| Category page: published products in category, newest first, paginated | `[status, categoryId, createdAt]` |
| Home "New arrivals" / popular ordering | `[status, isNewArrival, createdAt]`, `[status, isPopular, publishedAt]` |
| Sort by price | `[status, effectivePrice]` (nulls last, ADR-025) |
| Search `searchText LIKE %term%` | Prefix index helps little for leading wildcards. This is acceptable below ~2,000 products (see ADR-007); upgrade to FULLTEXT if the catalogue grows. |
| Product detail by slug | `slug` unique |

Use `select` to fetch only needed columns for cards (`id, title, slug, regularPrice, discountPrice, primary image`). Never `include` full relations on listing pages.

## 6. Migrations & seeding

- Dev: `prisma migrate dev`. Production: `prisma migrate deploy` (see 10 §5).
- `prisma/seed.ts` is idempotent (upserts) and creates:
  - the 7 categories,
  - the `SiteSetting` row with placeholders,
  - the `HomeHero` row,
  - the **predefined admin** from `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` with `mustChangePassword = true` (only if no admin exists, so it never overwrites a changed password),
  - optional demo products/posts when `SEED_DEMO=true`.
