import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompactHeader } from "@/components/brand";
import { NewsletterBox } from "@/components/newsletter";
import { Kicker, RelatedItem, readMinutes, sourceName, StoryVisual, storySummary, storyTitle } from "@/components/story";
import { fmtDateTime, fmtWhen } from "@/lib/format";
import { getBriefedStoryIds, getIssues, getStory } from "@/lib/site-data";
import { CATEGORY_LABELS } from "@/lib/types";

export async function generateStaticParams() {
  const ids = await getBriefedStoryIds();
  // An empty list would make every story render on demand; keep one entry so the route prerenders.
  return ids.length ? ids.map((id) => ({ id })) : [{ id: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/story/[id]">): Promise<Metadata> {
  const data = await getStory((await params).id);
  if (!data) return { title: "Not found" };
  return { title: storyTitle(data.story), description: storySummary(data.story) };
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <section className="flex flex-col gap-[18px] text-[18px] leading-[1.7] text-body">
      <h2 className="m-0 mt-3 font-display text-[34px] font-normal leading-[1.1] text-text">{title}</h2>
      <p className="m-0">{children}</p>
    </section>
  );
}

export default async function StoryPage({ params }: PageProps<"/story/[id]">) {
  const [data, issues] = await Promise.all([getStory((await params).id), getIssues()]);
  if (!data) notFound();
  const { story, related, relatedIsSection, generatedAt: now } = data;
  const { brief } = story;
  const summary = storySummary(story);
  const coverage = [...story.items].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

  return (
    <>
      <CompactHeader active={story.category} />

      <div className="flex flex-wrap gap-14 pb-16 pt-12">
        <article className="flex min-w-0 max-w-[760px] flex-[999_1_560px] flex-col gap-7">
          <Kicker story={story} now={now} dot chip={false} />
          <h1 className="m-0 font-display text-[clamp(38px,6vw,64px)] font-normal leading-[1.02] tracking-[-0.5px] text-balance">
            {storyTitle(story)}
          </h1>
          {summary && <p className="m-0 text-[21px] leading-[1.55] text-dek">{summary}</p>}

          <p className="m-0 flex flex-wrap gap-x-5 gap-y-2 border-y border-line py-3.5 text-sm text-muted">
            <span>
              {brief ? "Briefed from " : "Covered by "}
              <a href="#sources" className="link text-text">
                {coverage.length} {coverage.length === 1 ? "source" : "sources"}
              </a>
            </span>
            <time dateTime={story.firstSeen}>{fmtDateTime(story.firstSeen)}</time>
            {brief && <span>{readMinutes(brief)} min read</span>}
            {brief && <span>Updated {fmtWhen(brief.writtenAt, now)}</span>}
          </p>

          {brief && (
            <section
              aria-labelledby="in-context"
              className="flex flex-col gap-3.5 rounded-cw-lg border border-line bg-surface p-6"
            >
              <h2
                id="in-context"
                className="m-0 font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-accent"
              >
                In context
              </h2>
              <ul className="m-0 flex list-disc flex-col gap-2.5 pl-5 text-[17px] leading-[1.5]">
                {brief.keyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          )}

          <figure className="m-0 flex flex-col gap-2">
            <StoryVisual story={story} priority />
            {story.image && (
              <figcaption className="text-[13px] text-muted">
                Image: {sourceName(story.items.find((i) => i.image === story.image) ?? story.lead)}
              </figcaption>
            )}
          </figure>

          {brief ? (
            <>
              <Section title="Why it matters">{brief.context}</Section>
              {brief.whatsNext && <Section title="What to watch">{brief.whatsNext}</Section>}
            </>
          ) : (
            story.lead.whyItMatters && <Section title="Why it matters">{story.lead.whyItMatters}</Section>
          )}

          <section id="sources" aria-labelledby="sources-title" className="flex scroll-mt-24 flex-col border-t-2 border-text pt-4">
            <h2 id="sources-title" className="label m-0 mb-2 tracking-[0.12em] text-muted">
              Sources
            </h2>
            <ol className="m-0 list-none p-0">
              {coverage.map((item, n) => (
                <li key={item.id}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="grid grid-cols-[32px_1fr] gap-x-3 gap-y-1 border-b border-line py-3 sm:grid-cols-[32px_1fr_auto]"
                  >
                    <span className="font-mono text-accent">{String(n + 1).padStart(2, "0")}</span>
                    <span>{item.title}</span>
                    <span className="col-start-2 text-sm text-muted sm:col-start-auto">
                      {sourceName(item)} · {fmtWhen(item.publishedAt, now)}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <p className="m-0 text-[13px] italic text-muted">
            {brief ? "This briefing was" : "These summaries were"} written by Claude from the sources above. Check the
            original reporting before relying on it.
          </p>
        </article>

        <aside aria-label="More" className="flex min-w-0 flex-[1_1_300px] flex-col gap-8">
          {related.length > 0 && (
            <div>
              <h2 className="rail-heading">
                {relatedIsSection ? `More in ${CATEGORY_LABELS[story.category]}` : "Latest"}
              </h2>
              <ul className="m-0 list-none p-0">
                {related.map((s) => (
                  <RelatedItem key={s.id} story={s} now={now} />
                ))}
              </ul>
            </div>
          )}
          <NewsletterBox latestIssue={issues[0] ?? null} />
        </aside>
      </div>
    </>
  );
}
