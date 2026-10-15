import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtDate } from "@/lib/format";
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

function Links({ issue, storyId }: { issue: Issue; storyId: string }) {
  const links = issue.links[storyId] ?? [];
  return (
    <p className="mt-2 flex flex-wrap gap-x-3 text-sm">
      {links.slice(0, 4).map((l) => (
        <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
          {l.source}
        </a>
      ))}
    </p>
  );
}

export default async function IssuePage({ params }: PageProps<"/issues/[number]">) {
  const issue = await getIssue(Number((await params).number));
  if (!issue) notFound();

  return (
    <article className="pt-6">
      <Link href="/issues" className="text-xs text-muted hover:text-fg">
        ← All issues
      </Link>
      <p className="mt-4 text-xs text-muted">
        #{issue.number} · {fmtDate(issue.date)}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-bold leading-tight">{issue.subject}</h1>
      <p className="mt-4 font-serif text-lg leading-relaxed">{issue.intro}</p>

      {issue.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="border-b border-rule pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {section.heading}
          </h2>
          {section.stories.map((s) => (
            <div key={s.storyId} className="py-4">
              <h3 className="font-serif text-xl font-bold leading-snug">{s.headline}</h3>
              <p className="mt-2 font-serif text-[1.05rem] leading-relaxed">{s.body}</p>
              <Links issue={issue} storyId={s.storyId} />
            </div>
          ))}
        </section>
      ))}

      {issue.quickHits.length > 0 && (
        <section className="mt-8">
          <h2 className="border-b border-rule pb-2 text-xs font-semibold uppercase tracking-wider text-muted">Quick hits</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-serif">
            {issue.quickHits.map((q) => {
              const href = issue.links[q.storyId]?.[0]?.url;
              return (
                <li key={q.storyId}>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="hover:text-accent">
                      {q.text}
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
