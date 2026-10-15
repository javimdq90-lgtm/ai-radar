import Link from "next/link";
import { CardStory, CompactStory, LeadStory, RowStory, SectionHeading, WireItem } from "@/components/story";
import { fmtDate } from "@/lib/format";
import { getFrontPage } from "@/lib/site-data";
import { CATEGORY_LABELS } from "@/lib/types";

export default async function Home() {
  const { lead, secondary, more, wire, sections, latestIssue, generatedAt: now } = await getFrontPage();

  if (!lead) {
    return (
      <p className="py-24 text-center text-muted">
        No stories yet. They appear after the first ingest run (<code>npm run ingest</code>).
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-x-10 gap-y-12 pt-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* Main column: lead, then four cards, then more top stories */}
        <div className="min-w-0">
          <LeadStory story={lead} now={now} />

          {secondary.length > 0 && (
            <div className="mt-12 grid gap-x-8 gap-y-10 border-t-[3px] border-ink pt-7 sm:grid-cols-2">
              {secondary.map((s) => (
                <CardStory key={s.id} story={s} now={now} />
              ))}
            </div>
          )}

          {more.length > 0 && (
            <section className="mt-12">
              <SectionHeading title="More top stories" />
              <div className="divide-y divide-rule">
                {more.map((s) => (
                  <div key={s.id} className="py-5">
                    <RowStory story={s} now={now} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: newsletter, then everything else newest first */}
        <aside className="min-w-0 lg:border-l lg:border-rule lg:pl-8">
          {latestIssue && (
            <Link href={`/issues/${latestIssue.number}`} className="group mb-8 block bg-ink p-5 text-paper">
              <p className="kicker opacity-70">Newsletter · #{latestIssue.number}</p>
              <p className="mt-2 font-serif text-xl font-semibold leading-snug group-hover:underline">
                {latestIssue.subject}
              </p>
              <p className="meta mt-2 !text-paper opacity-70">{fmtDate(latestIssue.date)} · Read the issue →</p>
            </Link>
          )}
          <div>
            <SectionHeading title="Latest" />
            <ol className="divide-y divide-rule">
              {wire.map((s) => (
                <WireItem key={s.id} story={s} now={now} />
              ))}
            </ol>
          </div>
        </aside>
      </div>

      {/* Sections: what didn't make the top, by topic */}
      {sections.length > 0 && (
        <div className="mt-16 grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {sections.map(({ category, stories }) => (
            <section key={category} className="min-w-0">
              <SectionHeading title={CATEGORY_LABELS[category]} href={`/topic/${category}`} />
              <div className="divide-y divide-rule">
                {stories.map((s, i) => (
                  <div key={s.id} className="py-4">
                    <CompactStory story={s} now={now} showCategory={false} withImage={i === 0} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
