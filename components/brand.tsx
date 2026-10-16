import Link from "next/link";
import type { ReactNode } from "react";
import { SearchButton } from "@/components/search-box";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/types";

export const SITE_NAME = "Context Window";
export const TAGLINE = "AI news. A wider context.";
export const SUBLINE = "Essential stories, deeper analysis and fresh perspectives on an AI-shaped world.";

/** The window: open chamfer top-left, chamfered bottom-right. */
export function Symbol({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden className={`shrink-0 ${className}`}>
      <path d="M32 12 H88 V68 L68 88 H12 V36" stroke="var(--cw-orange)" strokeWidth="13" />
      <path d="M26 12 L12 26" stroke="var(--cw-orange)" strokeWidth="5" />
    </svg>
  );
}

/** Stacked CONTEXT / WINDOW in the display face. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`display leading-[1.05] tracking-[0.05em] ${className}`}>
      Context
      <br />
      Window
    </span>
  );
}

export type NavKey = Category | "briefings";

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "briefings", label: "Briefings", href: "/briefings" },
  ...CATEGORIES.map((c) => ({ key: c, label: CATEGORY_LABELS[c], href: `/topic/${c}` })),
];

/** The header shows five sections so it stays uncluttered; the footer lists them all. */
const HEADER_NAV: NavKey[] = ["briefings", "models", "research", "products", "policy"];

/**
 * Logo left, five caps sections (active in orange) and a bare search icon. From lg the sections
 * sit centred on one row; below that they wrap onto their own row under the logo. `overlay`
 * makes the header transparent so it can sit on the front-page hero image. Inside a `.bone`
 * page the same markup turns light.
 */
export function SiteHeader({ active, overlay = false }: { active?: NavKey; overlay?: boolean }) {
  return (
    <header className={overlay ? "relative z-20" : "border-b border-rule"}>
      <div className="container-cw flex min-h-[72px] flex-wrap items-center gap-x-6 py-2 lg:flex-nowrap">
        <Link href="/" aria-label={`${SITE_NAME}, front page`} className="flex items-center gap-3 hover:text-fg">
          <Symbol size={36} className="max-sm:h-[30px] max-sm:w-[30px]" />
          <Wordmark className="text-[13px]" />
        </Link>
        <nav
          aria-label="Main sections"
          className="order-last flex w-full flex-wrap gap-x-5 lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:gap-x-7"
        >
          {NAV.filter((item) => HEADER_NAV.includes(item.key)).map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
              className={`caps inline-flex min-h-11 items-center text-[11px] font-semibold ${active === item.key ? "text-signal" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto lg:ml-0">
          <SearchButton bare onImage={overlay} />
        </div>
      </div>
    </header>
  );
}

/** Section title in the display face. */
export function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="display m-0 text-[18px] tracking-[0.08em]">
      {children}
    </h2>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="display m-0 text-[12px] tracking-[0.12em] text-orange">{title}</h2>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15px]">{children}</ul>
    </div>
  );
}

const footerLink = "text-dek hover:text-orange";

/**
 * Orange sign-up band; the brand and three columns of links on a hairline grid; an oversized
 * one-line wordmark; a small bottom bar. Always dark, even under bone pages. `newsletterHref`
 * points at the page's own sign-up box where it has one.
 */
export function Footer({ newsletterHref = "/#newsletter" }: { newsletterHref?: string }) {
  const sections = NAV.slice(0, 4);
  const topics = NAV.slice(4);
  return (
    <footer className="bg-black text-bone [--dek:#c8cace] [--fg:var(--cw-bone)] [--muted:var(--cw-concrete)] [--rule-strong:#2a2d33] [--rule:#1e2026] [--signal:var(--cw-orange)]">
      <div className="bg-orange text-black">
        <div className="container-cw flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-7">
          <p className="display m-0 text-[clamp(18px,2.2vw,26px)] leading-[1.15]">
            The Context Briefing. <span className="text-black/60">Three times a week.</span>
          </p>
          <Link
            href={newsletterHref}
            className="caps inline-flex min-h-12 items-center gap-3 bg-black px-6 text-bone [clip-path:var(--cw-chamfer-sm)] hover:text-orange"
          >
            Get the briefing →
          </Link>
        </div>
      </div>

      <div className="container-cw grid gap-x-10 gap-y-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="flex max-w-[34ch] flex-col gap-5">
          <Link href="/" aria-label={`${SITE_NAME}, front page`} className="flex items-center gap-3 hover:text-bone">
            <Symbol size={44} />
            <Wordmark className="text-[15px]" />
          </Link>
          <p className="m-0 text-[22px] font-medium leading-[1.2] tracking-[-0.01em]">{TAGLINE}</p>
          <p className="m-0 text-[14px] leading-[1.6] text-muted">{SUBLINE}</p>
        </div>
        <FooterColumn title="Sections">
          {sections.map((item) => (
            <li key={item.key}>
              <Link href={item.href} className={footerLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="More topics">
          {topics.map((item) => (
            <li key={item.key}>
              <Link href={item.href} className={footerLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </FooterColumn>
        <FooterColumn title="Context Window">
          <li>
            <Link href="/issues" className={footerLink}>
              Newsletter archive
            </Link>
          </li>
          <li>
            <Link href={newsletterHref} className={footerLink}>
              Subscribe
            </Link>
          </li>
          <li>
            <Link href="/privacy" className={footerLink}>
              Privacy
            </Link>
          </li>
        </FooterColumn>
      </div>

      {/* Oversized wordmark spanning the content width: the display face sets this line at about
          11.2× its font size, so the font is the container's width (cqw) divided by a bit more. */}
      <div className="container-cw overflow-hidden [container-type:inline-size]" aria-hidden>
        <p className="display m-0 whitespace-nowrap text-[calc(100cqw/11.35)] leading-[0.9] tracking-[0.02em] text-[#24272d]">
          Context <span className="text-orange/80">Window</span>
        </p>
      </div>

      <div className="container-cw mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-rule py-6 text-[12px] text-muted">
        <span>© Context Window · contextwindow.me</span>
        <a href="#" className="caps text-[11px] hover:text-orange">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
