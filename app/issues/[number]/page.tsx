import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { Footer, SiteHeader } from "@/components/brand";
import { NewsletterBox } from "@/components/newsletter";
import { StoryVisual } from "@/components/story";
import { fmtLongDate } from "@/lib/format";
import { feedbackPath, nextIssueDay, RATINGS, SIGN_OFF } from "@/lib/issue-extras";
import { getIssue, getIssues, getStories } from "@/lib/site-data";
import type { Issue, Sponsor, Story } from "@/lib/types";

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

/** A paid placement, always labelled "Sponsored". */
function SponsorBlock({ sponsor }: { sponsor: Sponsor }) {
  return (
    <aside aria-label="Sponsored" className="flex flex-col gap-3 bg-raised p-7">
      <p className="kicker m-0 text-muted">Sponsored · Together with {sponsor.name}</p>
      <p className="m-0 text-[22px] font-semibold leading-[1.25]">{sponsor.headline}</p>
      <p className="m-0 text-[17px] leading-[1.6] text-body">{sponsor.body}</p>
      <a href={sponsor.url} target="_blank" rel="sponsored noopener" className="caps mt-1 self-start text-[12px] text-signal hover:text-fg">
        {sponsor.cta ?? `Visit ${sponsor.name}`} →
      </a>
    </aside>
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
            <p className="m-0 text-[21px] leading-[1.55] text-dek">{issue.intro}</p>

            <nav aria-labelledby="issue-contents" className="border-y border-rule py-5">
              <h2 id="issue-contents" className="kicker m-0 mb-3 text-signal">
                In this issue
              </h2>
              <ol className="m-0 flex list-none flex-col gap-1.5 p-0 text-[16px]">
                {issue.sections.flatMap((sec) =>
                  sec.stories.map((s) => (
                    <li key={s.storyId}>
                      <a href={`#s-${s.storyId}`} className="hover:text-signal">
                        <span className="text-signal">▸</span> {s.headline}
                      </a>
                    </li>
                  )),
                )}
                {issue.quickHits.length > 0 && (
                  <li className="text-muted">
                    <a href="#in-brief" className="hover:text-signal">
                      <span className="text-signal">▸</span> Plus {issue.quickHits.length} more in brief
                    </a>
                  </li>
                )}
              </ol>
            </nav>

            {issue.sections.map((section, i) => (
              <Fragment key={section.heading}>
                <section className="flex flex-col gap-2 pt-4">
                  <SectionLabel>{section.heading}</SectionLabel>
                  {section.stories.map((s) => {
                    const href = briefing(s.storyId);
                    const visual = <StoryVisual story={byId.get(s.storyId) ?? { id: s.storyId }} ratio="16/9" />;
                    return (
                      <div key={s.storyId} id={`s-${s.storyId}`} className="flex scroll-mt-6 flex-col gap-3 border-b border-rule py-6 last:border-b-0">
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
                        {s.why && (
                          <p className="m-0 border-l-[3px] border-orange pl-4 text-[18px] leading-[1.6]">
                            <strong>Why it matters:</strong> {s.why}
                          </p>
                        )}
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
                {i === 0 && issue.sponsor && <SponsorBlock sponsor={issue.sponsor} />}
              </Fragment>
            ))}

            {issue.quickHits.length > 0 && (
              <section id="in-brief" className="flex scroll-mt-6 flex-col gap-2 pt-4">
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

            <section aria-labelledby="rate-title" className="flex flex-col gap-4 border-t border-fg pt-6">
              <h2 id="rate-title" className="m-0 text-[22px] font-semibold">
                How was this issue?
              </h2>
              <div className="flex flex-wrap gap-2">
                {RATINGS.map((r) => (
                  <Link
                    key={r.key}
                    href={feedbackPath(issue.number, r.key)}
                    className="inline-flex min-h-11 items-center border border-fg px-5 text-[15px] font-semibold hover:border-signal hover:text-signal"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
              <p className="m-0 text-[16px] text-dek">
                That&rsquo;s it for #{issue.number}. The next issue lands {nextIssueDay(issue.date)} morning.
                <br />
                <strong className="text-fg">{SIGN_OFF}</strong>
              </p>
            </section>
          </article>
        </div>
        <NewsletterBox variant="band" />
      </div>
      <Footer newsletterHref="#newsletter" />
    </>
  );
}
