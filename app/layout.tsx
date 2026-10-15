import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { fmtLongDate, fmtTime } from "@/lib/format";
import { getGeneratedAt } from "@/lib/site-data";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/types";
import "./globals.css";

const newsreader = localFont({
  src: [
    { path: "./fonts/newsreader-latin-standard-normal.woff2", style: "normal" },
    { path: "./fonts/newsreader-latin-standard-italic.woff2", style: "italic" },
  ],
  weight: "200 800",
  variable: "--font-newsreader",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/inter-latin-standard-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "AI Radar", template: "%s · AI Radar" },
  description: "The latest in AI, collected and summarised every few hours.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#141413" },
  ],
};

async function Masthead() {
  const now = await getGeneratedAt();
  return (
    <header className="pt-5 sm:pt-7">
      <div className="meta flex items-center justify-between gap-4">
        <span>{fmtLongDate(now)}</span>
        <span className="hidden sm:inline">Updated {fmtTime(now)} · every 3 hours</span>
        <Link href="/issues" className="font-semibold text-accent hover:underline sm:hidden">
          Newsletter
        </Link>
      </div>
      <div className="mt-3 border-y-[3px] border-double border-ink py-3 text-center sm:py-4">
        <Link href="/" className="font-serif text-[2.6rem] font-extrabold leading-none tracking-[-0.03em] sm:text-7xl">
          AI Radar
        </Link>
        <p className="mt-1.5 font-serif text-[0.95rem] italic text-muted sm:text-lg">
          What happened in AI, and why it matters
        </p>
      </div>
      <nav
        aria-label="Sections"
        className="-mx-4 flex gap-5 overflow-x-auto border-b border-rule px-4 py-2.5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] sm:mx-0 sm:justify-center sm:px-0"
      >
        <Link href="/" className="shrink-0 hover:text-accent">
          Front page
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/topic/${c}`} className="shrink-0 text-ink-soft hover:text-accent">
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
        <Link href="/issues" className="shrink-0 text-accent hover:underline">
          Newsletter
        </Link>
      </nav>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${newsreader.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-[76rem] px-4 sm:px-6 lg:px-8">
          <Masthead />
          <main className="pb-20">{children}</main>
          <footer className="meta border-t border-rule py-8 text-center">
            AI Radar collects AI news every 3 hours. Summaries are written by Claude; headlines link to the
            original sources.
          </footer>
        </div>
      </body>
    </html>
  );
}
