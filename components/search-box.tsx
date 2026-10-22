"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CATEGORY_HEX } from "@/lib/category";
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

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20 L16 16" />
    </svg>
  );
}

/**
 * The header's search box: it looks like a field ("Search stories", and the "/" shortcut) and opens a
 * panel across the top of the page that searches
 * every story; the index (app/search-index) is fetched once, the first time it opens.
 * "/" or Ctrl/⌘+K opens it from anywhere, Esc closes it.
 */
export function SearchButton({ onImage = false }: { onImage?: boolean }) {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => (index ? search(index, query) : []), [index, query]);

  function show() {
    setOpen(true);
    if (!index && !failed) {
      fetch("/search-index")
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then(setIndex)
        .catch(() => setFailed(true));
    }
    requestAnimationFrame(() => input.current?.focus());
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
      if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const close = () => setOpen(false);

  const go = (entry: SearchEntry) => {
    close();
    if (entry.external) window.open(entry.href, "_blank", "noreferrer");
    else router.push(entry.href);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Search stories"
        aria-expanded={open}
        onClick={show}
        className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2.5 border bg-transparent px-3 text-muted hover:border-fg hover:text-fg sm:w-52 sm:justify-start ${
          onImage ? "border-[rgb(238_235_227/0.2)]" : "border-rule-strong"
        }`}
      >
        <SearchIcon />
        <span className="hidden text-[14px] sm:inline">Search stories</span>
        <kbd className="ml-auto hidden border border-current px-1.5 font-sans text-[11px] leading-5 opacity-60 sm:inline">/</kbd>
      </button>

      {open && (
        // The panel always uses the dark palette, even when opened from a bone page.
        <div className="fixed inset-0 z-50 flex flex-col [--fg:var(--cw-bone)] [--muted:var(--cw-concrete)] [--raised:var(--cw-slate)] [--rule-strong:#3a3835] [--rule:#2e2c29] [--signal:var(--cw-orange)] [--surface:var(--cw-black)]">
          <div className="border-b border-rule bg-surface text-fg">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (results[active]) go(results[active]);
              }}
              className="container-cw flex items-center gap-3 py-4"
            >
              <label htmlFor={`${id}-q`} className="sr-only">
                Search stories
              </label>
              <span className="text-muted">
                <SearchIcon size={22} />
              </span>
              <input
                ref={input}
                id={`${id}-q`}
                type="search"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls={`${id}-list`}
                aria-autocomplete="list"
                aria-activedescendant={results[active] ? `${id}-${active}` : undefined}
                autoComplete="off"
                placeholder="Search stories, companies, models"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
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
                className="min-h-12 flex-1 border-0 bg-transparent text-[20px] text-fg outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
              />
              <button type="button" onClick={close} className="caps min-h-11 cursor-pointer px-2 text-muted hover:text-signal">
                Close
              </button>
            </form>

            {query.trim() && (
              <div className="container-cw pb-4">
                {!index && !failed && <p className="m-0 py-3 text-sm text-muted">Loading…</p>}
                {failed && <p className="m-0 py-3 text-sm text-muted">Search isn&rsquo;t available right now.</p>}
                {index && results.length === 0 && (
                  <p className="m-0 py-3 text-sm text-muted">No stories match &ldquo;{query.trim()}&rdquo;.</p>
                )}
                {results.length > 0 && (
                  <ul
                    id={`${id}-list`}
                    role="listbox"
                    aria-label="Search results"
                    className="m-0 max-h-[65vh] list-none overflow-y-auto border-t-2 border-fg p-0"
                  >
                    {results.map((r, n) => (
                      <li
                        key={r.id}
                        id={`${id}-${n}`}
                        role="option"
                        aria-selected={n === active}
                        onMouseEnter={() => setActive(n)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          go(r);
                        }}
                        className={`flex cursor-pointer flex-col gap-1.5 border-b border-rule px-3 py-3.5 ${n === active ? "bg-raised" : ""}`}
                      >
                        <span className="kicker flex gap-3">
                          {!r.external && <span className="text-signal">Briefing</span>}
                          {/* Each topic in its own colour, so results scan by subject at a glance. */}
                          <span className="flex items-center gap-1.5" style={{ color: CATEGORY_HEX[r.category] }}>
                            <span className="h-1.5 w-1.5 bg-current" aria-hidden />
                            {CATEGORY_LABELS[r.category]}
                          </span>
                        </span>
                        <span className="text-[18px] font-medium leading-[1.3]">{r.title}</span>
                        <span className="text-[13px] text-muted">
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
          <button type="button" aria-label="Close search" onClick={close} className="flex-1 cursor-default bg-black/70" />
        </div>
      )}
    </>
  );
}
