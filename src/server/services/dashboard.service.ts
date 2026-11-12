// Admin dashboard overview (07 §3.1): counts, recent products and setup warnings.
import { connection } from "next/server";
import {
  findDashboardCounts,
  findDashboardSettings,
  findRecentlyUpdatedProducts,
} from "@/server/repositories/dashboard.repo";
import { PLACEHOLDER_HERO_IMAGE } from "./home.service";

export type DashboardWarning = { text: string; href: string; action: string };

export async function getDashboard() {
  await connection();
  const [counts, recent, setup] = await Promise.all([
    findDashboardCounts(),
    findRecentlyUpdatedProducts(5),
    findDashboardSettings(),
  ]);

  const warnings: DashboardWarning[] = [];
  if (counts.withoutImages > 0) {
    warnings.push({
      text: `${counts.withoutImages} ${counts.withoutImages === 1 ? "product has" : "products have"} no photos.`,
      href: "/admin/products?images=none",
      action: "Add photos",
    });
  }
  if (setup.whatsappNumber.replace(/\D/g, "").length < 8) {
    warnings.push({
      text: "The WhatsApp number isn't set.",
      href: "/admin/settings/contact",
      action: "Set it",
    });
  }
  if (!setup.heroImagePath || setup.heroImagePath === PLACEHOLDER_HERO_IMAGE) {
    warnings.push({
      text: "The homepage hero has no photo yet.",
      href: "/admin/homepage",
      action: "Upload one",
    });
  }
  return { counts, recent, warnings };
}
