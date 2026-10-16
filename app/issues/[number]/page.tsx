import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompactHeader } from "@/components/brand";
import { NewsletterBox } from "@/components/newsletter";
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
    <p className="m-0 flex flex-wrap gap-x-1.5 text-[13px] text-muted">
      <span>Sources:</span>
      {links.slice(0, 4).map((l, n) => (
        <span key={l.url}>
          <a href={l.url} target="_blank" rel="noreferrer" className="link text-text">
            {l.source}
          </a>
          {n < Math.min(links.length, 4) - 1 && ","}
        </span>
      ))}
    </p>
  );
}

/** "01 · THE BIG ONE", the numbered mono label from the email design. */
function SectionLabel({ n, children }: { n: number; children: string }) {
  return (
    <h2 className="m-0 font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-accent">
      {String(n).padStart(2, "0")} · {children}
    </h2>
  );
}

export default async function IssuePage({ params }: PageProps<"/issues/[number]">) {
  const issue = await getIssue(Number((await params).number));
  if (!issue) notFound();

  return (
    <>
      <CompactHeader />
      <div className="flex flex-wrap gap-14 pb-16 pt-12">
        <article className="flex min-w-0 max-w-[760px] flex-[999_1_560px] flex-col gap-7">
          <Link href="/issues" className="text-[13px] text-muted">
            ← All issues
          </Link>
          <p className="m-0 font-mono text-[12px] tracking-[0.04em] text-muted">
            ISSUE #{issue.number} · {fmtLongDate(issue.date).toUpperCase()}
          </p>
          <h1 className="m-0 font-display text-[clamp(38px,6vw,64px)] font-normal leading-[1.02] tracking-[-0.5px] text-balance">
            {issue.subject}
          </h1>
          <p className="m-0 font-display text-[22px] leading-[1.4] text-body">{issue.intro}</p>

          {issue.sections.map((section, i) => (
            <section key={section.heading} className="flex flex-col border-t border-line pt-7">
              <SectionLabel n={i + 1}>{section.heading}</SectionLabel>
              {section.stories.map((s) => (
                <div key={s.storyId} className="flex flex-col gap-3 border-b border-line py-6 last:border-b-0">
                  <h3 className="m-0 font-display text-[30px] font-normal leading-[1.1]">{s.headline}</h3>
                  <p className="m-0 text-[18px] leading-[1.7] text-body">{s.body}</p>
                  <Sources issue={issue} storyId={s.storyId} />
                </div>
              ))}
            </section>
          ))}

          {issue.quickHits.length > 0 && (
            <section className="flex flex-col border-t border-line pt-7">
              <SectionLabel n={issue.sections.length + 1}>In brief</SectionLabel>
              <ul className="m-0 mt-1.5 list-none p-0">
                {issue.quickHits.map((q) => {
                  const href = issue.links[q.storyId]?.[0]?.url;
                  return (
                    <li key={q.storyId} className="border-b border-line py-3 text-[17px] leading-[1.5]">
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
        <aside className="min-w-0 flex-[1_1_300px]">
          <NewsletterBox />
        </aside>
      </div>
    </>
  );
}
