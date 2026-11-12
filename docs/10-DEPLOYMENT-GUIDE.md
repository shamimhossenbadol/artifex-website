# 10 — Deployment Guide (Namecheap Shared Hosting / cPanel)

> **Golden rule:** build elsewhere, upload a ready-to-run bundle. Shared hosting doesn't have the RAM/CPU to run `next build`.

## 1. Phase 0 — Verify the hosting environment (do this first)

Log in to cPanel and record the answers in `PROGRESS.md`:

| Check | Where | Requirement |
|---|---|---|
| Plan name | Namecheap dashboard | ✅ **Confirmed 2026-11-12: Stellar** (1 GB RAM, 50% CPU, 20 EP). Enough for our < 300 MB target; upgrade to Stellar Plus only if memory faults appear (ADR-016) |
| **"Setup Node.js App"** present | cPanel → Software | Required |
| Available Node versions | Setup Node.js App → version dropdown | ✅ **Confirmed 2026-11-10: up to 26 available.** Use **24.x** (ADR-015). Ignore the "recommended 14.21.3" label; Node 14 is end-of-life and won't run Next.js |
| SSH / Terminal | cPanel → **Manage Shell** (enable), port **21098** | **Required for automated deploys** (ADR-016). Add the GitHub deploy key under cPanel → SSH Access → Manage SSH Keys → Import, then **Authorize** it |
| Resource limits | cPanel → Resource Usage / sidebar stats | Note **physical memory (RAM)**, **Entry Processes**, **NPROC**, **inodes**, **CPU** |
| MySQL/MariaDB version | cPanel → phpMyAdmin (home shows server version) | MySQL ≥ 5.7 / MariaDB ≥ 10.4 (for JSON) |
| Remote MySQL | cPanel → Remote MySQL | Optional: lets migrations run from a dev machine |
| glibc version | Terminal: `ldd --version` | ≥ 2.17 (needed by sharp's prebuilt binary) |
| Disk quota | cPanel stats | Only the app bundle (~150 MB); images live on Cloudflare R2 |
| Outbound HTTPS | Terminal: `curl -I https://<account-id>.r2.cloudflarestorage.com` | Must connect (the server uploads to R2) |

**Smoke test before Phase 1:** deploy a tiny "hello" Node app through Setup Node.js App, plus a minimal Next.js standalone build (step 4) that renders one page, runs `sharp` once, and **uploads one test object to the dev R2 bucket**. If it runs and memory stays under the limit, the architecture is confirmed. If `sharp` fails to load, use the fallback in §9.

## 2. Accounts & resources to create in cPanel

1. **Domain/SSL:** point the domain to Namecheap DNS, and enable **AutoSSL** (cPanel → SSL/TLS Status).
2. **MySQL database:** cPanel → MySQL® Databases → create DB `<cpuser>_artifex`, user `<cpuser>_artifex`, strong password, add the user to the DB with **ALL PRIVILEGES on this DB only**.
3. **App folder:** `/home/<cpuser>/artifex-app` (outside `public_html`).
4. **Cloudflare R2 and DNS:** see §6. Do this before the first deploy, since image uploads need it.

## 3. Build (on Linux: WSL2 locally, or GitHub Actions)

Windows builds are not used for deploy because `sharp` ships platform-specific binaries. Use WSL2 (Ubuntu) or CI, with **Node 24** on the build machine (`nvm install 24 && nvm use 24` in WSL, or `actions/setup-node` with `node-version: 24` in CI). It must be the same major version as the cPanel app (ADR-015).

`next.config.ts` essentials:
```ts
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  images: { loader: "custom", loaderFile: "./src/lib/image-loader.ts" },
  experimental: { serverActions: { bodySizeLimit: "11mb", allowedOrigins: ["artifexfurniture.com"] } },
  // headers(): see 09 §7
};
```

Build steps (this is what `.github/workflows/ci.yml` runs):
```bash
npm ci                                # postinstall runs `prisma generate`
npm run typecheck && npm run lint && npm test
npm run build                         # next build → .next/standalone
npm run package                       # deploy/artifex-app/ + deploy/artifex-<version>-<sha>.tar.gz
```

`package-standalone.mjs` assembles:
```
artifex-app/
├─ server.js                 # from .next/standalone (Passenger startup file)
├─ .next/                    # standalone .next + copied .next/static
├─ public/                   # copied from repo
├─ node_modules/             # traced deps from standalone (includes linux sharp from Phase 3)
├─ tmp/                      # Passenger restart.txt lives here
├─ BUILD_INFO.json           # version, git sha, build time, Node version
└─ package.json              # no dependencies, so "Run NPM Install" is a harmless no-op
```
No `.env` files and no Prisma CLI are shipped. Migrations and the seed run from CI through an SSH tunnel (ADR-017).
If `sharp` is missing from the trace, the script runs `npm install --os=linux --cpu=x64 --libc=glibc sharp` into the bundle.

## 4. Configure the Node.js application (cPanel → Setup Node.js App → Create)

| Field | Value |
|---|---|
| Node.js version | **24.x** (pick the highest 24.x patch in the dropdown, not the "recommended" 14.21.3). It must match the build machine's major version |
| Application mode | Production |
| Application root | `artifex-app` |
| Application URL | your domain (root) |
| Application startup file | `server.js` |
| Environment variables | `DATABASE_URL` (`mysql://<dbuser>:<pw>@localhost:3306/<dbname>`), `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MEDIA_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `NODE_ENV=production`, `HOSTNAME=127.0.0.1`, `NODE_OPTIONS=--max-old-space-size=512` (set below the plan's RAM limit) |

> `NEXT_PUBLIC_*` vars are inlined at **build time**, so set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_MEDIA_URL` in the build environment too.
> Don't click "Run NPM Install". The bundle already contains `node_modules`. If cPanel insists on a `package.json`, keep `dependencies` empty in the deployed `package.json` so nothing reinstalls.

Passenger hooks `server.listen`, so the standalone `server.js` works as-is (it reads `PORT`; Passenger manages it).

## 5. Upload & release

**First deploy**
> Normally all of this is done by the **Deploy** workflow (§5.1). The manual steps below are the fallback.

1. Upload the `.tar.gz` via File Manager (or `scp -P 21098`) to `/home/<cpuser>/`, then extract it so the files end up in `artifex-app/`.
2. Run migrations from your own machine through an SSH tunnel (ADR-017): `ssh -p 21098 -N -L 3307:127.0.0.1:3306 <cpuser>@<server>`, then in another terminal `DATABASE_URL="mysql://<dbuser>:<pw>@127.0.0.1:3307/<dbname>" npx prisma migrate deploy`. No tunnel possible: apply the SQL from `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` in phpMyAdmin.
3. Seed through the same tunnel: `npm run db:seed` with `DATABASE_URL`, `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` set (idempotent: creates categories, settings, and the admin).
4. In Setup Node.js App, click **Restart**.
5. Visit `/admin/login`, log in with the initial password, and change it. Then **delete the `ADMIN_INITIAL_PASSWORD` GitHub secret** (the seed only needs it while no admin exists). `ADMIN_*` are never set in cPanel.

**Subsequent deploys**
1. Back up the DB (phpMyAdmin export, or `mysqldump` over SSH).
2. Upload the new bundle to `artifex-app-next/`, then swap folders: `mv artifex-app artifex-app-prev && mv artifex-app-next artifex-app`. Images are unaffected because they live in R2.
3. `prisma migrate deploy` (if there are schema changes).
4. Restart: the Restart button, or `touch ~/artifex-app/tmp/restart.txt`.
5. Smoke test (TESTING-GUIDELINES §7). Roll back by swapping back to `artifex-app-prev`.

### 5.1 Automated deploys with GitHub Actions (ADR-016, ADR-017, the default)
`.github/workflows/ci.yml` runs on every push and pull request. `.github/workflows/deploy.yml` is started by hand (GitHub → Actions → **Deploy** → Run workflow) and runs CI first.

**One-time setup**
1. ✅ cPanel → **Manage Shell** → SSH enabled (done 2026-11-12).
2. ✅ Deploy key `artifex-deploy` (ed25519, no passphrase) imported and authorized in cPanel → SSH Access (done 2026-11-12). The private key is on the owner's PC at `C:\Users\<you>\.ssh\artifex-deploy`.
3. cPanel → **MySQL® Databases**: create the database and user (§2) and note the names and password.
4. cPanel → **Setup Node.js App** → create the app (§4) with its runtime env vars. These stay in cPanel only.
   > Test server (ADR-019): steps 3–4 were done over SSH with `uapi Mysql …` and `cloudlinux-selector create --interpreter nodejs …`. The generated values are in `~/artifex-secrets.txt` on the server. The subdomain's DNS record lives in Cloudflare (`artifex` → `198.54.125.98`).
5. GitHub repo → **Settings → Environments → New environment** `production`, then add these **environment secrets**:

| Secret | Value |
|---|---|
| `SSH_HOST` | `198.54.125.98` (or the server hostname) |
| `SSH_PORT` | `21098` |
| `SSH_USER` | the cPanel username |
| `SSH_PRIVATE_KEY` | the full contents of the **private** key file `artifex-deploy` (including the BEGIN/END lines) |
| `SSH_KNOWN_HOSTS` | the server's host keys: the three `[198.54.125.98]:21098 …` lines from `~/.ssh/known_hosts` |
| `PROD_DATABASE_URL` | `mysql://<dbuser>:<url-encoded password>@127.0.0.1:3307/<dbname>` (port **3307** = the tunnel) |
| `ADMIN_EMAIL` | the admin's email (first deploy) |
| `ADMIN_INITIAL_PASSWORD` | temporary password, min 12 chars. Delete this secret after the first login |

6. **Settings → Secrets and variables → Actions → Variables** (repository variables, not secret): `NEXT_PUBLIC_SITE_URL` (e.g. `https://artifexfurniture.com`), `NEXT_PUBLIC_MEDIA_URL` (e.g. `https://media.artifexfurniture.com`), and `HEALTHCHECK_URL` (normally the site URL; leave unset until the domain points at the server).

**What a deploy run does:** CI (typecheck → lint → unit tests → migrations + seed twice on MariaDB 11.4 → build → e2e → package) → upload the bundle with `rsync` to `~/artifex-app-next` → open the tunnel → `mariadb-dump` backup to `~/backups/` (last 10 kept) → `prisma migrate deploy` → seed (optional checkbox) → swap `artifex-app-next` → `artifex-app` (previous kept as `artifex-app-prev`) → `touch tmp/restart.txt` → health check (12 tries over ~1 min). If the health check fails it moves the new release to `~/artifex-app-failed`, restores `artifex-app-prev`, and restarts again.

## 6. Images on Cloudflare R2 (ADR-014)

Images are stored in and served from Cloudflare R2. The shared host only does the upload processing.

### 6.1 Move the domain's DNS to Cloudflare (once)
R2 custom domains require the domain's DNS zone to be on Cloudflare. The domain **stays registered at Namecheap** and the site **stays hosted on Namecheap**; only the nameservers change.
1. Create a free Cloudflare account, then **Add a site** with your domain on the Free plan.
2. Cloudflare scans the existing records. **Check that every record from Namecheap/cPanel is there before switching**: the `A` record for `@` and `www` (the hosting IP), `mail`, `cpanel`/`webmail`, the `MX` records, `TXT` (SPF/DKIM/DMARC), and any verification records. Compare against cPanel → Zone Editor.
3. Set the website's `@` and `www` records to **DNS only (grey cloud)** to start. Mail-related records must always be DNS only.
4. In Namecheap → Domain List → Manage → Nameservers → **Custom DNS**, enter the two Cloudflare nameservers. Propagation usually takes minutes, occasionally up to 24 h.
5. cPanel AutoSSL keeps working for the main domain because the records are DNS only.

### 6.2 Create the buckets
1. Cloudflare dashboard → R2 → create bucket **`artifex-media`**. Pick location hint **Asia-Pacific** if offered, since visitors are in Bangladesh.
2. Bucket → Settings → **Custom Domains → Connect domain** → `media.<domain>`. Cloudflare creates the DNS record and certificate automatically.
3. Keep **Public Development URL (r2.dev) disabled** on the production bucket.
4. Create **`artifex-media-dev`** for local development. Enabling its r2.dev URL is fine, and that URL becomes the dev `NEXT_PUBLIC_MEDIA_URL`.
5. R2 → Manage R2 API Tokens → Create token → permission **Object Read & Write**, limited to `artifex-media`. Copy the Access Key ID, Secret, and Account ID into the cPanel Node app env vars. Create a separate token for the dev bucket.
6. Optional: under the custom domain's zone, add a Cache Rule for `media.<domain>/*` with **Edge TTL: respect origin**. The objects already carry immutable `Cache-Control`.

### 6.3 Verify
- Upload a test image in admin, then confirm `curl -I https://media.<domain>/<key>-960.webp` returns `200`, `content-type: image/webp`, `cache-control: public, max-age=31536000, immutable`, and on repeat `cf-cache-status: HIT`.
- The product page loads its images from `media.<domain>`, and the CSP `img-src` contains that host.

### 6.4 Optional later: proxy the whole site through Cloudflare
Turning the `@`/`www` records to **Proxied (orange cloud)** gives CDN, DDoS protection, and Brotli for HTML too. Before doing it: set SSL/TLS mode to **Full (strict)**, make sure the real visitor IP is used for login rate-limiting (read `CF-Connecting-IP`; 09 §2), and test admin login and Server Actions. Record it as a new ADR.

### 6.5 Costs
The R2 free tier covers 10 GB storage, 1M writes and 10M reads per month, and egress is always free. This catalogue (~1,000 products × 6 images × 3 variants ≈ 2–3 GB) stays inside it.

## 7. `.htaccess` for the main domain

Passenger writes its own directives into `public_html/.htaccess`. **Add** the following above them (don't remove Passenger's block):
```
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
# Optional: www → apex
RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]
```

## 8. Operations

- **Logs:** `~/artifex-app/stderr.log` (Passenger), or the log path shown in Setup Node.js App.
- **Restart:** the Restart button, or `touch tmp/restart.txt`.
- **Reset admin password:** `cd ~/artifex-app && source <nodevenv activate> && node scripts/admin-reset-password.js --email <admin email>`.
- **Resource faults:** cPanel → Resource Usage. If you see memory faults, lower `NODE_OPTIONS` heap and check for very large uploads (they're processed one at a time).
- **Image upload errors:** check `stderr.log` for R2 responses. A `403` means a wrong or expired token or the wrong bucket name; a network error means outbound HTTPS is blocked, so contact Namecheap support.
- **Backups:** see 09 §11.

## 9. Fallbacks & known issues

| Problem | Fallback |
|---|---|
| `sharp` won't load on the server | Do image processing **in the admin's browser** (canvas → WebP at 480/960/1600). The server issues a 5-minute presigned PUT URL per variant (`aws4fetch`), the browser uploads **straight to R2**, and the server then confirms the objects exist (HEAD) before saving the DB row. Needs CORS on the bucket (`PUT` from the site origin only). Switch with the env flag `IMAGE_PROCESSING=client`. Record an ADR. |
| Outbound HTTPS to R2 blocked by the host | Use the same browser-direct presigned upload as above. Only the presigning happens on the server, and that needs no network access |
| Node 24 disappears from the dropdown in future | Switch to the next LTS offered (26), rebuild with that version, and record an ADR |
| Memory faults at idle | Check `NODE_OPTIONS`, ensure a single instance, and lower the Prisma pool to 3 |
| App sleeps / cold starts (Passenger idles apps) | Acceptable; the first hit is ~1–3 s. Optionally use an external uptime ping every 5 min (UptimeRobot free) |
| Migrations can't run on the server | Use Remote MySQL (Option B), or apply the SQL from `prisma migrate diff --script` via phpMyAdmin |
