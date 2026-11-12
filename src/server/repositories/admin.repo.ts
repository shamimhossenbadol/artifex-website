// Admin user + login attempt queries (07 §1, 09 §2).
import { db } from "@/lib/db";

const ADMIN_SELECT = {
  id: true,
  email: true,
  name: true,
  passwordHash: true,
  mustChangePassword: true,
  sessionVersion: true,
} as const;

export type AdminRow = NonNullable<Awaited<ReturnType<typeof findAdminById>>>;

export function findAdminById(id: number) {
  return db.adminUser.findUnique({ where: { id }, select: ADMIN_SELECT });
}

export function findAdminByEmail(email: string) {
  return db.adminUser.findUnique({ where: { email }, select: ADMIN_SELECT });
}

export function recordLogin(id: number) {
  return db.adminUser.update({ where: { id }, data: { lastLoginAt: new Date() } });
}

/** New password: clears the forced-change flag and bumps sessionVersion (logs out other devices). */
export function updatePassword(id: number, passwordHash: string, mustChangePassword = false) {
  return db.adminUser.update({
    where: { id },
    data: { passwordHash, mustChangePassword, sessionVersion: { increment: 1 } },
    select: ADMIN_SELECT,
  });
}

export function updateProfile(id: number, data: { name: string; email: string }) {
  return db.adminUser.update({ where: { id }, data, select: ADMIN_SELECT });
}

export function bumpSessionVersion(id: number) {
  return db.adminUser.update({
    where: { id },
    data: { sessionVersion: { increment: 1 } },
    select: ADMIN_SELECT,
  });
}

// ---------- Login attempts (DB-backed rate limiting, no Redis) ----------

export function countFailures(key: string, since: Date) {
  return db.loginAttempt.count({ where: { key, success: false, createdAt: { gte: since } } });
}

export function recordAttempts(keys: string[], success: boolean) {
  return db.loginAttempt.createMany({ data: keys.map((key) => ({ key, success })) });
}

export function clearFailures(key: string) {
  return db.loginAttempt.deleteMany({ where: { key, success: false } });
}

export function pruneAttempts(olderThan: Date) {
  return db.loginAttempt.deleteMany({ where: { createdAt: { lt: olderThan } } });
}
