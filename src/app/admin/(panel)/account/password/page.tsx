import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminPageHeader";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { requireAdmin } from "@/server/services/auth.service";

export const metadata: Metadata = { title: "Set a new password" };

/** First-login password change (07 §1). Every other admin page redirects here until it's done. */
export default async function ForcedPasswordPage() {
  const admin = await requireAdmin({ allowPasswordChange: true });
  if (!admin.mustChangePassword) redirect("/admin/account");
  return (
    <>
      <AdminPageHeader
        title="Set a new password"
        description="For your security, choose your own password before continuing."
      />
      <div className="max-w-xl">
        <AdminPanel>
          <ChangePasswordForm submitLabel="Save and continue" />
        </AdminPanel>
      </div>
    </>
  );
}
