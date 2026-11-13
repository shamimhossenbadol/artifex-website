// POST /api/track — anonymous visit/click counter for the admin dashboard (ADR-040, 09 §3).
// Same-origin only, tiny body, Zod-validated, no cookies set, no privileged state changed.
// Visits from a signed-in admin aren't counted, so the owner's own browsing doesn't skew numbers.
import type { NextRequest } from "next/server";
import { MAX_TRACK_BODY_BYTES } from "@/lib/analytics";
import { SESSION_COOKIE } from "@/lib/auth/session-token";
import { trackEventSchema } from "@/lib/validation/analytics";
import { recordEvent } from "@/server/services/analytics.service";

const NO_STORE = { "Cache-Control": "no-store" };

function empty(status: number): Response {
  return new Response(null, { status, headers: NO_STORE });
}

/** The request comes from a page on this site (Origin, or Referer when Origin is absent). */
function isSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const source = request.headers.get("origin") ?? request.headers.get("referer");
  if (!host || !source) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!isSameOrigin(request)) return empty(403);
  if (request.cookies.has(SESSION_COOKIE)) return empty(204);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_TRACK_BODY_BYTES) return empty(413);
  const text = await request.text();
  if (text.length > MAX_TRACK_BODY_BYTES) return empty(413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return empty(400);
  }
  const parsed = trackEventSchema.safeParse(body);
  if (!parsed.success) return empty(400);

  try {
    await recordEvent(parsed.data, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
  } catch (err) {
    // Counting is best-effort: never surface an error to the visitor's page.
    console.error("[api.track]", err);
  }
  return empty(204);
}
