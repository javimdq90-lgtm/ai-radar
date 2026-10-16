import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { catStyle } from "@/lib/category";
import { fmtLongDate, fmtTime } from "@/lib/format";
import { getGeneratedAt } from "@/lib/site-data";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/types";

export const SITE_NAME = "Context Window";
export const TAGLINE = "Everything in AI worth keeping in context.";

/**
 * Five tokens in a row with a window around the third and fourth. `fill` colours the two
 * tokens in the window: the accent for the logo, a category colour in story art.
 */
export function Mark({ width = 64, fill = "var(--cw-accent)", className }: { width?: number; fill?: string; className?: string }) {
  return (
    <svg width={width} height={(width * 52) / 64} viewBox="0 0 64 52" fill="none" aria-hidden className={className}>
      <rect x="2" y="21" width="8" height="10" rx="2" fill="var(--cw-border-strong)" />
      <rect x="14" y="21" width="8" height="10" rx="2" fill="var(--cw-border-strong)" />
      <rect x="28" y="21" width="8" height="10" rx="2" fill={fill} />
      <rect x="40" y="21" width="8" height="10" rx="2" fill={fill} />
      <rect x="54" y="21" width="8" height="10" rx="2" fill="var(--cw-border-strong)" />
      <rect x="25" y="12" width="26" height="28" rx="4" stroke="var(--cw-text)" strokeWidth="2" />
    </svg>
  );
}

export async function TopBar() {
  const now = await getGeneratedAt();
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-line py-3.5 text-[13px] text-muted">
      <span>{fmtLongDate(now)}</span>
      <span className="flex items-center gap-2">
        <span className="dot !h-2 !w-2" style={catStyle("products")} aria-hidden />
        Updated {fmtTime(now)} · refreshed twice a day
      </span>
    </div>
  );
}

/** Front-page masthead: the 76px wordmark with the tagline under it, and the email button. */
export function Masthead() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5 pb-7 pt-10">
      <div className="flex flex-col gap-3">
        <h1 className="m-0 font-display text-[clamp(34px,9vw,76px)] font-normal leading-[0.9] tracking-[-1px]">
          <Link href="/" className="flex items-center gap-3 hover:text-text sm:gap-4">
            <Mark className="h-auto w-10 shrink-0 sm:w-16" />
            {SITE_NAME}
          </Link>
        </h1>
        <p className="m-0 font-display text-[clamp(18px,2.5vw,22px)] italic text-muted">{TAGLINE}</p>
      </div>
      <div className="mb-1">{CTA}</div>
    </header>
  );
}

const CTA = (
  <Link href="#newsletter" className="btn-accent rounded-full text-sm">
    Get the email
  </Link>
);

/**
 * The section bar on every page: one chip per category and the search box.
 * Every chip always shows: they wrap rather than scroll. Between md and xl the search box is an
 * icon, so the chips keep the room. Sticky from md up; on phones the wrapped chips would take
 * too much of the screen, so it scrolls away.
 */
export function SectionNav({ active }: { active?: Category }) {
  return (
    <div className="relative z-30 border-y border-line before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:bg-bg/90 before:backdrop-blur-md md:sticky md:top-0">
      <nav aria-label="Sections" className="relative flex flex-wrap items-center gap-x-3 gap-y-3 py-3 md:flex-nowrap xl:gap-x-4">
        <ul className="m-0 flex min-w-0 flex-1 list-none flex-wrap gap-1.5 p-0">
          {CATEGORIES.map((c) => {
            const current = active === c;
            return (
              <li key={c} className="shrink-0">
                <Link
                  href={`/topic/${c}`}
                  style={catStyle(c)}
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border px-2.5 text-[13px] font-medium lg:px-3 xl:px-3.5 hover:border-tint-line hover:bg-tint hover:text-cat ${
                    current ? "border-tint-line bg-tint text-cat" : "border-line text-body"
                  }`}
                >
                  <span className="dot" aria-hidden />
                  {CATEGORY_LABELS[c]}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="w-full md:w-auto md:shrink-0">
          <SearchBox />
        </div>
      </nav>
    </div>
  );
}

/** Article and archive pages: 34px wordmark linking home and the email button, then the section bar. */
export function CompactHeader({ active }: { active?: Category }) {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 py-[18px]">
        <Link href="/" className="flex items-center gap-3">
          <Mark width={40} />
          <span className="font-display text-[clamp(26px,7vw,34px)] leading-none">{SITE_NAME}</span>
        </Link>
        {/* Phones skip it here: these pages have the sign-up box further down. */}
        <span className="hidden sm:block">{CTA}</span>
      </header>
      <SectionNav active={active} />
    </>
  );
}

export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-8 text-[13px] text-muted">
      <span className="flex items-center gap-2.5">
        <Mark width={28} />
        <span className="max-w-[60ch]">
          {SITE_NAME} collects AI news twice a day. Summaries and briefings are written by Claude from the original
          reporting, which every story links to.
        </span>
      </span>
      <span className="flex gap-4">
        <Link href="/issues" className="link">
          Newsletter archive
        </Link>
        <Link href="/privacy" className="link">
          Privacy
        </Link>
      </span>
    </footer>
  );
}
