import Link from "next/link";
import type { ReactNode } from "react";
import { Thumb } from "@/components/thumb";
import { fmtWhen, hostname } from "@/lib/format";
import { SOURCE_NAMES } from "@/lib/sources";
import { CATEGORY_LABELS, type Item, type Story } from "@/lib/types";

export const sourceName = (i: Item) =>
  i.sourceId === "hn" ? hostname(i.url) : (SOURCE_NAMES[i.sourceId] ?? i.sourceId);

/** Briefed stories have their own page; the rest link straight to the original article. */
export const storyTitle = (s: Story) => s.brief?.headline ?? s.lead.title;
export const storySummary = (s: Story) => s.brief?.dek ?? s.lead.summary;

export function StoryLink({ story, className, children }: { story: Story; className?: string; children: ReactNode }) {
  if (story.brief) {
    return (
      <Link href={`/story/${story.id}`} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={story.lead.url} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

function Kicker({ story, showCategory = true }: { story: Story; showCategory?: boolean }) {
  const badges = [story.brief && "Briefing", story.sourceCount >= 3 && `${story.sourceCount} sources`].filter(Boolean);
  if (!showCategory && !badges.length) return null;
  return (
    <p className="kicker flex flex-wrap items-center gap-2">
      {showCategory && (
        <Link href={`/topic/${story.category}`} className="text-accent hover:underline">
          {CATEGORY_LABELS[story.category]}
        </Link>
      )}
      {badges.map((b) => (
        <span key={String(b)} className="rounded-sm bg-accent-soft px-1.5 py-0.5 text-[0.66rem] text-accent">
          {b}
        </span>
      ))}
    </p>
  );
}

function Headline({ story, className }: { story: Story; className: string }) {
  return (
    <StoryLink story={story} className={`headline block ${className}`}>
      {storyTitle(story)}
    </StoryLink>
  );
}

/** "OpenAI · 14:05 · also The Verge, TechCrunch" */
function Meta({ story, now, others = 3 }: { story: Story; now: string; others?: number }) {
  // One link per outlet: a lab that posted three times is still one source.
  const leadName = sourceName(story.lead);
  const rest = story.items.filter(
    (i, n, all) => sourceName(i) !== leadName && all.findIndex((o) => sourceName(o) === sourceName(i)) === n,
  );
  return (
    <p className="meta mt-2.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
      <a href={story.lead.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-accent">
        {SOURCE_NAMES[story.lead.sourceId] ?? story.lead.sourceId}
      </a>
      <span aria-hidden>·</span>
      <time dateTime={story.firstSeen}>{fmtWhen(story.firstSeen, now)}</time>
      {story.lead.discussionUrl && story.lead.discussionUrl !== story.lead.url && (
        <>
          <span aria-hidden>·</span>
          <a href={story.lead.discussionUrl} target="_blank" rel="noreferrer" className="link">
            {story.lead.score ? `${story.lead.score} points on HN` : "HN discussion"}
          </a>
        </>
      )}
      {others > 0 && rest.length > 0 && (
        <>
          <span aria-hidden>·</span>
          <span>
            also{" "}
            {rest.slice(0, others).map((i, n) => (
              <span key={i.id}>
                {n > 0 && ", "}
                <a href={i.url} target="_blank" rel="noreferrer" className="link" title={i.title}>
                  {sourceName(i)}
                </a>
              </span>
            ))}
            {rest.length > others && ` +${rest.length - others}`}
          </span>
        </>
      )}
    </p>
  );
}

export function LeadStory({ story, now }: { story: Story; now: string }) {
  const { brief } = story;
  const coverage = story.items.filter((i) => i !== story.lead);
  return (
    <article>
      {story.image && (
        <StoryLink story={story} className="mb-5 block">
          <Thumb src={story.image} ratio="2/1" />
        </StoryLink>
      )}
      <Kicker story={story} />
      <h2 className="mt-2">
        <Headline story={story} className="text-[2.1rem] leading-[1.08] text-balance sm:text-[3.1rem] sm:leading-[1.04]" />
      </h2>
      {storySummary(story) && <p className="dek mt-4 text-xl leading-relaxed sm:text-[1.35rem]">{storySummary(story)}</p>}
      <Meta story={story} now={now} others={brief ? 3 : 0} />

      {brief ? (
        <>
          <ul className="mt-6 space-y-3 border-t border-rule pt-5">
            {brief.keyPoints.slice(0, 4).map((point) => (
              <li key={point} className="relative pl-5 text-[1.06rem] leading-relaxed">
                <span aria-hidden className="absolute left-0 top-[0.62em] h-2 w-2 bg-accent" />
                {point}
              </li>
            ))}
          </ul>
          <Link
            href={`/story/${story.id}`}
            className="mt-6 inline-flex items-center gap-2 bg-ink px-4 py-2.5 font-sans text-sm font-semibold text-paper hover:bg-accent"
          >
            Read the full briefing <span aria-hidden>→</span>
          </Link>
        </>
      ) : (
        <>
          {story.lead.whyItMatters && (
            <div className="mt-5 border-l-4 border-accent bg-accent-soft/60 px-4 py-3">
              <p className="kicker text-accent">Why it matters</p>
              <p className="mt-1 text-[1.05rem] leading-relaxed">{story.lead.whyItMatters}</p>
            </div>
          )}
          {coverage.length > 0 && (
            <ul className="mt-5 divide-y divide-rule border-t border-rule">
              {coverage.slice(0, 4).map((i) => (
                <li key={i.id} className="py-2 text-[0.95rem] leading-snug">
                  <a href={i.url} target="_blank" rel="noreferrer" className="group">
                    <span className="font-sans text-[0.8rem] font-semibold">{sourceName(i)}</span>
                    <span className="text-muted"> — </span>
                    <span className="group-hover:underline">{i.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </article>
  );
}

/** Card with the image on top: the 2×2 grid under the lead. */
export function CardStory({ story, now }: { story: Story; now: string }) {
  return (
    <article>
      {story.image && (
        <StoryLink story={story} className="mb-3.5 block">
          <Thumb src={story.image} ratio="3/2" />
        </StoryLink>
      )}
      <Kicker story={story} />
      <h3 className="mt-1.5">
        <Headline story={story} className="text-[1.4rem] leading-[1.17]" />
      </h3>
      {storySummary(story) && <p className="mt-2 text-[1.02rem] leading-relaxed text-ink-soft">{storySummary(story)}</p>}
      <Meta story={story} now={now} others={2} />
    </article>
  );
}

/** Text left, small picture right: the "More top stories" list. */
export function RowStory({ story, now }: { story: Story; now: string }) {
  return (
    <article className="flex gap-4 sm:gap-6">
      <div className="min-w-0 flex-1">
        <Kicker story={story} />
        <h3 className="mt-1">
          <Headline story={story} className="text-[1.22rem] leading-snug" />
        </h3>
        {storySummary(story) && (
          <p className="mt-1.5 text-[1rem] leading-relaxed text-ink-soft">{storySummary(story)}</p>
        )}
        <Meta story={story} now={now} others={2} />
      </div>
      {story.image && (
        <StoryLink story={story} className="block w-24 shrink-0 pt-1 sm:w-44">
          <Thumb src={story.image} ratio="4/3" />
        </StoryLink>
      )}
    </article>
  );
}

export function CompactStory({
  story,
  now,
  showCategory = true,
  withImage = false,
}: {
  story: Story;
  now: string;
  showCategory?: boolean;
  withImage?: boolean;
}) {
  return (
    <article>
      {withImage && story.image && (
        <StoryLink story={story} className="mb-3 block">
          <Thumb src={story.image} ratio="16/9" />
        </StoryLink>
      )}
      <Kicker story={story} showCategory={showCategory} />
      <h3 className="mt-1">
        <Headline story={story} className="text-[1.15rem] leading-snug" />
      </h3>
      <Meta story={story} now={now} others={1} />
    </article>
  );
}

export function WireItem({ story, now }: { story: Story; now: string }) {
  return (
    <li className="grid grid-cols-[4.6rem_1fr] gap-x-2 py-3">
      <time dateTime={story.firstSeen} className="meta whitespace-nowrap pt-0.5 tabular-nums">
        {fmtWhen(story.firstSeen, now)}
      </time>
      <div>
        <Headline story={story} className="text-[1.02rem] leading-snug" />
        <p className="meta mt-0.5">{SOURCE_NAMES[story.lead.sourceId] ?? story.lead.sourceId}</p>
      </div>
    </li>
  );
}

export function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between border-t-[3px] border-ink pt-2">
      <h2 className="font-sans text-[0.8rem] font-bold uppercase tracking-[0.14em]">{title}</h2>
      {href && (
        <Link href={href} className="meta link">
          See all →
        </Link>
      )}
    </div>
  );
}
