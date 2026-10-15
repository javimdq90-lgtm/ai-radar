import Link from "next/link";
import { fmtDateTime, hostname } from "@/lib/format";
import { SOURCE_NAMES } from "@/lib/sources";
import { CATEGORY_LABELS, type Story } from "@/lib/types";

function Importance({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Importance ${value} of 5`} title={`Importance ${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`h-2 w-2 rounded-full ${n <= value ? "bg-accent" : "bg-rule"}`} />
      ))}
    </span>
  );
}

export function StoryCard({ story, compact = false }: { story: Story; compact?: boolean }) {
  const { lead } = story;
  const others = story.items.filter((i) => i !== lead);
  return (
    <article className={compact ? "py-4" : "py-6"}>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <Link href={`/topic/${story.category}`} className="font-semibold uppercase tracking-wider hover:text-fg">
          {CATEGORY_LABELS[story.category]}
        </Link>
        <Importance value={story.importance} />
        <time dateTime={story.firstSeen}>{fmtDateTime(story.firstSeen)}</time>
        {story.sourceCount > 1 && <span>{story.sourceCount} sources</span>}
      </div>
      <h3 className={`font-serif font-bold leading-snug ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>
        <a href={lead.url} target="_blank" rel="noreferrer" className="hover:text-accent">
          {lead.title}
        </a>
      </h3>
      {lead.summary && <p className="mt-2 font-serif text-[1.05rem] leading-relaxed">{lead.summary}</p>}
      {!compact && lead.whyItMatters && (
        <p className="mt-2 border-l-2 border-accent pl-3 text-sm leading-relaxed text-muted">{lead.whyItMatters}</p>
      )}
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
        <span>{SOURCE_NAMES[lead.sourceId] ?? lead.sourceId}</span>
        {lead.discussionUrl && lead.discussionUrl !== lead.url && (
          <a href={lead.discussionUrl} target="_blank" rel="noreferrer" className="hover:text-accent">
            HN discussion{lead.score ? ` (${lead.score})` : ""}
          </a>
        )}
        {others.slice(0, 4).map((i) => (
          <a key={i.id} href={i.url} target="_blank" rel="noreferrer" className="hover:text-accent" title={i.title}>
            + {i.sourceId === "hn" ? hostname(i.url) : (SOURCE_NAMES[i.sourceId] ?? i.sourceId)}
          </a>
        ))}
      </p>
    </article>
  );
}
