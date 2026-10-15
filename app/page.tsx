import { StoryCard } from "@/components/story-card";
import { fmtDateTime } from "@/lib/format";
import { getFrontPage } from "@/lib/site-data";

export default async function Home() {
  const { top, latest, generatedAt } = await getFrontPage();

  if (!top.length) {
    return (
      <p className="py-16 text-center text-muted">
        No stories yet. They appear after the first ingest run (<code>npm run ingest</code>).
      </p>
    );
  }

  return (
    <>
      <section>
        <h2 className="pt-6 text-xs font-semibold uppercase tracking-wider text-muted">Top stories</h2>
        <div className="divide-y divide-rule">
          {top.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      </section>
      {latest.length > 0 && (
        <section className="mt-6 border-t-2 border-fg">
          <h2 className="pt-6 text-xs font-semibold uppercase tracking-wider text-muted">Everything else, newest first</h2>
          <div className="divide-y divide-rule">
            {latest.map((s) => (
              <StoryCard key={s.id} story={s} compact />
            ))}
          </div>
        </section>
      )}
      <p className="mt-10 text-xs text-muted">Updated {fmtDateTime(generatedAt)}</p>
    </>
  );
}
