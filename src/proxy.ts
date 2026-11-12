// Coarse admin gate + sliding session renewal (09 §2, ADR-018). NOT the security boundary:
// every admin page and action calls requireAdmin(), which also checks the DB.
import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  shouldRenew,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/session-token";

/** Admin pages (login included) are private: never cached or indexed. */
function privateHeaders(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return privateHeaders(NextResponse.next());

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const login = new URL("/admin/login", request.url);
    if (pathname !== "/admin") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  // Sliding expiry: re-issue a valid token in its last day (claims are re-checked by requireAdmin).
  const secret = process.env.AUTH_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const response = NextResponse.next();
  if (secret) {
    const session = await verifySessionToken(token, secret);
    if (session && shouldRenew(session)) {
      const renewed = await signSessionToken(session, secret);
      response.cookies.set(SESSION_COOKIE, renewed, sessionCookieOptions(siteUrl));
    }
  }
  return privateHeaders(response);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
