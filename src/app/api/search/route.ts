// GET /api/search?q= — instant suggestions for the header search (F2).
// Validated with Zod (2–60 chars); short public cache so Cloudflare/browsers absorb repeat queries.
import type { NextRequest } from "next/server";
import { searchQuerySchema } from "@/lib/validation/search";
import { getSearchSuggestions } from "@/server/services/search.service";

const CACHE_HEADERS = { "Cache-Control": "public, max-age=60" };

export async function GET(request: NextRequest): Promise<Response> {
  const parsed = searchQuerySchema.safeParse({ q: request.nextUrl.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return Response.json(
      { error: "Query must be 2–60 characters." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const suggestions = await getSearchSuggestions(parsed.data.q);
    return Response.json(suggestions, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("[api.search]", err);
    return Response.json(
      { error: "Search is unavailable right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
