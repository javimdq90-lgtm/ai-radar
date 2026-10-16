import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer, SiteHeader } from "@/components/brand";
import { NewsletterBox } from "@/components/newsletter";
import { ShareButton } from "@/components/share-button";
import { Byline, Kicker, RelatedItem, sourceName, StoryVisual, storySummary, storyTitle } from "@/components/story";
import { fmtWhen } from "@/lib/format";
import { OG_BASE } from "@/lib/site";
import { getBriefedStoryIds, getIssues, getStory } from "@/lib/site-data";

export async function generateStaticParams() {
  const ids = await getBriefedStoryIds();
  // An empty list would make every story render on demand; keep one entry so the route prerenders.
  return ids.length ? ids.map((id) => ({ id })) : [{ id: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/story/[id]">): Promise<Metadata> {
  const data = await getStory((await params).id);
  if (!data) return { title: "Not found" };
  const { story } = data;
  const title = storyTitle(story);
  const description = storySummary(story);
  const path = `/story/${story.id}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    // The share image is the briefing card in ./opengraph-image.
    openGraph: { ...OG_BASE, type: "article", url: path, title, description, publishedTime: story.firstSeen },
  };
}

/** The display face is caps only and short-headline only; it also lacks curly quotes. */
const DISPLAY_MAX_CHARS = 60;
const forDisplay = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

type ArticleSection = { title: string; paragraphs: string[]; quote?: { text: string; by: string } };

/** "WHY IT MATTERS": section title in the display face, the paragraphs, and a pull quote after the first. */
function Section({ title, paragraphs, quote }: ArticleSection) {
  return (
    <section className="flex flex-col gap-5 text-[18px] leading-[1.75] text-body">
      <h2 className="display m-0 mt-4 text-[18px] tracking-[0.08em] text-fg">{title}</h2>
      {paragraphs.map((p, i) => (
        <div key={p} className="contents">
          <p className="m-0">{p}</p>
          {quote && i === 0 && (
            <figure className="m-0 my-3 border-l-4 border-orange py-1 pl-7">
              <blockquote className="m-0 text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.3] tracking-[-0.01em] text-fg">
                &ldquo;{quote.text.replace(/^["“'‘]|["”'’]$/g, "")}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-[14px] text-muted">{quote.by}</figcaption>
            </figure>
          )}
        </div>
      ))}
    </section>
  );
}

export default async function StoryPage({ params }: PageProps<"/story/[id]">) {
  const [data, issues] = await Promise.all([getStory((await params).id), getIssues()]);
  if (!data) notFound();
  const { story, related, relatedIsSection, generatedAt: now } = data;
  const { brief } = story;
  const title = storyTitle(story);
  const summary = storySummary(story);
  const coverage = [...story.items].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  // The full article when the briefing has one; older briefings fall back to their short context.
  const article = brief?.article;
  const sections: ArticleSection[] = article
    ? [
        { title: "What happened", paragraphs: article.whatHappened },
        { title: "Why it matters", paragraphs: article.whyItMatters, quote: article.pullQuote },
        { title: "What to watch", paragraphs: article.whatToWatch },
      ].filter((s) => s.paragraphs.length)
    : brief
      ? [
          { title: "Why it matters", paragraphs: [brief.context] },
          ...(brief.whatsNext ? [{ title: "What to watch", paragraphs: [brief.whatsNext] }] : []),
        ]
      : story.lead.whyItMatters
        ? [{ title: "Why it matters", paragraphs: [story.lead.whyItMatters] }]
        : [];

  return (
    <>
      <div className="bone">
        <SiteHeader active={story.category} />

        <div className="container-cw flex flex-wrap gap-16 pb-18 pt-16">
          <article className="flex min-w-0 max-w-[820px] flex-[999_1_560px] flex-col gap-7">
            <Kicker story={story} now={now} chip={false} />
            {title.length <= DISPLAY_MAX_CHARS ? (
              <h1 className="display m-0 text-[clamp(32px,5vw,60px)] leading-[1.06] tracking-[0.005em]">{forDisplay(title)}</h1>
            ) : (
              <h1 className="m-0 text-[clamp(30px,4vw,48px)] font-semibold leading-[1.08] tracking-[-0.02em] text-balance">
                {title}
              </h1>
            )}
            {summary && <p className="m-0 max-w-[62ch] text-[clamp(18px,1.8vw,21px)] leading-[1.5] text-dek">{summary}</p>}

            <figure className="m-0 mt-2 flex flex-col gap-2">
              <StoryVisual story={story} ratio="auto" priority />
              {story.image && (
                <figcaption className="text-[13px] text-muted">
                  Image: {sourceName(story.items.find((i) => i.image === story.image) ?? story.lead)}
                </figcaption>
              )}
            </figure>

            <div className="flex flex-wrap items-center gap-4">
              <Byline story={story}>
                {" · "}
                {brief ? "briefed from " : "covered by "}
                <a href="#sources" className="link text-fg">
                  {coverage.length} {coverage.length === 1 ? "source" : "sources"}
                </a>
              </Byline>
              <div className="ml-auto">
                <ShareButton title={title} />
              </div>
            </div>

            {brief && (
              <section aria-labelledby="in-context" className="chamfer-md flex flex-col gap-4 bg-black px-8 py-7 text-bone">
                <h2 id="in-context" className="display m-0 text-[14px] tracking-[0.1em] text-orange">
                  In context
                </h2>
                <ol className="m-0 flex list-none flex-col gap-3 p-0 text-[17px] leading-[1.5]">
                  {brief.keyPoints.map((point, n) => (
                    <li key={point} className="grid grid-cols-[32px_1fr] gap-2">
                      <span className="display pt-1 text-[12px] text-concrete">{String(n + 1).padStart(2, "0")}</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {sections.map((s) => (
              <Section key={s.title} {...s} />
            ))}

            <section id="sources" aria-labelledby="sources-title" className="scroll-mt-6 border-t border-fg pt-5">
              <h2 id="sources-title" className="display m-0 mb-2 text-[14px] tracking-[0.1em]">
                Sources
              </h2>
              <ol className="m-0 list-none p-0">
                {coverage.map((item, n) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid grid-cols-[40px_1fr] items-baseline gap-x-3 gap-y-1 border-b border-rule py-3.5 sm:grid-cols-[40px_1fr_auto]"
                    >
                      <span className="display text-[12px] text-signal">{String(n + 1).padStart(2, "0")}</span>
                      <span className="font-medium">{item.title}</span>
                      <span className="col-start-2 text-[13px] text-muted sm:col-start-auto">
                        {sourceName(item)} · {fmtWhen(item.publishedAt, now)}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <p className="m-0 text-[13px] text-muted">
              {brief ? "This briefing was" : "These summaries were"} written by Claude from the sources above. Check the
              original reporting before relying on it.
            </p>
          </article>

          <aside aria-label="More stories" className="min-w-0 flex-[1_1_300px]">
            {related.length > 0 && (
              <>
                <h2 className="display m-0 mb-1 border-b border-fg pb-3 text-[14px] tracking-[0.1em]">
                  {relatedIsSection ? "More context" : "Latest"}
                </h2>
                <ul className="m-0 list-none p-0">
                  {related.map((s) => (
                    <RelatedItem key={s.id} story={s} now={now} />
                  ))}
                </ul>
              </>
            )}
          </aside>
        </div>

        <NewsletterBox variant="band" latestIssue={issues[0] ?? null} />
      </div>
      <Footer newsletterHref="#newsletter" />
    </>
  );
}
