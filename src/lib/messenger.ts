// "Message us on Facebook" (F5): turns the admin's Facebook page URL into a Messenger link
// (https://m.me/<page>), which opens a chat with the page in the Messenger app or on the web.
// URLs we can't map (groups, share links, unusual paths) fall back to the page itself, which
// has its own "Message" button.

const FACEBOOK_HOST = /^(?:www\.|m\.|web\.)?facebook\.com$/i;
const NOT_A_PAGE = new Set(["pages", "groups", "people", "share", "sharer", "events", "watch"]);
const PAGE_NAME = /^[A-Za-z0-9.\-]{2,80}$/;

export function toMessengerUrl(facebookUrl: string | null | undefined): string | null {
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
    return id && /^\d{5,20}$/.test(id) ? `https://m.me/${id}` : facebookUrl;
  }
  if (!first || rest.length > 0 || NOT_A_PAGE.has(first.toLowerCase()) || !PAGE_NAME.test(first)) {
    return facebookUrl;
  }
  return `https://m.me/${first}`;
}
