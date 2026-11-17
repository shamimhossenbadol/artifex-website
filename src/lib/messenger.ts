// "Message us on Facebook" (F5): turns the admin's Facebook page URL into a Messenger link
// (https://m.me/<page>), which opens a chat with the page in the Messenger app or on the web.
// URLs we can't map (groups, share links, unusual paths) fall back to the page itself, which
// has its own "Message" button.
// An optional `ref` (ADR-074) is added to m.me links only, e.g. ?ref=product-oria-corner-sofa.
// Messenger passes it to the Page inbox, so staff can see which product a chat started from.

const FACEBOOK_HOST = /^(?:www\.|m\.|web\.)?facebook\.com$/i;
const NOT_A_PAGE = new Set(["pages", "groups", "people", "share", "sharer", "events", "watch"]);
const PAGE_NAME = /^[A-Za-z0-9.\-]{2,80}$/;
/** Messenger `ref` values we send: lowercase letters, digits and hyphens, at most 64 characters. */
const REF_PATTERN = /^[a-z0-9-]{1,64}$/;

function withRef(mMeUrl: string, ref: string | undefined): string {
  return ref && REF_PATTERN.test(ref) ? `${mMeUrl}?ref=${ref}` : mMeUrl;
}

/** Builds the product page's Messenger `ref`: "product-<slug>", cut to Messenger-safe length. */
export function productMessengerRef(slug: string): string {
  return `product-${slug}`.slice(0, 64).replace(/-+$/, "");
}

export function toMessengerUrl(
  facebookUrl: string | null | undefined,
  ref?: string,
): string | null {
  if (!facebookUrl) return null;
  let url: URL;
  try {
    url = new URL(facebookUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (!FACEBOOK_HOST.test(url.hostname)) return facebookUrl;

  const [first, ...rest] = url.pathname.split("/").filter(Boolean);
  if (first === "profile.php") {
    const id = url.searchParams.get("id");
    return id && /^\d{5,20}$/.test(id) ? withRef(`https://m.me/${id}`, ref) : facebookUrl;
  }
  if (!first || rest.length > 0 || NOT_A_PAGE.has(first.toLowerCase()) || !PAGE_NAME.test(first)) {
    return facebookUrl;
  }
  return withRef(`https://m.me/${first}`, ref);
}
