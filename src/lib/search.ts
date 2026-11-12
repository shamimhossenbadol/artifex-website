// Search text handling (F2, ADR-007): normalisation, term splitting, LIKE escaping and ranking.
// Pure functions, unit tested. Prisma's `contains` does NOT escape LIKE wildcards on MySQL
// (verified against MariaDB 11.4, ADR-027), so every term goes through escapeLike().

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 60;
export const SEARCH_MAX_TERMS = 5;

/** Lowercase, trim, collapse whitespace, cap at 60 characters. */
export function normalizeQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ").slice(0, SEARCH_MAX_LENGTH).trim();
}

/** Up to 5 distinct terms from a normalised query. */
export function splitTerms(normalized: string): string[] {
  return [...new Set(normalized.split(" ").filter(Boolean))].slice(0, SEARCH_MAX_TERMS);
}

/** Escapes \, % and _ so user input is matched literally inside LIKE '%…%'. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export function isSearchable(normalized: string): boolean {
  return normalized.length >= SEARCH_MIN_LENGTH;
}

export type RankableProduct = {
  title: string;
  isPopular: boolean;
  publishedAt: Date | null;
};

/** 0 = title starts with the query, 1 = title contains it, 2 = matched elsewhere. */
export function matchTier(title: string, normalized: string): number {
  const t = title.toLowerCase();
  if (t.startsWith(normalized)) return 0;
  if (t.includes(normalized)) return 1;
  return 2;
}

/** F2 ranking: title prefix > title contains > other; ties by popular, then newest. */
export function rankProducts<T extends RankableProduct>(rows: T[], normalized: string): T[] {
  return rows
    .map((row) => ({ row, tier: matchTier(row.title, normalized) }))
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        Number(b.row.isPopular) - Number(a.row.isPopular) ||
        (b.row.publishedAt?.getTime() ?? 0) - (a.row.publishedAt?.getTime() ?? 0),
    )
    .map(({ row }) => row);
}
