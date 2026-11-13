import { getSiteSettings } from "@/server/services/settings.service";
import { SiteTracker } from "./SiteTracker";

/** Reads the Pixel ID from (cached) settings and mounts the browser tracker (ADR-040). */
export async function SiteTracking() {
  const settings = await getSiteSettings();
  return <SiteTracker pixelId={settings.facebookPixelId} />;
}
