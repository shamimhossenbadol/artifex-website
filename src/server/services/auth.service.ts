// Admin authentication (07 §1, 09 §2). The session cookie is a signed JWT, but every admin request
// also loads the admin from the DB and checks sessionVersion, so "logout everywhere" and password
// changes take effect immediately. requireAdmin() is the security boundary, not proxy.ts.
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverEnv } from "@/lib/env";
import { DUMMY_HASH, hashPassword, validateNewPassword, verifyPassword } from "@/lib/auth/password";
import {
  GENERIC_LOGIN_ERROR,
  LOCKED_LOGIN_ERROR,
  LOCKOUT_WINDOW_MINUTES,
  LOGIN_ATTEMPT_RETENTION_DAYS,
  clientIp,
  emailKey,
  ipKey,
  isLockedOut,
} from "@/lib/auth/rules";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/session-token";
import * as admins from "@/server/repositories/admin.repo";

export type CurrentAdmin = {
  id: number;
  email: string;
  name: string;
  mustChangePassword: boolean;
};

export const PASSWORD_CHANGE_PATH = "/admin/account/password";

function toCurrent(row: admins.AdminRow): CurrentAdmin {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    mustChangePassword: row.mustChangePassword,
  };
}

/** Issues (or re-issues) the session cookie. Only callable from Server Actions / route handlers. */
async function setSessionCookie(row: admins.AdminRow): Promise<void> {
  const env = serverEnv();
  const token = await signSessionToken(
    {
      adminId: row.id,
      sessionVersion: row.sessionVersion,
      mustChangePassword: row.mustChangePassword,
    },
    env.AUTH_SECRET,
  );
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(env.NEXT_PUBLIC_SITE_URL));
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in admin, or null. Verifies the JWT and the sessionVersion against the DB. */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, serverEnv().AUTH_SECRET);
  if (!session) return null;
  const row = await admins.findAdminById(session.adminId);
  if (!row || row.sessionVersion !== session.sessionVersion) return null;
  return toCurrent(row);
}

/**
 * Call at the top of every admin page and Server Action (AGENTS §4.5). Redirects to the login page
 * when signed out, and to the password page while a password change is required (07 §1).
 */
export async function requireAdmin(options: { allowPasswordChange?: boolean } = {}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword && !options.allowPasswordChange) redirect(PASSWORD_CHANGE_PATH);
  return admin;
}

export type LoginResult = { ok: true; mustChangePassword: boolean } | { ok: false; error: string };

/** Email + password login with DB-backed brute-force limits (09 §2). */
export async function login(email: string, password: string): Promise<LoginResult> {
  const ip = clientIp(await headers());
  const keys = [emailKey(email), ipKey(ip)];
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000);
  const [emailFailures, ipFailures] = await Promise.all([
    admins.countFailures(keys[0]!, since),
    admins.countFailures(keys[1]!, since),
  ]);
  if (isLockedOut({ email: emailFailures, ip: ipFailures })) {
    return { ok: false, error: LOCKED_LOGIN_ERROR };
  }

  const row = await admins.findAdminByEmail(email);
  // Always run bcrypt, even for unknown emails, so timing doesn't reveal which emails exist.
  const valid = await verifyPassword(password, row?.passwordHash ?? DUMMY_HASH);

  // Opportunistic pruning (no cron on shared hosting, 04 §4).
  if (Math.random() < 0.05) {
    void admins
      .pruneAttempts(new Date(Date.now() - LOGIN_ATTEMPT_RETENTION_DAYS * 86_400_000))
      .catch((err: unknown) => console.error("[auth.pruneAttempts]", err));
  }

  if (!row || !valid) {
    await admins.recordAttempts(keys, false);
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  await Promise.all([
    admins.recordAttempts([keys[0]!], true),
    admins.clearFailures(keys[0]!),
    admins.recordLogin(row.id),
  ]);
  await setSessionCookie(row);
  return { ok: true, mustChangePassword: row.mustChangePassword };
}

export type ChangeResult = { ok: true } | { ok: false; field?: string; error: string };

/** 07 §1: verify current, apply the rules, re-hash, clear the flag, bump sessionVersion, re-issue. */
export async function changePassword(
  admin: CurrentAdmin,
  currentPassword: string,
  newPassword: string,
): Promise<ChangeResult> {
  const row = await admins.findAdminById(admin.id);
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    return { ok: false, field: "currentPassword", error: "Your current password is incorrect." };
  }
  const problem = validateNewPassword(newPassword, { currentPassword, email: row.email });
  if (problem) return { ok: false, field: "newPassword", error: problem };
  const updated = await admins.updatePassword(row.id, await hashPassword(newPassword));
  await setSessionCookie(updated); // this device stays signed in; others are logged out
  return { ok: true };
}

/** Name/email update; changing the email requires the current password (07 §1). */
export async function updateProfile(
  admin: CurrentAdmin,
  data: { name: string; email: string; currentPassword?: string },
): Promise<ChangeResult> {
  if (data.email !== admin.email) {
    const row = await admins.findAdminById(admin.id);
    if (
      !row ||
      !data.currentPassword ||
      !(await verifyPassword(data.currentPassword, row.passwordHash))
    ) {
      return {
        ok: false,
        field: "currentPassword",
        error: "Enter your current password to change your email.",
      };
    }
    const taken = await admins.findAdminByEmail(data.email);
    if (taken && taken.id !== admin.id) {
      return { ok: false, field: "email", error: "That email is already in use." };
    }
  }
  await admins.updateProfile(admin.id, { name: data.name, email: data.email });
  return { ok: true };
}

/** Bumps sessionVersion (every device is signed out), then signs this device back in. */
export async function logoutEverywhere(admin: CurrentAdmin): Promise<void> {
  const updated = await admins.bumpSessionVersion(admin.id);
  await setSessionCookie(updated);
}
