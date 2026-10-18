"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";

export type IssueSummary = { number: number; dateLabel: string; subject: string; preview: string; headlines: string[] };

const normalize = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

/** The newsletter archive with a search over each issue's subject, preview and story headlines. */
export function IssueList({ issues }: { issues: IssueSummary[] }) {
  const [query, setQuery] = useState("");
  const q = normalize(useDeferredValue(query).trim());
  const shown = q
    ? issues.filter((i) => normalize([i.subject, i.preview, ...i.headlines].join(" ")).includes(q) || String(i.number) === q.replace("#", ""))
    : issues;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="issue-search" className="sr-only">
          Search issues
        </label>
        <input
          id="issue-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search issues"
          className="min-h-11 flex-[1_1_260px] border border-rule-strong bg-transparent px-3.5 text-[15px] text-fg placeholder:text-muted sm:max-w-[360px]"
        />
        <p className="m-0 text-[14px] text-muted" aria-live="polite">
          {q ? `${shown.length} of ${issues.length}` : issues.length} {issues.length === 1 && !q ? "issue" : "issues"}
        </p>
      </div>
      {shown.length ? (
        <ul className="m-0 list-none border-t-2 border-fg p-0">
          {shown.map((issue) => (
            <li key={issue.number}>
              <Link href={`/issues/${issue.number}`} className="group flex flex-col gap-2 border-b border-rule py-6 hover:text-fg">
                <span className="kicker text-signal">
                  Issue #{issue.number} · {issue.dateLabel}
                </span>
                <span className="text-[24px] font-semibold leading-[1.2] group-hover:text-signal">{issue.subject}</span>
                <span className="text-[15px] text-dek">{issue.preview}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t-2 border-fg py-10 text-muted">No issues match &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}
