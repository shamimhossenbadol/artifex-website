// Password hashing and rules (07 §1, 09 §2). bcryptjs is pure JS: no native build on the server.
import { compare, hash } from "bcryptjs";

export const BCRYPT_COST = 12;
export const MIN_PASSWORD_LENGTH = 10;

/**
 * A valid bcrypt hash of a random string. Used when the email doesn't exist so a login attempt
 * takes the same time either way (no account enumeration by timing, 09 §2).
 */
export const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7lO7nX1L5V4pbmAc8E2dCCgh8a4Wqe6";

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "1234567890",
  "12345678910",
  "qwertyuiop",
  "letmein123",
  "iloveyou123",
  "admin12345",
  "administrator",
  "welcome123",
  "artifex123",
  "artifexfurniture",
  "furniture123",
  "bangladesh",
  "dhaka12345",
]);

export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

/** Returns an error message, or null when the new password is acceptable (07 §1). */
export function validateNewPassword(
  password: string,
  { currentPassword, email }: { currentPassword?: string; email?: string },
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > 128) return "Use at most 128 characters.";
  if (currentPassword !== undefined && password === currentPassword) {
    return "Choose a password different from your current one.";
  }
  if (email && password.trim().toLowerCase() === email.trim().toLowerCase()) {
    return "Your password can't be your email address.";
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) {
    return "This password is too easy to guess. Choose another.";
  }
  return null;
}
