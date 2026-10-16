"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { catStyle } from "@/lib/category";
import type { SearchEntry } from "@/lib/site-data";
import { CATEGORY_LABELS } from "@/lib/types";

const MAX_RESULTS = 8;

/** Every word must appear somewhere; titles that contain the whole query come first, then newest. */
function search(index: SearchEntry[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  const hits = index.filter((e) => words.every((w) => e.text.includes(w)));
  const inTitle = hits.filter((e) => e.title.toLowerCase().includes(q));
  const rest = hits.filter((e) => !e.title.toLowerCase().includes(q));
  return [...inTitle, ...rest].slice(0, MAX_RESULTS);
}

function ago(iso: string) {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4 4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Search over every story the site has. The index (app/search-index) is fetched once, the first
 * time the box is focused. "/" or Ctrl/⌘+K focuses it from anywhere on the page.
 */
export function SearchBox() {
  const router = useRouter();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Mid-width screens show only an icon; opening it lays the field over the section bar.
  const [expanded, setExpanded] = useState(false);

  const results = useMemo(() => (index ? search(index, query) : []), [index, query]);

  const load = () => {
    if (index || failed) return;
    fetch("/search-index")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setIndex)
      .catch(() => setFailed(true));
  };

  // Keyboard shortcut, and closing when clicking anywhere else.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
      if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        openField();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (root.current?.contains(e.target as Node)) return;
      setOpen(false);
      setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  // The field may be display:none until `expanded` renders, so focus on the next frame.
  function openField() {
    setExpanded(true);
    requestAnimationFrame(() => input.current?.focus());
  }

  const close = () => {
    setOpen(false);
    setExpanded(false);
    input.current?.blur();
  };

  const go = (entry: SearchEntry) => {
    setOpen(false);
    setExpanded(false);
    if (entry.external) window.open(entry.href, "_blank", "noreferrer");
    else router.push(entry.href);
  };

  const showPanel = open && query.trim().length > 0;

  return (
    // Phones: a full-width field. md to xl: an icon that opens the field over the whole bar (the
    // bar is the positioning context there, so the results sit under it). xl and up: an inline field.
    <div ref={root} className="relative w-full md:static md:w-auto xl:relative">
      <button
        type="button"
        aria-label="Search stories"
        onClick={openField}
        className={`hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-surface text-muted hover:text-text xl:hidden ${expanded ? "" : "md:flex"}`}
      >
        <SearchIcon />
      </button>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[active]) go(results[active]);
        }}
        className={`flex items-center gap-3 xl:static xl:flex xl:w-[min(320px,28vw)] xl:bg-transparent ${
          expanded ? "md:absolute md:inset-0 md:z-10 md:bg-bg" : "md:hidden"
        }`}
      >
        <div className="relative flex-1">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search stories
        </label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          ref={input}
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${listId}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && results[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder="Search stories, companies, models"
          value={query}
          onFocus={() => {
            load();
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Escape") {
              close();
            }
          }}
          className="min-h-11 w-full rounded-full border border-line-strong bg-surface pl-10 pr-10 text-sm text-text placeholder:text-faint focus:border-accent [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line-strong px-1.5 font-mono text-[11px] text-muted sm:block"
        >
          /
        </kbd>
        </div>
        {expanded && (
          <button
            type="button"
            onClick={close}
            className="hidden min-h-10 shrink-0 cursor-pointer rounded-full px-3 text-sm text-muted hover:text-text md:block xl:hidden"
          >
            Close
          </button>
        )}
      </form>

      {showPanel && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(440px,calc(100vw-48px))] overflow-hidden rounded-cw-lg border border-line-strong bg-surface shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          {!index && !failed && <p className="m-0 px-4 py-3 text-sm text-muted">Loading…</p>}
          {failed && <p className="m-0 px-4 py-3 text-sm text-muted">Search isn&rsquo;t available right now.</p>}
          {index && results.length === 0 && (
            <p className="m-0 px-4 py-3 text-sm text-muted">No stories match &ldquo;{query.trim()}&rdquo;.</p>
          )}
          {results.length > 0 && (
            <ul id={`${listId}-list`} role="listbox" aria-label="Search results" className="m-0 max-h-[70vh] list-none overflow-y-auto p-1.5">
              {results.map((r, n) => (
                <li
                  key={r.id}
                  id={`${listId}-${n}`}
                  role="option"
                  aria-selected={n === active}
                  style={catStyle(r.category)}
                  onMouseEnter={() => setActive(n)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(r);
                  }}
                  className={`flex cursor-pointer flex-col gap-1 rounded-cw px-3 py-2.5 ${n === active ? "bg-line" : ""}`}
                >
                  <span className="label flex items-center gap-2 text-[11px] text-cat">
                    <span className="dot !h-1.5 !w-1.5" aria-hidden />
                    {CATEGORY_LABELS[r.category]}
                  </span>
                  <span className="font-display text-[18px] leading-[1.2]">{r.title}</span>
                  <span className="text-[12px] text-muted">
                    {r.source}
                    {r.external && " ↗"} · {ago(r.firstSeen)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
