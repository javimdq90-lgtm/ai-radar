import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { loadGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides",
  description: "Practical how-tos for the AI tools in the news, written from each maker's official documentation.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  const guides = loadGuides();
  return (
    <PageShell
      active="guides"
      title="Guides"
      intro="Practical how-tos for the AI tools in the news. Each one is written with Claude from the maker's official documentation, in our own words, and links to every page it draws on."
    >
      {guides.length ? (
        <ul className="m-0 grid list-none border-t-2 border-fg p-0 sm:grid-cols-2 sm:gap-x-8">
          {guides.map((g) => (
            <li key={g.slug} className="border-b border-rule">
              <Link href={`/guides/${g.slug}`} className="group flex h-full flex-col gap-2.5 py-6 hover:text-fg">
                <span className="kicker text-signal">
                  {g.product} · {g.level}
                </span>
                <span className="text-[21px] font-semibold leading-[1.25] group-hover:text-signal">{g.title}</span>
                <span className="text-[15px] leading-[1.55] text-dek">{g.dek}</span>
                <span className="mt-auto pt-1 text-[13px] text-muted">
                  {g.steps.length} steps · {g.minutes} min
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-10 text-muted">No guides yet.</p>
      )}
    </PageShell>
  );
}
