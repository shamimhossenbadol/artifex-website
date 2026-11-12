// Small, pure auth rules (09 §2): brute-force thresholds, client IP, safe post-login redirect.

export const LOCKOUT_WINDOW_MINUTES = 15;
export const MAX_FAILURES_PER_EMAIL = 5;
export const MAX_FAILURES_PER_IP = 20;
export const LOGIN_ATTEMPT_RETENTION_DAYS = 30;

export const GENERIC_LOGIN_ERROR = "Invalid email or password.";
export const LOCKED_LOGIN_ERROR = `Too many attempts. Please try again in ${LOCKOUT_WINDOW_MINUTES} minutes.`;

export function emailKey(email: string): string {
  return `email:${email.trim().toLowerCase()}`.slice(0, 160);
}

export function ipKey(ip: string): string {
  return `ip:${ip}`.slice(0, 160);
}

/** Locked when either the email or the IP has reached its failure limit in the window. */
export function isLockedOut(failures: { email: number; ip: number }): boolean {
  return failures.email >= MAX_FAILURES_PER_EMAIL || failures.ip >= MAX_FAILURES_PER_IP;
}

/**
 * Visitor IP. The test site sits behind Cloudflare (CF-Connecting-IP); otherwise Apache/Passenger
 * set X-Forwarded-For (first hop). The per-email limit still protects the account if a client
 * forges these headers.
 */
export function clientIp(headers: { get(name: string): string | null }): string {
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf.slice(0, 64);
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.slice(0, 64);
  return headers.get("x-real-ip")?.trim().slice(0, 64) || "unknown";
}

/** Only same-site admin paths are allowed as a post-login redirect (no open redirects). */
export function safeAdminRedirect(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.includes("\\")) {
    return "/admin";
  }
  if (next.startsWith("/admin/login")) return "/admin";
  return next;
}
