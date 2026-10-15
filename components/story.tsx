import Link from "next/link";
import { fmtWhen, hostname } from "@/lib/format";
import { SOURCE_NAMES } from "@/lib/sources";
import { CATEGORY_LABELS, type Item, type Story } from "@/lib/types";

const sourceName = (i: Item) => (i.sourceId === "hn" ? hostname(i.url) : (SOURCE_NAMES[i.sourceId] ?? i.sourceId));

function Kicker({ story, showCategory = true }: { story: Story; showCategory?: boolean }) {
  if (!showCategory && story.sourceCount < 3) return null;
  return (
    <p className="kicker flex items-center gap-2">
      {showCategory && (
        <Link href={`/topic/${story.category}`} className="text-accent hover:underline">
          {CATEGORY_LABELS[story.category]}
        </Link>
      )}
      {story.sourceCount >= 3 && (
        <span className="rounded-sm bg-accent-soft px-1.5 py-0.5 text-[0.68rem] text-accent">
          {story.sourceCount} sources
        </span>
      )}
    </p>
  );
}

function Headline({ story, className }: { story: Story; className: string }) {
  return (
    <a href={story.lead.url} target="_blank" rel="noreferrer" className={`headline block ${className}`}>
      {story.lead.title}
    </a>
  );
}

/** "OpenAI · 14:05 · also The Verge, TechCrunch" */
function Meta({ story, now, others = 3 }: { story: Story; now: string; others?: number }) {
  const rest = story.items.filter((i) => i !== story.lead);
  return (
    <p className="meta mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
      <span className="font-semibold text-ink">{SOURCE_NAMES[story.lead.sourceId] ?? story.lead.sourceId}</span>
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
  const coverage = story.items.filter((i) => i !== story.lead);
  return (
    <article>
      <Kicker story={story} />
      <h2 className="mt-2">
        <Headline story={story} className="text-[2.1rem] leading-[1.08] text-balance sm:text-5xl sm:leading-[1.05]" />
      </h2>
      {story.lead.summary && <p className="dek mt-4 text-xl leading-relaxed sm:text-[1.4rem]">{story.lead.summary}</p>}
      <Meta story={story} now={now} others={0} />
      {story.lead.whyItMatters && (
        <div className="mt-5 border-l-4 border-accent bg-accent-soft/60 px-4 py-3">
          <p className="kicker text-accent">Why it matters</p>
          <p className="mt-1 text-[1.05rem] leading-relaxed">{story.lead.whyItMatters}</p>
        </div>
      )}
      {coverage.length > 0 && (
        <div className="mt-5">
          <p className="kicker text-muted">More coverage</p>
          <ul className="mt-2 divide-y divide-rule border-t border-rule">
            {coverage.slice(0, 6).map((i) => (
              <li key={i.id} className="py-2 text-[0.95rem] leading-snug">
                <a href={i.url} target="_blank" rel="noreferrer" className="group">
                  <span className="font-sans text-[0.8rem] font-semibold text-ink">{sourceName(i)}</span>
                  <span className="text-muted"> — </span>
                  <span className="group-hover:underline">{i.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function MediumStory({ story, now }: { story: Story; now: string }) {
  return (
    <article>
      <Kicker story={story} />
      <h3 className="mt-1.5">
        <Headline story={story} className="text-[1.45rem] leading-[1.15]" />
      </h3>
      {story.lead.summary && <p className="mt-2 text-[1.04rem] leading-relaxed text-ink-soft">{story.lead.summary}</p>}
      <Meta story={story} now={now} others={2} />
    </article>
  );
}

export function CompactStory({
  story,
  now,
  withSummary = false,
  showCategory = true,
}: {
  story: Story;
  now: string;
  withSummary?: boolean;
  showCategory?: boolean;
}) {
  return (
    <article>
      <Kicker story={story} showCategory={showCategory} />
      <h3 className="mt-1">
        <Headline story={story} className="text-[1.18rem] leading-snug" />
      </h3>
      {withSummary && story.lead.summary && (
        <p className="mt-1.5 text-[1rem] leading-relaxed text-ink-soft">{story.lead.summary}</p>
      )}
      <Meta story={story} now={now} others={withSummary ? 3 : 1} />
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
        <a href={story.lead.url} target="_blank" rel="noreferrer" className="headline text-[1.02rem] leading-snug">
          {story.lead.title}
        </a>
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
