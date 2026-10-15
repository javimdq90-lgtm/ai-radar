import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompactStory, SectionHeading, sourceName, storyTitle } from "@/components/story";
import { Thumb } from "@/components/thumb";
import { fmtLongDate, fmtTime, fmtWhen } from "@/lib/format";
import { getBriefedStoryIds, getStory } from "@/lib/site-data";
import { CATEGORY_LABELS } from "@/lib/types";

export async function generateStaticParams() {
  const ids = await getBriefedStoryIds();
  // An empty list would make every story render on demand; keep one entry so the route prerenders.
  return ids.length ? ids.map((id) => ({ id })) : [{ id: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/story/[id]">): Promise<Metadata> {
  const data = await getStory((await params).id);
  if (!data) return { title: "Not found" };
  return { title: storyTitle(data.story), description: data.story.brief?.dek ?? data.story.lead.summary };
}

export default async function StoryPage({ params }: PageProps<"/story/[id]">) {
  const data = await getStory((await params).id);
  if (!data) notFound();
  const { story, related, generatedAt: now } = data;
  const { brief } = story;
  const coverage = [...story.items].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

  return (
    <div className="pt-8">
      <article className="mx-auto max-w-[44rem]">
        <p className="kicker flex flex-wrap items-center gap-2">
          <Link href={`/topic/${story.category}`} className="text-accent hover:underline">
            {CATEGORY_LABELS[story.category]}
          </Link>
          <span className="text-muted">·</span>
          <span className="text-muted">{story.sourceCount} sources</span>
        </p>
        <h1 className="mt-3 font-serif text-[2.2rem] font-bold leading-[1.08] tracking-[-0.015em] text-balance sm:text-[3.2rem] sm:leading-[1.04]">
          {storyTitle(story)}
        </h1>
        {(brief?.dek ?? story.lead.summary) && (
          <p className="dek mt-5 text-xl leading-relaxed sm:text-[1.4rem]">{brief?.dek ?? story.lead.summary}</p>
        )}
        <p className="meta mt-5 border-y border-rule py-3">
          First reported {fmtLongDate(story.firstSeen)}, {fmtTime(story.firstSeen)}
          {brief && <> · Briefing updated {fmtWhen(brief.writtenAt, now)}</>}
        </p>
      </article>

      {story.image && (
        <figure className="mx-auto mt-8 max-w-[56rem]">
          <Thumb src={story.image} ratio="16/9" />
          <figcaption className="meta mt-2">Image: {sourceName(story.items.find((i) => i.image) ?? story.lead)}</figcaption>
        </figure>
      )}

      <div className="mx-auto mt-10 max-w-[44rem]">
        {brief && (
          <>
            <section>
              <h2 className="kicker text-accent">The key points</h2>
              <ul className="mt-4 space-y-4">
                {brief.keyPoints.map((point) => (
                  <li key={point} className="relative pl-6 text-[1.15rem] leading-[1.65]">
                    <span aria-hidden className="absolute left-0 top-[0.68em] h-2 w-2 bg-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="kicker text-accent">The bigger picture</h2>
              <p className="mt-3 text-[1.15rem] leading-[1.7]">{brief.context}</p>
            </section>

            {brief.whatsNext && (
              <section className="mt-8 border-l-4 border-accent bg-accent-soft/60 px-5 py-4">
                <h2 className="kicker text-accent">What to watch</h2>
                <p className="mt-1.5 text-[1.1rem] leading-relaxed">{brief.whatsNext}</p>
              </section>
            )}
          </>
        )}

        <section className="mt-12">
          <SectionHeading title={`Coverage · ${coverage.length}`} />
          <ol className="divide-y divide-rule">
            {coverage.map((item) => (
              <li key={item.id} className="py-4">
                <p className="meta">
                  <span className="font-semibold text-ink">{sourceName(item)}</span> · {fmtWhen(item.publishedAt, now)}
                </p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="headline mt-1 block text-[1.15rem] leading-snug"
                >
                  {item.title} <span className="text-accent">↗</span>
                </a>
                {item.summary && <p className="mt-1 text-[0.98rem] leading-relaxed text-ink-soft">{item.summary}</p>}
              </li>
            ))}
          </ol>
        </section>

        <p className="meta mt-8 italic">
          This briefing was written by Claude from the coverage above. Check the original reporting before relying on
          it.
        </p>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-[76rem]">
          <SectionHeading title={`More in ${CATEGORY_LABELS[story.category]}`} href={`/topic/${story.category}`} />
          <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((s) => (
              <div key={s.id} className="py-4">
                <CompactStory story={s} now={now} showCategory={false} withImage />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
