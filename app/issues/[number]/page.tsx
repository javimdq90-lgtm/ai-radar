import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtLongDate } from "@/lib/format";
import { getIssue, getIssues } from "@/lib/site-data";
import type { Issue } from "@/lib/types";

export async function generateStaticParams() {
  const issues = await getIssues();
  // An empty list would make every issue render on demand; keep one entry so the route prerenders.
  return issues.length ? issues.map((i) => ({ number: String(i.number) })) : [{ number: "1" }];
}

export async function generateMetadata({ params }: PageProps<"/issues/[number]">): Promise<Metadata> {
  const issue = await getIssue(Number((await params).number));
  return { title: issue ? `#${issue.number}: ${issue.subject}` : "Not found" };
}

function Sources({ issue, storyId }: { issue: Issue; storyId: string }) {
  const links = issue.links[storyId] ?? [];
  if (!links.length) return null;
  return (
    <p className="meta mt-3 flex flex-wrap gap-x-1.5">
      <span>Sources:</span>
      {links.slice(0, 4).map((l, n) => (
        <span key={l.url}>
          <a href={l.url} target="_blank" rel="noreferrer" className="link font-semibold text-ink">
            {l.source}
          </a>
          {n < Math.min(links.length, 4) - 1 && ","}
        </span>
      ))}
    </p>
  );
}

export default async function IssuePage({ params }: PageProps<"/issues/[number]">) {
  const issue = await getIssue(Number((await params).number));
  if (!issue) notFound();

  return (
    <article className="mx-auto max-w-2xl pt-8">
      <Link href="/issues" className="meta link">
        ← All issues
      </Link>
      <p className="kicker mt-6 text-accent">
        Issue #{issue.number} · {fmtLongDate(issue.date)}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl">
        {issue.subject}
      </h1>
      <p className="dek mt-5 text-xl leading-relaxed">{issue.intro}</p>

      {issue.sections.map((section) => (
        <section key={section.heading} className="mt-12">
          <h2 className="border-t-[3px] border-ink pt-2 font-sans text-[0.8rem] font-bold uppercase tracking-[0.14em]">
            {section.heading}
          </h2>
          {section.stories.map((s) => (
            <div key={s.storyId} className="border-b border-rule py-6 last:border-b-0">
              <h3 className="headline text-[1.6rem] leading-tight">{s.headline}</h3>
              <p className="mt-3 text-[1.12rem] leading-[1.7]">{s.body}</p>
              <Sources issue={issue} storyId={s.storyId} />
            </div>
          ))}
        </section>
      ))}

      {issue.quickHits.length > 0 && (
        <section className="mt-12">
          <h2 className="border-t-[3px] border-ink pt-2 font-sans text-[0.8rem] font-bold uppercase tracking-[0.14em]">
            Quick hits
          </h2>
          <ul className="mt-2 divide-y divide-rule">
            {issue.quickHits.map((q) => {
              const href = issue.links[q.storyId]?.[0]?.url;
              return (
                <li key={q.storyId} className="py-3 text-[1.08rem] leading-relaxed">
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="hover:underline">
                      {q.text} <span className="text-accent">→</span>
                    </a>
                  ) : (
                    q.text
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
