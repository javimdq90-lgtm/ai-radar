import Link from "next/link";
import type { ReactNode } from "react";
import { Scene, sceneFor } from "@/components/scene";
import { StoryImage } from "@/components/story-image";
import { TimeAgo } from "@/components/time-ago";
import { BRAND, fallbackImageFor } from "@/lib/brand-images";
import { catColor } from "@/lib/category";
import { fmtDateTime, fmtShort, fmtWhen } from "@/lib/format";
import { AUTHOR } from "@/lib/site";
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

/** Briefings link to their page; the rest open the original article in a new tab. */
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

/**
 * The story's own image when it has one; otherwise (or if it fails to load) a brand photo from
 * public/brand, or a generated scene when there are none.
 */
export function StoryVisual({
  story,
  ratio = "16/9",
  fill = false,
  priority = false,
}: {
  story: Story;
  ratio?: string;
  fill?: boolean;
  priority?: boolean;
}) {
  const brand = fallbackImageFor(story.id);
  // Brand images and scenes have no "own shape", so "auto" gives them a wide frame.
  const frame = ratio === "auto" ? "16/9" : ratio;
  const scene = (
    <div style={fill ? undefined : { aspectRatio: frame }} className={fill ? "absolute inset-0" : "relative overflow-hidden"}>
      {brand ? (
        // eslint-disable-next-line @next/next/no-img-element -- local brand photo, already in the house style
        <img src={brand} alt="" loading="lazy" className="h-full w-full object-cover ease-out motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]" />
      ) : (
        <Scene name={sceneFor(story.id)} />
      )}
    </div>
  );
  return <StoryImage src={story.image} fallback={scene} ratio={ratio} fill={fill} priority={priority} />;
}

const HOUR = 3_600_000;
const WORDS_PER_MINUTE = 230;

export const readMinutes = (brief: Brief) => {
  const a = brief.article;
  const body = a ? [...a.whatHappened, ...a.whyItMatters, ...a.whatToWatch] : [brief.context, brief.whatsNext ?? ""];
  const text = [brief.dek, ...brief.keyPoints, ...body].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).length / WORDS_PER_MINUTE));
};

/** Still growing: three or more sources, the newest from the last 12 hours (one ingest cycle). */
export const isDeveloping = (story: Story, now: string) => {
  const newest = Math.max(...story.items.map((i) => new Date(i.publishedAt).getTime()));
  return story.sourceCount >= 3 && new Date(now).getTime() - newest < 12 * HOUR;
};

/** Our own briefings are labelled; plain news isn't (almost everything is news, and ↗ marks link-outs). */
function BriefingLabel() {
  return <span className="text-signal">Briefing</span>;
}

/** The topic in its colour, with a small square. */
export function TopicLabel({ story }: { story: Story }) {
  return (
    <span className="flex items-center gap-1.5" style={{ color: catColor(story.category) }}>
      <span className="h-1.5 w-1.5 bg-current" aria-hidden />
      {CATEGORY_LABELS[story.category]}
    </span>
  );
}

/** "BRIEFING  ■ MODELS  [6 SOURCES]  ■ DEVELOPING", or just the topic for plain news. */
export function Kicker({ story, now, chip = true }: { story: Story; now?: string; chip?: boolean }) {
  return (
    <span className="kicker flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {story.brief && <BriefingLabel />}
      <TopicLabel story={story} />
      {chip && story.brief && story.sourceCount > 1 && (
        <span className="border border-rule-strong px-2 py-1 text-muted">{story.sourceCount} sources</span>
      )}
      {now && isDeveloping(story, now) && (
        <span className="flex items-center gap-1.5 text-signal">
          <span className="h-1.5 w-1.5 bg-orange motion-safe:animate-pulse" aria-hidden />
          Developing
        </span>
      )}
    </span>
  );
}

/** "The Verge, TechCrunch +4 · 2 hours ago" (plain text: the whole card is the link). */
export function Meta({ story, now, readTime = false }: { story: Story; now: string; readTime?: boolean }) {
  const all = outlets(story);
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
      <span>
        {all.slice(0, 2).map(sourceName).join(", ")}
        {all.length > 2 && ` +${all.length - 2}`}
        {!story.brief && " ↗"}
      </span>
      <span aria-hidden>·</span>
      <TimeAgo iso={story.firstSeen} fallback={fmtWhen(story.firstSeen, now)} />
      {readTime && story.brief && (
        <>
          <span aria-hidden>·</span>
          <span>{readMinutes(story.brief)} min read</span>
        </>
      )}
    </span>
  );
}

/** "By Javier Díaz · Thu 15 Oct, 02:00 · 3 min read", with an initials avatar. */
export function Byline({ story, children }: { story: Story; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3.5">
      {BRAND.author ? (
        // eslint-disable-next-line @next/next/no-img-element -- one small local photo
        <img src={BRAND.author} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fg text-[13px] font-semibold text-surface"
          aria-hidden
        >
          {AUTHOR.initials}
        </span>
      )}
      <span className="flex flex-col text-[13px]">
        <span className="font-medium">By {AUTHOR.name}</span>
        <span className="text-muted">
          {fmtDateTime(story.firstSeen)}
          {story.brief && <> · {readMinutes(story.brief)} min read</>}
          {children}
        </span>
      </span>
    </div>
  );
}

/**
 * The front page's top story: our own briefing presented as an article. Image, kicker,
 * headline, summary, byline, the first key points and a way in.
 */
export function TopStory({ story, now }: { story: Story; now: string }) {
  const summary = storySummary(story);
  const points = story.brief?.keyPoints.slice(0, 3) ?? [];
  return (
    <article className="flex flex-col gap-10">
      {/* Image and the essentials side by side, centred on each other so neither leaves a gap. */}
      <div className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <StoryLink story={story} className="group block">
          <StoryVisual story={story} ratio="auto" priority />
        </StoryLink>
        <div className="flex flex-col gap-5">
          <Kicker story={story} now={now} />
          <h3 className="m-0 text-[clamp(30px,3.4vw,46px)] font-semibold leading-[1.08] tracking-[-0.02em] text-pretty">
            <StoryLink story={story} className="hover:text-signal">
              {storyTitle(story)}
            </StoryLink>
          </h3>
          {summary && <p className="m-0 text-[18px] leading-[1.6] text-dek">{summary}</p>}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <Byline story={story} />
            <StoryLink story={story} className="btn-cta">
              {story.brief ? "Read the briefing →" : "Read the story ↗"}
            </StoryLink>
          </div>
        </div>
      </div>

      {/* The key points across the full width, one column each. */}
      {points.length > 0 && (
        <ul className="m-0 grid list-none gap-x-10 gap-y-5 border-t border-rule p-0 pt-6 text-[15px] leading-[1.55] text-body md:grid-cols-3">
          {points.map((point) => (
            <li key={point} className="flex flex-col gap-3">
              <span className="h-1.5 w-6 bg-orange" aria-hidden />
              {point}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/** Today's briefing: 16:9 visual (3fr) beside the text (2fr), Inter 46px headline. One link. */
export function LeadStory({ story, now }: { story: Story; now: string }) {
  const summary = storySummary(story);
  return (
    <StoryLink story={story} className="group flex flex-wrap gap-10 hover:text-fg">
      <div className="flex-[3_1_480px] self-start border border-rule">
        <StoryVisual story={story} priority />
      </div>
      <div className="flex flex-[2_1_360px] flex-col justify-center gap-[18px]">
        <Kicker story={story} now={now} />
        <h3 className="m-0 text-[clamp(30px,3.6vw,46px)] font-semibold leading-[1.08] tracking-[-0.02em] text-pretty group-hover:text-signal">
          {storyTitle(story)}
        </h3>
        {summary && <p className="m-0 text-[18px] leading-[1.6] text-dek">{summary}</p>}
        <Meta story={story} now={now} readTime />
      </div>
    </StoryLink>
  );
}

/** Hero card: square visual beside the format kicker, headline and age, on dark glass. One link. */
export function HeroCard({ story, now }: { story: Story; now: string }) {
  return (
    <StoryLink
      story={story}
      className="group grid grid-cols-[clamp(88px,8vw,120px)_1fr] gap-4 border border-white/10 bg-black/70 p-3 backdrop-blur-md hover:text-fg"
    >
      <StoryVisual story={story} ratio="1/1" />
      <span className="flex min-w-0 flex-col gap-2 py-1">
        <Kicker story={story} chip={false} />
        <span className="line-clamp-3 text-[clamp(16px,1.4vw,20px)] font-medium leading-[1.25] group-hover:text-signal">
          {storyTitle(story)}
        </span>
        <span className="mt-auto text-[12px] text-muted">
          <TimeAgo iso={story.firstSeen} fallback={fmtWhen(story.firstSeen, now)} />
        </span>
      </span>
    </StoryLink>
  );
}

/** Hairline-grid card: 4:3 visual, kicker, 22px headline, meta pinned to the bottom. One link. */
export function StoryCard({ story, now }: { story: Story; now: string }) {
  return (
    <StoryLink
      story={story}
      className="group flex flex-col gap-3.5 bg-surface p-5 shadow-[0_0_0_1px_var(--rule)] hover:text-fg"
    >
      <StoryVisual story={story} ratio="4/3" />
      <Kicker story={story} now={now} chip={false} />
      <h3 className="m-0 text-[22px] font-semibold leading-[1.25] group-hover:text-signal">{storyTitle(story)}</h3>
      <span className="mt-auto">
        <Meta story={story} now={now} />
      </span>
    </StoryLink>
  );
}

/** LATEST feed row: time | title, kicker and source. Only briefing kickers are orange. */
export function LatestRow({ story, now }: { story: Story; now: string }) {
  return (
    <li>
      <StoryLink
        story={story}
        className="group grid grid-cols-[64px_1fr] items-baseline gap-4 border-b border-rule py-4 hover:text-fg"
      >
        <time dateTime={story.firstSeen} className="text-[13px] tabular-nums text-muted">
          {fmtShort(story.firstSeen, now)}
        </time>
        <span className="flex flex-col gap-1.5">
          <span className="text-[18px] font-medium leading-[1.35] group-hover:text-signal">{storyTitle(story)}</span>
          <span className="flex flex-wrap items-center gap-3 text-[13px] text-muted">
            {story.brief && <span className="kicker text-signal">Briefing</span>}
            {story.brief ? `${story.sourceCount} sources` : sourceName(story.lead)}
          </span>
        </span>
      </StoryLink>
    </li>
  );
}

/** Row with a small visual, for section pages and the briefings list. */
export function StoryRow({ story, now }: { story: Story; now: string }) {
  const summary = storySummary(story);
  return (
    <StoryLink
      story={story}
      className="group grid grid-cols-[1fr_clamp(88px,22%,160px)] gap-x-6 border-b border-rule py-6 hover:text-fg"
    >
      <span className="flex min-w-0 flex-col gap-2.5">
        <Kicker story={story} now={now} />
        <span className="text-[clamp(19px,2vw,24px)] font-semibold leading-[1.2] group-hover:text-signal">
          {storyTitle(story)}
        </span>
        {summary && <span className="line-clamp-3 text-[15px] leading-[1.55] text-dek max-sm:hidden">{summary}</span>}
        <Meta story={story} now={now} />
      </span>
      <StoryVisual story={story} ratio="4/3" />
    </StoryLink>
  );
}

/** "MORE CONTEXT" rail row on briefing pages. */
export function RelatedItem({ story, now }: { story: Story; now: string }) {
  return (
    <li>
      <StoryLink story={story} className="group flex flex-col gap-1.5 border-b border-rule py-4 hover:text-fg">
        <Kicker story={story} chip={false} />
        <span className="text-[18px] font-semibold leading-[1.3] group-hover:text-signal">{storyTitle(story)}</span>
        <span className="text-[13px] text-muted">
          {sourceName(story.lead)} · {fmtWhen(story.firstSeen, now)}
        </span>
      </StoryLink>
    </li>
  );
}
