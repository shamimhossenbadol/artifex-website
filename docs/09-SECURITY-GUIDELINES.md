# 09 — Security Guidelines

## 1. Threat model (short)

The public site is read-only. The attack surface is: **admin login** (brute force, session theft), **admin forms** (injection, XSS stored in content), **image uploads** (malicious files, path traversal), **search/query params** (injection, DoS), and **secrets on shared hosting**.

## 2. Admin authentication & sessions

- **Password hashing:** `bcryptjs` (pure JS, no native build), cost 12.
- **Session:** a stateless JWT (HS256, `jose`) in a cookie named `af_session`: `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/`, 7-day expiry with sliding renewal when < 1 day remains.
  Payload: `{ sub: adminId, sv: sessionVersion, mcp: mustChangePassword }`.
- **Every admin request** goes through `requireAdmin()` (in `lib/auth`):
  1. Verify the JWT signature and expiry with `AUTH_SECRET`.
  2. Load the admin by id (a small query) and confirm `sessionVersion` matches. This makes "logout everywhere" and password changes effective immediately.
  3. If `mustChangePassword`, allow only the account/password routes.
  `proxy.ts`/`middleware.ts` only does a cheap cookie-presence redirect for UX. **It is never the security boundary.**
- **Brute-force protection** (DB-backed, no Redis):
  - 5 failed attempts per email in 15 min → that email is locked for 15 min.
  - 20 failed attempts per IP in 15 min → that IP is blocked for 15 min.
  - Generic error message ("Invalid email or password"), with constant-time comparison (bcrypt) even for unknown emails (hash against a dummy).
  - IP comes from `x-forwarded-for` (first hop), set by Apache/Passenger.
- **Logout:** clears the cookie. "Logout everywhere" bumps `sessionVersion`.
- **Password reset:** CLI only (07 §1).

## 3. Input validation

- Zod schemas in `src/lib/validation/*` are shared by client forms (for UX) and Server Actions (authoritative).
- Strings are trimmed with max lengths matching DB columns. Numbers are coerced with `int().min(0).max(100_000_000)`. Slugs follow `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Hex colours follow `^#[0-9A-Fa-f]{6}$`.
- URLs entered by the admin: `mapEmbedUrl` must start with `https://www.google.com/maps/embed`. Social URLs must be `https://` on an allow-listed host. Internal links (`ctaHref`) must start with `/` or `https://`, and `javascript:` is rejected.
- Search query: 2–60 chars. Escape `%`, `_`, and `\` before `LIKE` (Prisma's `contains` handles parameterisation, but wildcards must be escaped explicitly).
- Route params (`slug`, `page`) are validated, and invalid ones return `notFound()`.

## 4. Injection & XSS

- **SQL:** Prisma's query API only. `$queryRaw` with tagged templates only. `Unsafe` variants are banned (lint rule `no-restricted-syntax`).
- **XSS:** React escapes by default. Markdown is rendered with `react-markdown` **without** `rehype-raw`, and links get `rel="noopener noreferrer"` with external `target="_blank"`. Only `http`, `https`, `mailto`, `tel`, and relative URLs are allowed (`urlTransform`).
- JSON-LD: serialise with `<` escaped.
- No `eval`, no `dangerouslySetInnerHTML` (except JSON-LD).

## 5. CSRF

Server Actions are POST-only, and Next.js checks `Origin` against `Host`. Set `serverActions.allowedOrigins` to the production domain in `next.config.ts`. The session cookie is `SameSite=Lax`. Route handlers that mutate (`/api/track`) accept only `POST`, verify `Origin`, and change no privileged state.

## 6. File uploads

- Admin only. One file per request. Size limit 10 MB (`serverActions.bodySizeLimit: '11mb'`).
- Accept only image/jpeg, image/png, and image/webp, **verified by decoding with sharp** (not by extension or client MIME). Reject anything sharp can't decode, and reject dimensions above 8000 px.
- Re-encode to WebP. This strips EXIF/GPS and neutralises polyglot files.
- Object keys are server-generated (`<folder>/<yyyy>/<mm>/<random 12-char hash>-<w>.webp`), so user filenames never reach storage. `folder` comes from a fixed allow-list.
- Only `image/webp` objects are ever written to R2, always with `Content-Type: image/webp`, so the bucket can't be used to host HTML or scripts.
- **Cloudflare R2:**
  - The bucket is public-read **through the custom domain only**. Keep the `r2.dev` URL disabled on the production bucket.
  - Directory listing isn't possible on R2 public buckets.
  - The API token is scoped to *Object Read & Write* on this one bucket. Never use an account-wide token.
  - Delete operations only accept keys that match our key pattern, which stops a buggy or malicious input from deleting other objects.
  - CORS is not configured, because uploads go server→R2. Add CORS (`PUT` from the site origin only) only if the browser-upload fallback is turned on (10 §9).
  - Presigned URLs, used only by the fallback, expire in 5 minutes and are tied to one exact key and content type.

## 7. HTTP security headers (`next.config.ts` → `headers()`)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy:
  default-src 'self';
  img-src 'self' data: blob: https://media.<domain>;   # NEXT_PUBLIC_MEDIA_URL host
  script-src 'self' 'unsafe-inline';          # Next inline bootstrap; tighten with nonces later if feasible
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  frame-src https://www.google.com;            # Maps embed
  connect-src 'self';
  frame-ancestors 'self';
  form-action 'self';
  base-uri 'self';
```
Force HTTPS with a `.htaccess` redirect (10 §7). Turn off `poweredByHeader`.

## 8. Secrets & environment

- Secrets live only in the cPanel Node.js app environment variables (or a `.env` file in the app root with `chmod 600`, outside `public_html`).
- `AUTH_SECRET` is ≥ 32 random bytes (`openssl rand -base64 48`). Rotating it logs everyone out.
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` are server-only. They must never get a `NEXT_PUBLIC_` prefix. Use separate tokens for the dev and production buckets, and rotate them in the Cloudflare dashboard if leaked.
- After the first successful login + password change, **remove `ADMIN_INITIAL_PASSWORD`** from the environment.
- The DB user has privileges only on the app database. In production, skip `GRANT ALL` on `*`.

## 9. Error handling & logging

- Never leak stack traces to users (Next does this in production). Log server errors with `console.error` (it lands in the Passenger/stderr log in cPanel).
- Never log passwords, tokens, or full request bodies.

## 10. Dependency hygiene

- Run `npm audit --omit=dev` before each deploy. Keep Next.js patched; security releases ship quickly, so check the release notes monthly.
- Lockfile committed. Use `npm ci` in builds.

## 11. Backups

- Weekly: cPanel → Backup → download the MySQL dump (or use JetBackup if the plan includes it).
- Monthly: copy the R2 bucket to a local or other-provider folder with `rclone sync r2:artifex-media ./backup/artifex-media` (using a read-only R2 token). Losing the DB means the R2 keys can't be matched to products, so DB backups matter most.
- Before each deploy that includes a migration: take a manual DB dump.
