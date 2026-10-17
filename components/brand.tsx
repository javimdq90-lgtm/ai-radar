import Link from "next/link";
import type { ReactNode } from "react";
import { SearchButton } from "@/components/search-box";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/types";

export const SITE_NAME = "Context Window";
export const TAGLINE = "AI news. A wider context.";
export const SUBLINE = "Essential stories, deeper analysis and fresh perspectives on an AI-shaped world.";

/** The logo's lettering, one shape per letter, in the logo's own coordinates. */
type Letter = { d: string; evenodd?: boolean };
const CONTEXT: Letter[] = [
  { d: "M451 85H550V103H470L454.56 117.628C452.287 119.781 451 122.773 451 125.903C451 129.146 452.381 132.236 454.798 134.399L470 148H550V165H451L431 144V106L451 85Z" },
  { d: "M580 85H671L691 105V145L671 165H580L560 145V105L580 85ZM589 103L578 113V137L589 148H662L673 137V113L662 103H589Z", evenodd: true },
  { d: "M705 165V85H729L807 143V85H826V165H803L724 107V165H705Z" },
  { d: "M835 85H948V103H901V165H882V103H835V85Z" },
  { d: "M958 85H1065V103H977V117H1055V133H977V148H1065V165H958V85Z" },
  { d: "M1099 85.1L1074 85L1121.5 130L1083 165H1108L1134 141L1159 165H1185L1147 130L1195 85H1170L1134 119L1099 85.1Z" },
  { d: "M1204 85H1325V103H1274V165H1255V103H1204V85Z" },
];
const WINDOW: Letter[] = [
  { d: "M430 203H451L482 264L512 203H532L562 264L593 203H614L572 287H552L522 229L492 287H472L430 203Z" },
  { d: "M635 203H655V287H635V203Z" },
  { d: "M670 287V203H694L814 265V203H833V287H810L689 225V287H670Z" },
  { d: "M848 203H945L965 223V267L945 287H848V203ZM867 221V269H936L947 258V231L936 221H867Z", evenodd: true },
  { d: "M994 203H1090L1110 223V267L1090 287H994L974 267V223L994 203ZM1003 221L992 232V258L1003 269H1081L1092 258V232L1081 221H1003Z", evenodd: true },
  { d: "M1120 203H1141L1172 264L1202 203H1222L1252 264L1283 203H1304L1262 287H1242L1212 229L1182 287H1162L1120 203Z" },
];

function Letters({ letters }: { letters: Letter[] }) {
  return letters.map(({ d, evenodd }) => (
    <path key={d} d={d} {...(evenodd ? { fillRule: "evenodd" as const, clipRule: "evenodd" as const } : {})} />
  ));
}

/**
 * The logo: the orange window and the stacked CONTEXT / WINDOW lettering. The lettering takes
 * the text colour (with a faint sheen), so it turns dark on bone pages. `id` keeps gradient ids
 * unique when the logo appears twice on a page. Size it with a height class; width follows.
 */
export function Logo({ id = "cw", className = "" }: { id?: string; className?: string }) {
  return (
    <svg viewBox="47 43 1278 284" fill="none" aria-hidden className={`w-auto shrink-0 ${className}`}>
      <defs>
        <linearGradient id={`${id}-0`} x1="47" y1="43" x2="329.992" y2="350.904" gradientUnits="userSpaceOnUse"><stop stopColor="#FF3D00" /><stop offset="0.58" stopColor="#FF4A00" /><stop offset="1" stopColor="#DF2F00" /></linearGradient>
        <linearGradient id={`${id}-1`} x1="307" y1="43" x2="356" y2="43" gradientUnits="userSpaceOnUse"><stop stopColor="#FF4B00" /><stop offset="1" stopColor="#EE3500" /></linearGradient>
        <linearGradient id={`${id}-2`} x1="134" y1="239" x2="186.031" y2="378.933" gradientUnits="userSpaceOnUse"><stop stopColor="#FF4A00" /><stop offset="0.7" stopColor="#FF3B00" /><stop offset="1" stopColor="#E82F00" /></linearGradient>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="currentColor" />
          <stop offset="0.46" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="0.54" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.86" />
        </linearGradient>
      </defs>
      <path d="M47 130L133 43H356L307 93H135L95 132V327H47V130Z" fill={`url(#${id}-0)`} />
      <path d="M307 93L356 43V248L307 279V93Z" fill={`url(#${id}-1)`} />
      <path d="M134 278H268L307 239H356V248L287 327H134V278Z" fill={`url(#${id}-2)`} />
      <path d="M47 132H95V327H47V132Z" fill="#F13A00" opacity="0.76" />
      <path d="M307 93H356L328 110L307 123V93Z" fill="#911F00" opacity="0.58" />
      <path d="M95 132H47L74.4286 145.6L95 156V132Z" fill="#BF2900" opacity="0.58" />
      <path d="M133 43L135 93L147.5 66L157 43L133 43Z" fill="#BF2900" opacity="0.58" />
      <path d="M134 278H245L191.5 301L134 327V278Z" fill="#BF2900" opacity="0.58" />
      <path d="M307 93L356 43V93H307Z" fill="#D52D00" opacity="0.62" />
      <g fill={`url(#${id}-t)`}>
        <Letters letters={CONTEXT} />
        <Letters letters={WINDOW} />
      </g>
    </svg>
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
          <Logo id="cw-header" className="h-9 max-sm:h-[30px]" />
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
            <Logo id="cw-footer" className="h-11" />
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

      {/* Oversized one-line wordmark in the logo's lettering, WINDOW moved up beside CONTEXT; the
          SVG scales to the content width, so it always fits. */}
      <div className="container-cw" aria-hidden>
        <svg viewBox="431 85 1832 84" className="block h-auto w-full">
          <g fill="#24272d">
            <Letters letters={CONTEXT} />
          </g>
          <g fill="var(--cw-orange)" fillOpacity="0.8" transform="translate(959 -118)">
            <Letters letters={WINDOW} />
          </g>
        </svg>
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
