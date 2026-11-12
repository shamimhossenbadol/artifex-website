import type { Metadata } from "next";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminPageHeader";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { LogoutEverywhereForm } from "@/components/admin/LogoutEverywhereForm";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { requireAdmin } from "@/server/services/auth.service";

export const metadata: Metadata = { title: "Account" };

/** Account (07 §3.7): profile, change password, log out everywhere. */
export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <>
      <AdminPageHeader title="Account" />
      <div className="grid max-w-3xl gap-6">
        <AdminPanel title="Profile">
          <ProfileForm name={admin.name} email={admin.email} />
        </AdminPanel>
        <AdminPanel title="Change password">
          <ChangePasswordForm />
        </AdminPanel>
        <AdminPanel title="Devices">
          <p className="mb-4">
            Signed in on a phone or computer you no longer use? Sign out everywhere except here.
          </p>
          <LogoutEverywhereForm />
        </AdminPanel>
      </div>
    </>
  );
}
