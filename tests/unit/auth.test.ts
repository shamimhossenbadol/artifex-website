import { describe, expect, it } from "vitest";
import { hashPassword, validateNewPassword, verifyPassword } from "@/lib/auth/password";
import {
  clientIp,
  emailKey,
  isLockedOut,
  MAX_FAILURES_PER_EMAIL,
  MAX_FAILURES_PER_IP,
  safeAdminRedirect,
} from "@/lib/auth/rules";
import {
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
  shouldRenew,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/session-token";
import { changePasswordSchema, loginSchema } from "@/lib/validation/auth";

const SECRET = "x".repeat(48);
const CLAIMS = { adminId: 7, sessionVersion: 3, mustChangePassword: true };

describe("password hashing", () => {
  it("hashes with bcrypt and verifies", async () => {
    const hashed = await hashPassword("correct horse battery");
    expect(hashed).toMatch(/^\$2[aby]\$12\$/);
    expect(await verifyPassword("correct horse battery", hashed)).toBe(true);
    expect(await verifyPassword("wrong", hashed)).toBe(false);
  }, 10_000);
});

describe("validateNewPassword", () => {
  const ctx = { currentPassword: "Old-Password-1", email: "owner@example.com" };
  it("accepts a good password", () => {
    expect(validateNewPassword("Walnut-Sofa-2026", ctx)).toBeNull();
  });
  it.each([
    ["short", /at least 10/],
    ["Old-Password-1", /different from your current/],
    ["Owner@Example.com", /can't be your email/],
    ["password123", /too easy/],
    ["aaaaaaaaaaaa", /too easy/],
  ])("rejects %s", (password, message) => {
    expect(validateNewPassword(password, ctx)).toMatch(message);
  });
});

describe("session token", () => {
  it("round-trips the claims", async () => {
    const token = await signSessionToken(CLAIMS, SECRET);
    const session = await verifySessionToken(token, SECRET);
    expect(session).toMatchObject(CLAIMS);
  });

  it("rejects a wrong secret, a tampered token and garbage", async () => {
    const token = await signSessionToken(CLAIMS, SECRET);
    expect(await verifySessionToken(token, "y".repeat(48))).toBeNull();
    const [h, p, s] = token.split(".");
    const tampered = `${h}.${Buffer.from(JSON.stringify({ sub: "1", sv: 3, mcp: false })).toString("base64url")}.${s}`;
    expect(p).toBeDefined();
    expect(await verifySessionToken(tampered, SECRET)).toBeNull();
    expect(await verifySessionToken("not-a-jwt", SECRET)).toBeNull();
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const issued = Math.floor(Date.now() / 1000) - SESSION_MAX_AGE_SECONDS - 60;
    const token = await signSessionToken(CLAIMS, SECRET, issued);
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it("renews only in the last day", async () => {
    const now = Math.floor(Date.now() / 1000);
    const fresh = await verifySessionToken(await signSessionToken(CLAIMS, SECRET, now), SECRET);
    expect(shouldRenew(fresh!, now)).toBe(false);
    expect(shouldRenew(fresh!, now + SESSION_MAX_AGE_SECONDS - 3600)).toBe(true);
  });

  it("uses Secure cookies only on https sites", () => {
    expect(sessionCookieOptions("https://artifex.example")).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    });
    expect(sessionCookieOptions("http://localhost:3100").secure).toBe(false);
  });
});

describe("lockout rules", () => {
  it("locks at 5 failures per email or 20 per IP", () => {
    expect(isLockedOut({ email: MAX_FAILURES_PER_EMAIL - 1, ip: 0 })).toBe(false);
    expect(isLockedOut({ email: MAX_FAILURES_PER_EMAIL, ip: 0 })).toBe(true);
    expect(isLockedOut({ email: 0, ip: MAX_FAILURES_PER_IP })).toBe(true);
  });
  it("normalises email keys", () => {
    expect(emailKey("  Owner@Example.COM ")).toBe("email:owner@example.com");
  });
});

describe("clientIp", () => {
  const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n] ?? null });
  it("prefers Cloudflare's header, then the first X-Forwarded-For hop", () => {
    expect(clientIp(headers({ "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe(
      "1.2.3.4",
    );
    expect(clientIp(headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(clientIp(headers({}))).toBe("unknown");
  });
});

describe("safeAdminRedirect", () => {
  it.each([
    [undefined, "/admin"],
    ["/admin/products?x=1", "/admin/products?x=1"],
    ["https://evil.example/admin", "/admin"],
    ["//evil.example", "/admin"],
    ["/admin\\..\\x", "/admin"],
    ["/products", "/admin"],
    ["/admin/login", "/admin"],
  ])("%s → %s", (input, output) => {
    expect(safeAdminRedirect(input)).toBe(output);
  });
});

describe("auth schemas", () => {
  it("lowercases the login email", () => {
    expect(loginSchema.parse({ email: " Owner@Example.com ", password: "x" }).email).toBe(
      "owner@example.com",
    );
  });
  it("requires matching new passwords", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "a",
      newPassword: "b",
      confirmPassword: "c",
    });
    expect(r.success).toBe(false);
  });
});
