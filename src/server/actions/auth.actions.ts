"use server";
// Admin auth Server Actions (07 §1, 11 §3): requireAdmin (where relevant) → Zod → service → result.
import { redirect } from "next/navigation";
import { invalid, type ActionResult } from "@/lib/action-result";
import { safeAdminRedirect } from "@/lib/auth/rules";
import { changePasswordSchema, loginSchema, profileSchema } from "@/lib/validation/auth";
import {
  PASSWORD_CHANGE_PATH,
  changePassword,
  clearSessionCookie,
  login,
  logoutEverywhere,
  requireAdmin,
  updateProfile,
} from "@/server/services/auth.service";

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await login(parsed.data.email, parsed.data.password);
  if (!result.ok) return { ok: false, error: result.error };
  redirect(result.mustChangePassword ? PASSWORD_CHANGE_PATH : safeAdminRedirect(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login");
}

export async function logoutEverywhereAction(): Promise<ActionResult> {
  const admin = await requireAdmin();
  await logoutEverywhere(admin);
  return { ok: true, message: "Signed out on every other device." };
}

export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin({ allowPasswordChange: true });
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await changePassword(admin, parsed.data.currentPassword, parsed.data.newPassword);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      fieldErrors: result.field ? { [result.field]: [result.error] } : undefined,
    };
  }
  // After a forced change, continue to the dashboard; otherwise stay on the account page.
  if (admin.mustChangePassword) redirect("/admin");
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const result = await updateProfile(admin, {
    name: parsed.data.name,
    email: parsed.data.email,
    currentPassword: parsed.data.currentPassword || undefined,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      fieldErrors: result.field ? { [result.field]: [result.error] } : undefined,
    };
  }
  return { ok: true, message: "Profile saved." };
}
