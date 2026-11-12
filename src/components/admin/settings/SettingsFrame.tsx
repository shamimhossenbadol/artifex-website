import { Suspense, type ReactNode } from "react";
import { AdminPageHeader } from "../AdminPageHeader";
import { SettingsTabLinks, SettingsTabs } from "./SettingsTabs";

/** Shared header + tab bar for the settings pages (rendered after requireAdmin()). */
export function SettingsFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Business details shown across the website. Changes go live when you save."
      />
      <Suspense fallback={<SettingsTabLinks pathname={null} />}>
        <SettingsTabs />
      </Suspense>
      <div className="max-w-3xl">{children}</div>
    </>
  );
}
