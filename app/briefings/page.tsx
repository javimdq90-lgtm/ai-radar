import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { StoryRow } from "@/components/story";
import { getBriefings, getIssues } from "@/lib/site-data";

export const metadata: Metadata = { title: "Briefings", alternates: { canonical: "/briefings" } };

export default async function BriefingsPage() {
  const [{ stories, generatedAt: now }, issues] = await Promise.all([getBriefings(), getIssues()]);
  return (
    <PageShell
      active="briefings"
      title="Briefings"
      intro="The biggest stories, briefed from all the coverage at once: what happened, why it matters, what to watch, and every source."
      latestIssue={issues[0] ?? null}
    >
      {stories.length ? (
        <div className="border-t-2 border-fg">
          {stories.map((s) => (
            <StoryRow key={s.id} story={s} now={now} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-muted">No briefings yet.</p>
      )}
    </PageShell>
  );
}
