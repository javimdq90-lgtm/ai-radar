import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompactStory } from "@/components/story";
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
  const { stories, generatedAt: now } = await getTopic(category);

  return (
    <div className="mx-auto max-w-3xl pt-8">
      <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">{CATEGORY_LABELS[category]}</h1>
      <p className="meta mt-2">Newest first</p>
      {stories.length ? (
        <div className="mt-4 divide-y divide-rule border-t-[3px] border-ink">
          {stories.map((s) => (
            <div key={s.id} className="py-5">
              <CompactStory story={s} now={now} withSummary />
            </div>
          ))}
        </div>
      ) : (
        <p className="py-10 text-muted">Nothing here yet.</p>
      )}
    </div>
  );
}
