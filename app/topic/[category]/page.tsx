import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryCard } from "@/components/story-card";
import { getTopic } from "@/lib/site-data";
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
  const stories = await getTopic(category);

  return (
    <>
      <h1 className="pt-6 font-serif text-3xl font-bold">{CATEGORY_LABELS[category]}</h1>
      {stories.length ? (
        <div className="divide-y divide-rule">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} compact />
          ))}
        </div>
      ) : (
        <p className="py-10 text-muted">Nothing here yet.</p>
      )}
    </>
  );
}
