"use client";

import { type ReactNode, useState } from "react";

const TABS = [
  { id: "top", label: "Top stories" },
  { id: "latest", label: "Latest" },
] as const;

/** "Top stories / Latest" switch over the main column. Both panels are server-rendered; this only toggles them. */
export function FrontTabs({ top, latest }: { top: ReactNode; latest: ReactNode }) {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("top");
  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Front page view"
        className="flex w-fit gap-1 rounded-full border border-line-strong p-1"
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          const next = active === "top" ? "latest" : "top";
          setActive(next);
          document.getElementById(`tab-${next}`)?.focus();
        }}
      >
        {TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`min-h-11 cursor-pointer rounded-full px-5 text-sm font-semibold uppercase tracking-[0.06em] ${
                selected ? "bg-accent text-on-accent" : "text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {TABS.map((tab) => (
        <div key={tab.id} id={`panel-${tab.id}`} role="tabpanel" aria-labelledby={`tab-${tab.id}`} hidden={tab.id !== active}>
          {tab.id === "top" ? top : latest}
        </div>
      ))}
    </div>
  );
}
