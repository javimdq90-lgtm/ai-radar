import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { StoryRow } from "@/components/story";
import { catColor } from "@/lib/category";
import { getIssues, getTopic } from "@/lib/site-data";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/types";

const isCategory = (value: string): value is Category => (CATEGORIES as readonly string[]).includes(value);

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/topic/[category]">): Promise<Metadata> {
  const { category } = await params;
  return { title: isCategory(category) ? CATEGORY_LABELS[category] : "Not found" };
}

export default async function TopicPage({ params }: PageProps<"/topic/[category]">) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const [{ stories, generatedAt: now }, issues] = await Promise.all([getTopic(category), getIssues()]);

  return (
    <PageShell
      active={category}
      title={
        <span className="flex items-center gap-4">
          <span className="h-3.5 w-3.5 shrink-0" style={{ background: catColor(category) }} aria-hidden />
          {CATEGORY_LABELS[category]}
        </span>
      }
      intro="Newest first."
      latestIssue={issues[0] ?? null}
    >
      {stories.length ? (
        <div className="border-t-2 border-fg">
          {stories.map((s) => (
            <StoryRow key={s.id} story={s} now={now} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-muted">Nothing here yet.</p>
      )}
    </PageShell>
  );
}
