# Production launch — artifexfurniturebd.com

> Moving the site from the test server (`artifex.codespherestudio.site`) to the official domain **artifexfurniturebd.com** on the new **Namecheap cPanel** hosting, with images in a **new Cloudflare account's R2**. The official site starts **fresh**: default categories, business settings and a new admin login; real products are added in the admin (no data is copied from the test site). Decided 2026-11-14 (ADR-047).
>
> **Status 2026-11-14:** Steps 1, 5, 6 (except the R2 keys) and 7 done by the agent over SSH and the GitHub CLI; secrets are in `~/artifex-secrets.txt` on the server (cPanel → File Manager, show hidden files). Remaining: Cloudflare DNS (2), R2 (3) + adding the three R2 keys to the app, SSL/.htaccess (4), then `HEALTHCHECK_URL` and the first deploy.
>
> Work top to bottom and tick each box. Steps marked **(owner)** need your accounts; everything else the developer/agent can do once the values exist. Details for each cPanel/R2 screen are in [10-DEPLOYMENT-GUIDE.md](10-DEPLOYMENT-GUIDE.md).

## The values you'll collect (keep them in a password manager, never in chat or Git)

| Name | Example | From |
|---|---|---|
| Server IP | **162.0.235.19** (confirmed 2026-11-14) | cPanel → right sidebar "Shared IP Address" |
| cPanel username | **artifexfurniture** (confirmed) | cPanel → right sidebar |
| SSH port | `21098` | Namecheap default |
| DB name / user / password | `artixyz_artifex` / `artixyz_artifex` / strong password | cPanel → MySQL® Databases |
| `AUTH_SECRET` | 64 random characters | `openssl rand -base64 48` (new one: never reuse the test site's) |
| R2 Account ID | 32 hex characters | Cloudflare → R2 → right side "Account ID" |
| R2 Access Key ID / Secret | — | Cloudflare → R2 → Manage API tokens |
| Admin email + temporary password | your email + 12+ characters | you choose |

---

## Step 1 — Check the new hosting (owner, 10 min)

- [ ] Log in to the new cPanel. Under **Software** there is **Setup Node.js App**, and its version list includes **24.x**.
- [ ] **Advanced → Manage Shell** (or "Terminal"/"SSH Access"): **enable SSH**. Note the server IP and cPanel username.
- [ ] **MySQL® Databases**: create database `<cpuser>_artifex` and user `<cpuser>_artifex` with a strong password; **Add User To Database** with **ALL PRIVILEGES**.

## Step 2 — Cloudflare: take over the domain's DNS (owner, 15 min + propagation)

R2 can only serve images from `media.artifexfurniturebd.com` if the domain's DNS is on the same Cloudflare account as the bucket.

- [ ] New Cloudflare account → **Add a domain** → `artifexfurniturebd.com` → **Free** plan.
- [ ] Check the imported records against cPanel → **Zone Editor**. You need at least:
  - `A` `@` → **new server IP**, **DNS only (grey cloud)**
  - `A` `www` → **new server IP** (or `CNAME www → artifexfurniturebd.com`), **DNS only**
  - any `MX`/`TXT` (SPF, DKIM) records cPanel created for email, **DNS only**
- [ ] Namecheap → **Domain List → Manage → Nameservers → Custom DNS** → paste the two Cloudflare nameservers. Wait until Cloudflare shows the domain as **Active** (minutes, at most 24 h).
- [ ] Keep the website records **grey (DNS only)** for now: cPanel's free SSL (AutoSSL) needs that. Proxying through Cloudflare can come later (10 §6.4).

## Step 3 — Cloudflare R2: the image bucket (owner, 10 min)

- [ ] Cloudflare → **R2** → enable R2 (free tier; a card may be required) → **Create bucket** `artifex-media`, location **Asia-Pacific**.
- [ ] Bucket → **Settings → Custom Domains → Connect domain** → `media.artifexfurniturebd.com`. Cloudflare adds the DNS record and certificate itself.
- [ ] Keep **Public Development URL (r2.dev)** **disabled**.
- [ ] **R2 → Manage API tokens → Create API token**: permission **Object Read & Write**, **only** bucket `artifex-media`. Copy the **Access Key ID**, **Secret Access Key** and the **Account ID**.

## Step 4 — SSL and HTTPS on the new hosting (owner, 5 min, after Step 2 is Active)

- [ ] cPanel → **SSL/TLS Status**: wait until `artifexfurniturebd.com` and `www.artifexfurniturebd.com` show valid certificates. On the test account AutoSSL couldn't be started by hand (Namecheap runs it automatically, usually within a few hours of the DNS pointing at the server); if it hasn't run after a day, ask Namecheap support to run AutoSSL for the domain.
- [ ] HTTPS + `www` → apex redirect: add the `.htaccess` lines from **10 §7** above Passenger's block in `public_html/.htaccess` (do this after Step 6 creates the app, so Passenger's block exists).

## Step 5 — Deploy key (owner + developer, 10 min)

The GitHub Deploy workflow logs in to the server with an SSH key.

- [x] cPanel → **SSH Access → Manage SSH Keys → Import Key** (done and login verified 2026-11-14): name `artifex-deploy`, paste the **public** key from `C:\Users\<you>\.ssh\artifex-deploy.pub` (the same key as the test server is fine) → **Authorize**.
- [ ] Get the server's host keys (on your PC, PowerShell or Git Bash):
  ```bash
  ssh-keyscan -p 21098 <server IP>
  ```
  Keep the three lines it prints: they are `SSH_KNOWN_HOSTS` in Step 7.
- [ ] Test the login: `ssh -p 21098 -i ~/.ssh/artifex-deploy <cpuser>@<server IP>` prints a shell prompt.

## Step 6 — Create the Node.js app (owner, 10 min)

cPanel → **Setup Node.js App → Create Application**:

| Field | Value |
|---|---|
| Node.js version | highest **24.x** |
| Application mode | Production |
| Application root | `artifex-app` |
| Application URL | `artifexfurniturebd.com` (root) |
| Application startup file | `server.js` |

Environment variables (**Add Variable** for each):

| Name | Value |
|---|---|
| `DATABASE_URL` | `mysql://<dbuser>:<url-encoded password>@localhost:3306/<dbname>` |
| `AUTH_SECRET` | the new random secret |
| `NEXT_PUBLIC_SITE_URL` | `https://artifexfurniturebd.com` |
| `NEXT_PUBLIC_MEDIA_URL` | `https://media.artifexfurniturebd.com` |
| `R2_ACCOUNT_ID` | from Step 3 |
| `R2_ACCESS_KEY_ID` | from Step 3 |
| `R2_SECRET_ACCESS_KEY` | from Step 3 |
| `R2_BUCKET` | `artifex-media` |
| `NODE_ENV` | `production` |
| `HOSTNAME` | `127.0.0.1` |
| `NODE_OPTIONS` | `--max-old-space-size=512` |

- [ ] **Create**. Don't click "Run NPM Install" (the deploy uploads a ready bundle). The app shows a placeholder until the first deploy.
- [ ] URL-encode special characters in the DB password inside `DATABASE_URL` (`@` → `%40`, `#` → `%23`, `/` → `%2F`, `:` → `%3A`), or pick a password with only letters and digits.

## Step 7 — Point GitHub at the new server (owner sets secrets; developer can set variables)

GitHub → repository **Settings → Environments → production** → update the **environment secrets**:

| Secret | New value |
|---|---|
| `SSH_HOST` | new server IP |
| `SSH_PORT` | `21098` |
| `SSH_USER` | new cPanel username |
| `SSH_PRIVATE_KEY` | contents of `artifex-deploy` (private key; unchanged if you reused the key) |
| `SSH_KNOWN_HOSTS` | the three lines from Step 5 |
| `PROD_DATABASE_URL` | `mysql://<dbuser>:<url-encoded password>@127.0.0.1:3307/<dbname>` (port **3307**: the deploy's tunnel) |
| `ADMIN_EMAIL` | the admin's email for the official site |
| `ADMIN_INITIAL_PASSWORD` | a temporary password (12+ characters); deleted after Step 8 |

**Settings → Secrets and variables → Actions → Variables** (repository variables):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://artifexfurniturebd.com` |
| `NEXT_PUBLIC_MEDIA_URL` | `https://media.artifexfurniturebd.com` |
| `HEALTHCHECK_URL` | `https://artifexfurniturebd.com` |

> From this point the **Deploy** button deploys to the official site. The test site stops receiving updates (see Step 10).

## Step 8 — First deploy and admin login

- [ ] GitHub → **Actions → Deploy → Run workflow** with **Run the idempotent seed** ticked. It runs all tests, uploads the build, creates the tables, seeds the default categories, settings and admin, restarts the app and checks the homepage.
- [ ] Open `https://artifexfurniturebd.com/admin/login`, sign in with `ADMIN_EMAIL` + the temporary password, and **choose a new password** when asked.
- [ ] **Delete the `ADMIN_INITIAL_PASSWORD` secret** in GitHub (it's only needed while no admin exists).

## Step 9 — Fill in the content (owner, in the admin)

- [ ] **Settings**: check business name, phone, WhatsApp number, address, opening hours, Facebook/Instagram/YouTube links, the share image (SEO tab) and the **Facebook Pixel ID** (Tracking tab).
- [ ] **Categories**: a photo for each, order, "Show on the homepage".
- [ ] **Products**: add real products with up to 5 photos each (1 main + 4 gallery).
- [ ] **Homepage**: hero text and 2–5 hero photos; optional promo banners.
- [ ] **Journal** (optional): first posts.

## Step 10 — Launch checks (developer + owner)

- [ ] `http://artifexfurniturebd.com` and `https://www.artifexfurniturebd.com` both end at `https://artifexfurniturebd.com`.
- [ ] Upload one product photo; it appears on the site from `https://media.artifexfurniturebd.com/...`.
- [ ] Phone check: homepage, a product page (WhatsApp + Messenger buttons), contact page, search, menu.
- [ ] `https://artifexfurniturebd.com/sitemap.xml` and `/robots.txt` list the new domain.
- [ ] Admin → Challan: print a test challan.
- [ ] **Google Search Console**: add the domain property `artifexfurniturebd.com` (DNS TXT record in Cloudflare), then submit `https://artifexfurniturebd.com/sitemap.xml`.
- [ ] **Meta Business**: verify the domain `artifexfurniturebd.com` (DNS TXT in Cloudflare) so the Pixel's events count for ads; check events in **Events Manager → Test events**.
- [ ] Facebook link preview: paste the homepage into the [Sharing Debugger](https://developers.facebook.com/tools/debug/) and click **Scrape again**.
- [ ] PageSpeed Insights on the homepage and a product page (mobile).
- [ ] **Retire the test site**: in the old cPanel, stop or remove the `artifex` Node.js app (or point it at a "moved" page) so search engines don't index two copies. Delete the old R2 API token when you're sure nothing uses it.

## If something goes wrong

| Symptom | Likely cause / fix |
|---|---|
| Deploy fails at **Configure SSH** | Wrong `SSH_PRIVATE_KEY` (must be the private key, all lines) or key not **Authorized** in cPanel |
| Deploy fails at **Apply migrations** | `PROD_DATABASE_URL` wrong (port must be 3307; password URL-encoded), or user not added to the DB |
| Deploy fails at **Health check** | The app env vars in cPanel (Step 6), or DNS/SSL not ready yet. The workflow rolls back automatically; check `~/artifex-app/stderr.log` |
| Build refuses to start: "NEXT_PUBLIC_MEDIA_URL … must be the R2 media domain" | The two GitHub variables are the same URL; `NEXT_PUBLIC_MEDIA_URL` must be `https://media.artifexfurniturebd.com` |
| Photos don't appear after upload | `media.artifexfurniturebd.com` not connected to the bucket yet, or wrong R2 token/bucket in Step 6 |
| Admin login says "Something went wrong" | `AUTH_SECRET` missing/short in Step 6 (needs 32+ characters) |
