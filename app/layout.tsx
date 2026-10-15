import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/types";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AI Radar", template: "%s · AI Radar" },
  description: "The latest in AI, collected and summarised every few hours.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <header className="border-b-2 border-fg pb-3 pt-8">
            <div className="flex items-baseline justify-between gap-4">
              <Link href="/" className="text-lg font-bold uppercase tracking-[0.14em]">
                AI Radar
              </Link>
              <nav className="flex gap-4 text-sm">
                <Link href="/" className="hover:text-accent">
                  Today
                </Link>
                <Link href="/issues" className="hover:text-accent">
                  Newsletter
                </Link>
              </nav>
            </div>
            <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto text-xs text-muted">
              {CATEGORIES.map((c) => (
                <Link key={c} href={`/topic/${c}`} className="shrink-0 rounded px-1.5 py-1 hover:bg-rule hover:text-fg">
                  {CATEGORY_LABELS[c]}
                </Link>
              ))}
            </nav>
          </header>
          <main className="pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
