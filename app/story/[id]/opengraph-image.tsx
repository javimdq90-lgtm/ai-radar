import { SUBLINE, TAGLINE } from "@/components/brand";
import { storyTitle } from "@/components/story";
import { CATEGORY_HEX } from "@/lib/category";
import { SHARE_SIZE, shareCard } from "@/lib/share-card";
import { getStory } from "@/lib/site-data";
import { CATEGORY_LABELS } from "@/lib/types";

export const alt = "Context Window briefing";
export const size = SHARE_SIZE;
export const contentType = "image/png";

/** The story's link preview: BRIEFING (when it has one), the topic in its colour, the headline. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const data = await getStory((await params).id);
  if (!data) return shareCard({ tagline: TAGLINE, subline: SUBLINE });
  const { story } = data;
  return shareCard({
    headline: storyTitle(story),
    topic: CATEGORY_LABELS[story.category],
    briefing: Boolean(story.brief),
    color: CATEGORY_HEX[story.category],
  });
}
