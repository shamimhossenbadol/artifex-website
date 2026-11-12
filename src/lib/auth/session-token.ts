// Admin session token (09 §2): a stateless HS256 JWT signed with AUTH_SECRET.
// Payload: { sub: adminId, sv: sessionVersion, mcp: mustChangePassword }. Used by the auth service
// (server) and by proxy.ts (sliding renewal), so it has no Next.js or database imports.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "af_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
/** Renew when less than this is left (sliding expiry, 09 §2). */
export const SESSION_RENEW_BELOW_SECONDS = 24 * 60 * 60;

export type SessionClaims = {
  adminId: number;
  sessionVersion: number;
  mustChangePassword: boolean;
};

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  claims: SessionClaims,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): Promise<string> {
  return new SignJWT({ sv: claims.sessionVersion, mcp: claims.mustChangePassword })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(claims.adminId))
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_MAX_AGE_SECONDS)
    .sign(key(secret));
}

export type VerifiedSession = SessionClaims & { expiresAt: number };

/** Returns the claims, or null for a missing, tampered, malformed or expired token. */
export async function verifySessionToken(
  token: string | undefined,
  secret: string,
): Promise<VerifiedSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    const adminId = Number(payload.sub);
    if (!Number.isInteger(adminId) || adminId < 1) return null;
    if (typeof payload.sv !== "number" || typeof payload.mcp !== "boolean") return null;
    if (typeof payload.exp !== "number") return null;
    return {
      adminId,
      sessionVersion: payload.sv,
      mustChangePassword: payload.mcp,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}

export function shouldRenew(
  session: VerifiedSession,
  now = Math.floor(Date.now() / 1000),
): boolean {
  return session.expiresAt - now < SESSION_RENEW_BELOW_SECONDS;
}

/** Cookie options (09 §2): HttpOnly, SameSite=Lax, Secure on https sites, 7 days. */
export function sessionCookieOptions(siteUrl: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: siteUrl.startsWith("https://"),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
