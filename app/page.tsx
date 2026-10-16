import type { Metadata } from "next";
import Link from "next/link";
import { Masthead, SectionNav, TopBar } from "@/components/brand";
import { FrontTabs } from "@/components/front-tabs";
import { NewsletterBox } from "@/components/newsletter";
import { LatestItem, LeadStory, StoryCard, StoryRow, ThumbRow } from "@/components/story";
import { catStyle } from "@/lib/category";
import { OG_BASE } from "@/lib/site";
import { getFrontPage } from "@/lib/site-data";
import { CATEGORY_LABELS, type Story } from "@/lib/types";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { ...OG_BASE, type: "website", url: "/" } };

/** Ten stories in falling sizes: a feature beside a stacked pair, a row of three, then thumbnail rows. */
function TopStories({ stories, now }: { stories: Story[]; now: string }) {
  const [feature, ...rest] = stories;
  const pair = rest.slice(0, 2);
  const row = rest.slice(2, 5);
  const thumbs = rest.slice(5);
  if (!feature) return null;
  return (
    <section aria-label="Top stories" className="flex flex-col gap-10">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <StoryCard story={feature} now={now} size="large" />
        {pair.length > 0 && (
          <div className="flex flex-col gap-8 md:border-l md:border-line md:pl-8">
            {pair.map((s) => (
              <StoryCard key={s.id} story={s} now={now} size="small" />
            ))}
          </div>
        )}
      </div>
      {row.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(230px,100%),1fr))] gap-8 border-t border-line pt-8">
          {row.map((s) => (
            <StoryCard key={s.id} story={s} now={now} />
          ))}
        </div>
      )}
      {thumbs.length > 0 && (
        <div className="grid gap-x-8 border-t border-line md:grid-cols-2">
          {thumbs.map((s) => (
            <ThumbRow key={s.id} story={s} now={now} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function Home() {
  const { lead, top, latest, wire, sections, latestIssue, generatedAt: now } = await getFrontPage();

  return (
    <>
      <TopBar />
      <Masthead />
      <SectionNav />

      {!lead ? (
        <p className="py-24 text-center text-muted">
          No stories yet. They appear after the first ingest run (<code>npm run ingest</code>).
        </p>
      ) : (
        <>
          {/* Main + rail: the rail drops below the main column on narrow screens. */}
          <div className="flex flex-wrap gap-12 pb-14 pt-8">
            <main className="min-w-0 flex-[999_1_560px]">
              <FrontTabs
                top={
                  <div className="flex flex-col gap-12">
                    <LeadStory story={lead} now={now} />
                    <TopStories stories={top} now={now} />
                  </div>
                }
                latest={
                  <div className="border-t-2 border-text">
                    {latest.map((s) => (
                      <StoryRow key={s.id} story={s} now={now} />
                    ))}
                  </div>
                }
              />
            </main>

            <aside aria-label="Latest" className="min-w-0 flex-[1_1_300px]">
              <h2 className="rail-heading">Latest</h2>
              <ol className="m-0 list-none p-0">
                {wire.map((s) => (
                  <LatestItem key={s.id} story={s} now={now} />
                ))}
              </ol>
            </aside>
          </div>

          <NewsletterBox variant="band" latestIssue={latestIssue} />

          {/* What didn't make the top, by section */}
          {sections.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-x-10 gap-y-12 pb-16 pt-14">
              {sections.map(({ category, stories }) => (
                <section key={category} aria-labelledby={`section-${category}`} style={catStyle(category)} className="min-w-0">
                  <div className="flex items-baseline justify-between border-b-2 border-cat pb-2.5">
                    <h2 id={`section-${category}`} className="label m-0 flex items-center gap-2 text-cat">
                      <span className="dot" aria-hidden />
                      {CATEGORY_LABELS[category]}
                    </h2>
                    <Link href={`/topic/${category}`} className="text-[13px] text-muted">
                      See all →
                    </Link>
                  </div>
                  {stories.map((s) => (
                    <StoryRow key={s.id} story={s} now={now} kicker={Boolean(s.brief)} />
                  ))}
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
