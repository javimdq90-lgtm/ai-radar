import Link from "next/link";
import type { ReactNode } from "react";
import { StoryArt } from "@/components/story-art";
import { StoryImage } from "@/components/story-image";
import { TimeAgo } from "@/components/time-ago";
import { catStyle } from "@/lib/category";
import { fmtShort, fmtWhen } from "@/lib/format";
import { sourceName } from "@/lib/sources";
import { type Brief, CATEGORY_LABELS, type Story } from "@/lib/types";

export { sourceName };

/** Briefed stories have their own page; the rest link straight to the original article. */
export const storyTitle = (s: Story) => s.brief?.headline ?? s.lead.title;
export const storySummary = (s: Story) => s.brief?.dek ?? s.lead.summary;

/** One entry per outlet, lead first: a lab that posted three times is still one source. */
export const outlets = (s: Story) => {
  const seen = new Set<string>();
  return [s.lead, ...s.items].filter((i) => {
    const name = sourceName(i);
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
};

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

/** The story's own image when it has one, the generated art when it doesn't or the image fails. */
export function StoryVisual({
  story,
  ratio = "16/9",
  fill = false,
  label = true,
  cols,
  priority = false,
}: {
  story: Story;
  ratio?: string;
  fill?: boolean;
  label?: boolean;
  cols?: number;
  priority?: boolean;
}) {
  const art = <StoryArt story={story} ratio={ratio} fill={fill} label={label} cols={cols} />;
  return <StoryImage src={story.image} fallback={art} ratio={ratio} fill={fill} priority={priority} />;
}

const HOUR = 3_600_000;
const WORDS_PER_MINUTE = 230;

export const readMinutes = (brief: Brief) => {
  const text = [brief.dek, ...brief.keyPoints, brief.context, brief.whatsNext ?? ""].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).length / WORDS_PER_MINUTE));
};

/** Still growing: three or more sources, the newest from the last 12 hours (one ingest cycle). */
export const isDeveloping = (story: Story, now: string) => {
  const newest = Math.max(...story.items.map((i) => new Date(i.publishedAt).getTime()));
  return story.sourceCount >= 3 && new Date(now).getTime() - newest < 12 * HOUR;
};

/**
 * "MODELS / Briefing [6 sources] • Developing". Briefings get the label and the chip; link-outs
 * get the category only. Sits above stretched links (the hero), so it stays clickable.
 */
export function Kicker({
  story,
  now,
  dot = false,
  chip = true,
}: {
  story: Story;
  now?: string;
  dot?: boolean;
  chip?: boolean;
}) {
  return (
    <p style={catStyle(story.category)} className="label relative z-10 m-0 flex flex-wrap items-center gap-2.5">
      <Link href={`/topic/${story.category}`} className="flex items-center gap-[7px] text-cat hover:text-cat hover:underline">
        {dot && <span className="dot" aria-hidden />}
        {CATEGORY_LABELS[story.category]}
      </Link>
      {story.brief && (
        <>
          <span className="text-sep" aria-hidden>
            /
          </span>
          <span>Briefing</span>
          {chip && story.sourceCount > 1 && (
            <span className="rounded-[4px] border border-line-strong px-2 py-[3px] text-muted">
              {story.sourceCount} sources
            </span>
          )}
        </>
      )}
      {now && isDeveloping(story, now) && (
        <span className="flex items-center gap-1.5 rounded-full bg-accent px-2 py-[3px] text-on-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-on-accent motion-safe:animate-pulse" aria-hidden />
          Developing
        </span>
      )}
    </p>
  );
}

/**
 * Briefings: "The Verge, TechCrunch +4 · 2 hours ago · 3 min read" (the sources are on the briefing page).
 * Link-outs: "The Verge ↗ · 2 hours ago · also TechCrunch", each outlet linking to its article.
 */
export function StoryMeta({ story, now, className = "text-[13px]" }: { story: Story; now: string; className?: string }) {
  const all = outlets(story);
  const time = <TimeAgo iso={story.firstSeen} fallback={fmtWhen(story.firstSeen, now)} />;
  const sep = <span aria-hidden>·</span>;

  if (story.brief) {
    const names = all.slice(0, 2).map(sourceName).join(", ");
    return (
      <p className={`relative z-10 m-0 flex flex-wrap gap-x-2 gap-y-1 text-muted ${className}`}>
        <span>
          {names}
          {all.length > 2 && ` +${all.length - 2}`}
        </span>
        {sep}
        {time}
        {sep}
        <span>{readMinutes(story.brief)} min read</span>
      </p>
    );
  }

  const [lead, ...rest] = all;
  return (
    <p className={`relative z-10 m-0 flex flex-wrap gap-x-2 gap-y-1 text-muted ${className}`}>
      <a href={lead.url} target="_blank" rel="noreferrer" className="text-text hover:underline">
        {sourceName(lead)} <span aria-label="(opens the original article)">↗</span>
      </a>
      {sep}
      {time}
      {story.lead.discussionUrl && story.lead.discussionUrl !== story.lead.url && (
        <>
          {sep}
          <a href={story.lead.discussionUrl} target="_blank" rel="noreferrer" className="link">
            {story.lead.score ? `${story.lead.score} points on HN` : "HN discussion"}
          </a>
        </>
      )}
      {rest.length > 0 && (
        <>
          {sep}
          <span>
            also{" "}
            {rest.slice(0, 2).map((i, n) => (
              <span key={i.id}>
                {n > 0 && ", "}
                <a href={i.url} target="_blank" rel="noreferrer" className="link" title={i.title}>
                  {sourceName(i)}
                </a>
              </span>
            ))}
            {rest.length > 2 && ` +${rest.length - 2}`}
          </span>
        </>
      )}
    </p>
  );
}

/** The top story: headline and dek over full-bleed art; the whole block is one link. */
export function LeadStory({ story, now }: { story: Story; now: string }) {
  const summary = storySummary(story);
  return (
    <article
      style={catStyle(story.category)}
      className="group relative isolate overflow-hidden rounded-cw-lg border border-tint-line"
    >
      <StoryVisual story={story} fill label={false} cols={24} priority />
      {/* Scrim: solid behind the text, fading out over the top of the image so bright photos stay readable. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,var(--cw-bg)_0%,var(--cw-bg)_35%,color-mix(in_oklab,var(--cw-bg)_80%,transparent)_62%,color-mix(in_oklab,var(--cw-bg)_15%,transparent)_100%)]"
      />
      <div className="relative flex min-h-[clamp(460px,52vw,620px)] flex-col justify-end gap-4 p-[clamp(20px,4vw,40px)] pt-[clamp(150px,30vw,220px)]">
        <Kicker story={story} now={now} />
        <h2 className="m-0 max-w-[20ch] text-[clamp(36px,5.5vw,60px)] leading-[1.02] tracking-[-0.5px]">
          {/* Stretched link: the pseudo-element covers the whole hero. */}
          <StoryLink story={story} className="headline after:absolute after:inset-0">
            {storyTitle(story)}
          </StoryLink>
        </h2>
        {summary && <p className="m-0 max-w-[62ch] text-[clamp(17px,1.6vw,19px)] leading-[1.6] text-dek">{summary}</p>}
        <StoryMeta story={story} now={now} className="text-sm" />
      </div>
    </article>
  );
}

const CARD = {
  large: { headline: "text-[clamp(30px,3.4vw,40px)] leading-[1.05]", summary: "text-[17px]" },
  medium: { headline: "text-[clamp(24px,2.4vw,28px)] leading-[1.1]", summary: "text-[15px]" },
  small: { headline: "text-[21px] leading-[1.15]", summary: null },
} as const;

/** Image-on-top card in three sizes: the feature slot, the row of three, and the stacked pair. */
export function StoryCard({ story, now, size = "medium" }: { story: Story; now: string; size?: keyof typeof CARD }) {
  const summary = storySummary(story);
  const style = CARD[size];
  return (
    <article className="flex min-w-0 flex-col gap-3">
      <StoryLink story={story} className="group block">
        <StoryVisual story={story} label={size !== "small"} />
      </StoryLink>
      <Kicker story={story} now={now} chip={size !== "small"} />
      <h3 className={`m-0 ${style.headline}`}>
        <StoryLink story={story} className="headline">
          {storyTitle(story)}
        </StoryLink>
      </h3>
      {summary && style.summary && <p className={`m-0 text-dek ${style.summary}`}>{summary}</p>}
      <StoryMeta story={story} now={now} />
    </article>
  );
}

/** Compact row with a square thumbnail, for the bottom of the top-stories block. */
export function ThumbRow({ story, now }: { story: Story; now: string }) {
  return (
    <article className="grid grid-cols-[clamp(72px,18%,104px)_1fr] gap-4 border-b border-line py-5">
      <StoryLink story={story} className="group block self-start">
        <StoryVisual story={story} ratio="1/1" label={false} cols={8} />
      </StoryLink>
      <div className="flex min-w-0 flex-col gap-1.5">
        <Kicker story={story} now={now} chip={false} />
        <h3 className="m-0 text-[20px] leading-[1.15]">
          <StoryLink story={story} className="headline">
            {storyTitle(story)}
          </StoryLink>
        </h3>
        <StoryMeta story={story} now={now} />
      </div>
    </article>
  );
}

/** Text-only row for section blocks and topic pages. */
export function StoryRow({ story, now, kicker = true }: { story: Story; now: string; kicker?: boolean }) {
  const summary = storySummary(story);
  return (
    <article className="flex flex-col gap-2 border-b border-line py-5">
      {kicker && <Kicker story={story} now={now} dot />}
      <h3 className="m-0 text-[24px] leading-[1.15]">
        <StoryLink story={story} className="headline">
          {storyTitle(story)}
        </StoryLink>
      </h3>
      {summary && <p className="m-0 max-w-[70ch] text-[15px] text-dek">{summary}</p>}
      <StoryMeta story={story} now={now} />
    </article>
  );
}

/** "LATEST" rail row: time | serif title, category dot and source. */
export function LatestItem({ story, now }: { story: Story; now: string }) {
  return (
    <li>
      <StoryLink
        story={story}
        className="group grid grid-cols-[52px_1fr] gap-3 border-b border-line py-3.5"
      >
        <time dateTime={story.firstSeen} className="pt-[3px] text-[13px] tabular-nums text-faint">
          {fmtShort(story.firstSeen, now)}
        </time>
        <span className="flex flex-col gap-1">
          <span className="font-display text-[21px] leading-[1.15] group-hover:underline">{storyTitle(story)}</span>
          <span style={catStyle(story.category)} className="flex items-center gap-[7px] text-[13px] text-muted">
            <span className="dot !h-1.5 !w-1.5" aria-hidden />
            {sourceName(story.lead)}
            {story.brief && <span className="text-faint">· Briefing</span>}
          </span>
        </span>
      </StoryLink>
    </li>
  );
}

/** Related rail row on briefing pages: title, then source and time. */
export function RelatedItem({ story, now }: { story: Story; now: string }) {
  return (
    <li>
      <StoryLink story={story} className="group flex flex-col gap-1 border-b border-line py-3.5">
        <span className="font-display text-[21px] leading-[1.15] group-hover:underline">{storyTitle(story)}</span>
        <span className="text-[13px] text-muted">
          {sourceName(story.lead)} · {fmtWhen(story.firstSeen, now)}
        </span>
      </StoryLink>
    </li>
  );
}
