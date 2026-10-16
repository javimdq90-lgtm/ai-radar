import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompactHeader } from "@/components/brand";
import { NewsletterBox } from "@/components/newsletter";
import { StoryRow } from "@/components/story";
import { catStyle } from "@/lib/category";
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
    <>
      <CompactHeader active={category} />
      <div className="flex flex-wrap gap-14 pb-16 pt-12">
        <main className="min-w-0 max-w-[760px] flex-[999_1_560px]">
          <h1
            style={catStyle(category)}
            className="m-0 flex items-center gap-4 font-display text-[clamp(38px,6vw,64px)] font-normal leading-[1.02]"
          >
            <span className="dot !h-3 !w-3" aria-hidden />
            {CATEGORY_LABELS[category]}
          </h1>
          <p className="mb-0 mt-2 text-[13px] text-muted">Newest first</p>
          {stories.length ? (
            <div className="mt-4 border-t-2 border-text">
              {stories.map((s) => (
                <StoryRow key={s.id} story={s} now={now} kicker={Boolean(s.brief)} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-muted">Nothing here yet.</p>
          )}
        </main>
        <aside className="min-w-0 flex-[1_1_300px]">
          <NewsletterBox latestIssue={issues[0] ?? null} />
        </aside>
      </div>
    </>
  );
}
