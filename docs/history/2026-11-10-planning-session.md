# Planning Session Record — 2026-11-10

> A permanent record of the original planning chat, kept because the chat itself is being deleted.
> The full raw transcript is in `2026-11-10-planning-chat-export.zip` (same folder).
> **Authoritative project state is in the docs** (`AGENTS.md`, `PROGRESS.md`, `DECISIONS.md`, `docs/*`). This file explains *how we got there*.

---

## 1. What the owner asked for (in order)

1. **Initial brief** (`initial-prompt.txt` in the repo root, kept unchanged): build a simple but premium catalogue website for Artifex Furniture. It's a demo, so explore competitors like HATIL. The Facebook page is https://www.facebook.com/profile.php?id=61560352716152. It must have a predefined admin panel where the password can be changed. **For now, only make the plan and the Markdown files; coding comes later.** Development will rely on the MD files rather than the chat, so all progress and updates must be kept in MD files.
2. **"We will use Cloudflare R2 bucket for images."**
3. **"The Namecheap cPanel shows Node versions up to 26, but the recommended version is 14.21.3."**
4. **"I'm deleting the chat, so keep a backup in the project for later use."** That's this file and the zip.

## 2. What was produced

| Step | Result |
|---|---|
| 1 | The full documentation set: `AGENTS.md`, `PROGRESS.md`, `DECISIONS.md` (ADR-001…013), `CHANGELOG.md`, `README.md`, `docs/01`–`12`, `docs/TESTING-GUIDELINES.md` |
| 2 | ADR-014: images are processed on the server with sharp, uploaded to **Cloudflare R2** with `aws4fetch`, and served from `https://media.<domain>`. The domain's DNS has to move to Cloudflare (it stays registered and hosted at Namecheap). This replaced ADR-013 (local disk) |
| 3 | ADR-015: use **Node.js 24 LTS** on cPanel and on the build machine, and ignore the "recommended 14.21.3" label (Node 14 is end-of-life and can't run Next.js) |
| 4 | This record + the transcript zip in `docs/history/` |

## 3. Research findings (from the chat)

- **Facebook page:** only the page title could be read without logging in. It confirmed **"Artifex Furniture – Dhaka"**. Everything else (address, phone, hours, products) is still to be supplied by the owner.
- **HATIL (hatil.com):** the site renders client-side, so fetching it returned only a loading GIF, which is itself a lesson: avoid a heavy JS shell that delays content. The competitor comparison in `docs/01 §6` (HATIL, Otobi, Brothers, Navana, Akhtar, Regal, plus West Elm, HAY, Muuto and Kave Home as international references) is based on general knowledge, not a live crawl. Re-verify specifics if needed.
- **Next.js on Namecheap shared hosting** (third-party sources; Namecheap publishes no official numbers):
  - cPanel runs Node apps via **Phusion Passenger under CloudLinux** limits (RAM, entry processes, NPROC).
  - **Don't build on the server**: it doesn't have enough memory. Build locally (WSL/CI) and upload.
  - Run **one** Node process. Check cPanel → Resource Usage for "faults" if the app gets killed.
  - Typical RAM caps on shared hosting are 512 MB–2 GB, so check your own plan.
  - Sources: [DEV: Deploy Next.js on cPanel with Passenger](https://dev.to/sumeet_shrofffreelancer_/deploy-nextjs-on-cpanelwhm-with-phusion-passenger-de4) · [DEV: Next.js on $5 shared hosting](https://dev.to/bravian1/how-i-hosted-nextjs-on-5-shared-hosting-4mg) · [Fixing Node.js 503 on shared hosting](https://coldfusion-example.blogspot.com/2026/02/fixing-nodejs-503-service-unavailable.html) · [Node.js hosting 2026: shared hosting limits](https://blog.webhostmost.com/nodejs-hosting-2026-shared-hosting-problems/)

## 4. Key decisions at a glance (details in `DECISIONS.md`)

| ADR | Decision |
|---|---|
| 001 | Catalogue + WhatsApp inquiry only. No cart, checkout, payments, or customer accounts |
| 002 | Next.js App Router, `output: "standalone"`, one Passenger process, built on Linux and uploaded as a zip |
| 003 | MySQL/MariaDB from cPanel, utf8mb4 |
| 004 | Prisma with a JS driver adapter (no Rust engine binary) |
| 005 | Images processed once at upload into 480/960/1600 WebP variants, with a custom `next/image` loader |
| 006 | One predefined admin seeded from env, forced password change on first login, change password in the panel, JWT cookie + `sessionVersion`, CLI password reset over SSH |
| 007 | Search = multi-term `LIKE` on a denormalised `searchText` column |
| 008 | Markdown for blog, product description, and about (no raw HTML) |
| 009 | Tailwind + our own small UI primitives, no component library |
| 010 | Prices are integer BDT, where `null` = "Price on request" |
| 011 | Cached pages with tag-based revalidation on admin save |
| 012 | No contact form, analytics, or cookies in v1 |
| 013 | ~~Local disk images~~, superseded by 014 |
| 014 | **Cloudflare R2** for image storage and delivery (`media.<domain>`) |
| 015 | **Node.js 24 LTS** |

Design direction: warm ivory `#F8F6F2`, ink `#1C1A17`, walnut accent `#7A5235`, Cormorant Garamond headings + Inter body, 4:5 product photos, no gradients, sliders, or pop-ups.

## 5. Where things stood when the chat ended

- Phase 0 (planning) docs are complete. **No code has been written yet.**
- Confirmed hosting fact: cPanel offers Node up to 26, and we use 24.
- Still to do in Phase 0: record the Namecheap plan, RAM/EP/NPROC limits, MySQL version, and SSH access. Set up Cloudflare (DNS move, buckets, tokens). Run the hosting smoke test.
- 11 open questions for the owner are listed in `PROGRESS.md` (domain, logo, WhatsApp number, address, photos, DNS/email, Cloudflare account, …).

## 6. How to resume in a new chat

Paste this to the AI agent:

> Read AGENTS.md, then PROGRESS.md, then the docs relevant to the next unchecked task in docs/12-DEVELOPMENT-ROADMAP.md. Background on how the plan was made is in docs/history/. Implement that task, then update the roadmap, PROGRESS.md and CHANGELOG.md before finishing.
