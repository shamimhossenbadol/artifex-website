// Draft preview (F1.2): "?preview=1" on a product or post page shows unpublished content, but only
// to a signed-in admin. Everyone else gets the normal (published-only, cached) page.
import { getCurrentAdmin } from "./auth.service";

export async function isAdminPreview(
  searchParams: Promise<Record<string, unknown>>,
): Promise<boolean> {
  const { preview } = await searchParams;
  if (preview !== "1") return false;
  return (await getCurrentAdmin()) !== null;
}
