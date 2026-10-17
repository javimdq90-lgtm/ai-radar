import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, SiteHeader } from "@/components/brand";
import { NewsletterBox } from "@/components/newsletter";
import { StoryVisual } from "@/components/story";
import { fmtLongDate } from "@/lib/format";
import { getIssue, getIssues, getStories } from "@/lib/site-data";
import type { Issue, Story } from "@/lib/types";

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
          <a href={l.url} target="_blank" rel="noreferrer" className="link text-fg">
            {l.source}
          </a>
          {n < Math.min(links.length, 4) - 1 && ","}
        </span>
      ))}
    </p>
  );
}

/** "THE BIG ONE": section title in the display face (which has no curly apostrophes). */
function SectionLabel({ children }: { children: string }) {
  return <h2 className="display m-0 text-[18px] tracking-[0.08em]">{children.replace(/[‘’]/g, "'")}</h2>;
}

/**
 * A newsletter issue, read like an article: bone page, sections of stories with their images, a
 * dark sign-up band. Stories we briefed link to the briefing (which counts toward the meter);
 * the rest link to their sources.
 */
export default async function IssuePage({ params }: PageProps<"/issues/[number]">) {
  const [issue, stories] = await Promise.all([getIssue(Number((await params).number)), getStories()]);
  if (!issue) notFound();
  const byId = new Map<string, Story>(stories.map((s) => [s.id, s]));
  const briefing = (id: string) => (byId.get(id)?.brief ? `/story/${id}` : undefined);

  return (
    <>
      <div className="bone">
        <SiteHeader />
        <div className="container-cw pb-18 pt-14">
          <article className="flex max-w-[820px] flex-col gap-7">
            <Link href="/issues" className="caps text-muted">
              ← All issues
            </Link>
            <p className="kicker m-0 text-signal">
              Issue #{issue.number} · {fmtLongDate(issue.date)}
            </p>
            <h1 className="m-0 text-[clamp(30px,4vw,46px)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance">
              {issue.subject}
            </h1>
            <p className="m-0 border-b border-rule pb-7 text-[21px] leading-[1.55] text-dek">{issue.intro}</p>

            {issue.sections.map((section) => (
              <section key={section.heading} className="flex flex-col gap-2 pt-4">
                <SectionLabel>{section.heading}</SectionLabel>
                {section.stories.map((s) => {
                  const href = briefing(s.storyId);
                  const visual = <StoryVisual story={byId.get(s.storyId) ?? { id: s.storyId }} ratio="16/9" />;
                  return (
                    <div key={s.storyId} className="flex flex-col gap-3 border-b border-rule py-6 last:border-b-0">
                      <div className="mb-2">
                        {href ? (
                          <Link href={href} className="group block" tabIndex={-1} aria-hidden>
                            {visual}
                          </Link>
                        ) : (
                          visual
                        )}
                      </div>
                      <h3 className="m-0 text-[24px] font-semibold leading-[1.25]">
                        {href ? (
                          <Link href={href} className="hover:text-signal">
                            {s.headline}
                          </Link>
                        ) : (
                          s.headline
                        )}
                      </h3>
                      <p className="m-0 text-[18px] leading-[1.7] text-body">{s.body}</p>
                      <Sources issue={issue} storyId={s.storyId} />
                      {href && (
                        <Link href={href} className="caps mt-1 self-start text-[12px] text-signal hover:text-fg">
                          Read the briefing →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}

            {issue.quickHits.length > 0 && (
              <section className="flex flex-col gap-2 pt-4">
                <SectionLabel>In brief</SectionLabel>
                <ul className="m-0 list-none border-t border-fg p-0">
                  {issue.quickHits.map((q) => {
                    const own = briefing(q.storyId);
                    const href = issue.links[q.storyId]?.[0]?.url;
                    return (
                      <li key={q.storyId} className="border-b border-rule py-3.5 text-[17px] leading-[1.5]">
                        {own ? (
                          <Link href={own}>
                            {q.text} <span className="text-signal">→</span>
                          </Link>
                        ) : href ? (
                          <a href={href} target="_blank" rel="noreferrer">
                            {q.text} <span className="text-signal">→</span>
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
        </div>
        <NewsletterBox variant="band" />
      </div>
      <Footer newsletterHref="#newsletter" />
    </>
  );
}
