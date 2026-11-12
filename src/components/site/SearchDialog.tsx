"use client";
// Header search overlay (F2, 05 §3): a native modal <dialog> at the top of the page with a search
// form. Instant suggestions after 2 characters (250 ms debounce, stale requests aborted),
// ↑/↓ to move, Enter to open, Esc to close. Without JavaScript the form still submits to /search.
import { ArrowRight, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Price } from "@/components/ui/Price";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "@/lib/search";
import { cn } from "@/lib/utils";
import type { SearchSuggestions } from "@/server/services/search.service";
import { SEARCH_DIALOG_ID } from "./SearchButton";

const DEBOUNCE_MS = 250;
const CLOSE_COMMAND = { commandfor: SEARCH_DIALOG_ID, command: "close" } as Record<string, string>;

type Status = "idle" | "loading" | "error";
type Item = { href: string; key: string };
type SuggestResponse = { q: string; data: SearchSuggestions | null; error: boolean };

export function SearchDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  // Each response remembers which query it belongs to, so loading/stale state is derived instead
  // of being reset inside the effect.
  const [response, setResponse] = useState<SuggestResponse | null>(null);
  const [activeFor, setActiveFor] = useState<{ q: string; index: number }>({ q: "", index: -1 });

  const trimmed = query.trim();
  const searchable = trimmed.length >= SEARCH_MIN_LENGTH;
  const current = searchable && response?.q === trimmed ? response : null;
  const results = current?.data ?? null;
  const status: Status = !searchable
    ? "idle"
    : !current
      ? "loading"
      : current.error
        ? "error"
        : "idle";
  const active = activeFor.q === trimmed ? activeFor.index : -1;
  const setActive = (update: (i: number) => number) =>
    setActiveFor({ q: trimmed, index: update(active) });

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setResponse({ q: trimmed, data: (await res.json()) as SearchSuggestions, error: false });
      } catch {
        if (!controller.signal.aborted) setResponse({ q: trimmed, data: null, error: true });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, searchable]);

  const items: Item[] = [
    ...(results?.products ?? []).map((p) => ({ href: p.href, key: `p:${p.href}` })),
    ...(results?.categories ?? []).map((c) => ({ href: c.href, key: `c:${c.href}` })),
  ];
  const optionId = (index: number) => `${listId}-opt-${index}`;
  const resultsHref = `/search?q=${encodeURIComponent(trimmed)}`;

  function close() {
    dialogRef.current?.close();
  }

  function go(href: string) {
    close();
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      const item = items[active];
      if (item) go(item.href);
    }
  }

  const showPanel = searchable && (results !== null || status !== "idle");
  const noMatches =
    results !== null && results.products.length === 0 && results.categories.length === 0;

  return (
    <dialog
      id={SEARCH_DIALOG_ID}
      ref={dialogRef}
      aria-label="Search"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="search-dialog bg-bg text-ink-soft backdrop:bg-ink/40 m-0 max-h-dvh w-full max-w-none overflow-y-auto p-0"
    >
      <Container className="py-4 md:py-6">
        <form
          role="search"
          action="/search"
          method="get"
          onSubmit={(event) => {
            event.preventDefault();
            if (searchable) go(resultsHref);
          }}
          className="border-ink flex items-center gap-3 border-b pb-2"
        >
          <Search aria-hidden strokeWidth={1.5} className="text-ink size-5 shrink-0" />
          <label htmlFor={`${listId}-input`} className="sr-only">
            Search products
          </label>
          <input
            id={`${listId}-input`}
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search sofas, beds, chandeliers…"
            minLength={SEARCH_MIN_LENGTH}
            maxLength={SEARCH_MAX_LENGTH}
            autoComplete="off"
            enterKeyHint="search"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
            className="text-ink placeholder:text-muted h-12 min-w-0 flex-1 bg-transparent text-lg outline-none md:text-xl"
          />
          <button
            type="button"
            {...CLOSE_COMMAND}
            onClick={() => {
              if (!("command" in HTMLButtonElement.prototype)) close();
            }}
            className="text-ink -mr-2 inline-flex size-11 shrink-0 items-center justify-center"
          >
            <X aria-hidden strokeWidth={1.5} className="size-6" />
            <span className="sr-only">Close search</span>
          </button>
        </form>

        <div aria-live="polite" className="text-small text-muted mt-3 min-h-5">
          {status === "loading" && "Searching…"}
          {status === "error" &&
            "Search is unavailable right now. Press Enter to try the results page."}
          {status === "idle" && noMatches && `No matches for “${trimmed}”. Try another word.`}
        </div>

        {showPanel && items.length > 0 && (
          <ul id={listId} role="listbox" aria-label="Suggestions" className="mt-2 pb-2">
            {(results?.products ?? []).map((product, index) => (
              <li
                key={product.href}
                id={optionId(index)}
                role="option"
                aria-selected={active === index}
              >
                <Link
                  href={product.href}
                  tabIndex={-1}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-4 rounded-md px-2 py-2",
                    active === index ? "bg-sand" : "hover:bg-sand",
                  )}
                >
                  <span className="bg-sand relative aspect-[4/5] w-12 shrink-0 overflow-hidden">
                    {product.image && (
                      <Image
                        src={product.image.path}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-ink block truncate font-medium">{product.title}</span>
                    <span className="text-small text-muted block">{product.categoryName}</span>
                  </span>
                  <Price
                    regularPrice={product.regularPrice}
                    discountPrice={product.discountPrice}
                    className="shrink-0 text-right [&_.text-price]:text-base"
                  />
                </Link>
              </li>
            ))}
            {(results?.categories ?? []).map((category, i) => {
              const index = (results?.products.length ?? 0) + i;
              return (
                <li
                  key={category.href}
                  id={optionId(index)}
                  role="option"
                  aria-selected={active === index}
                >
                  <Link
                    href={category.href}
                    tabIndex={-1}
                    onClick={close}
                    className={cn(
                      "text-ink flex min-h-11 items-center justify-between rounded-md px-2",
                      active === index ? "bg-sand" : "hover:bg-sand",
                    )}
                  >
                    <span>
                      <span className="text-small text-muted">Category · </span>
                      {category.name}
                    </span>
                    <ArrowRight aria-hidden strokeWidth={1.5} className="size-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {searchable && (
          <Link
            href={resultsHref}
            onClick={close}
            className="text-ink mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            See all results for “{trimmed}”
            <ArrowRight aria-hidden strokeWidth={1.5} className="size-4" />
          </Link>
        )}
      </Container>
    </dialog>
  );
}
