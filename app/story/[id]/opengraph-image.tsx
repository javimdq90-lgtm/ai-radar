import { storyTitle } from "@/components/story";
import { CATEGORY_HEX } from "@/lib/category";
import { SHARE_SIZE, shareCard } from "@/lib/share-card";
import { getStory } from "@/lib/site-data";
import { CATEGORY_LABELS } from "@/lib/types";

export const alt = "Context Window briefing";
export const size = SHARE_SIZE;
export const contentType = "image/png";

/** The briefing's link preview: category and headline in the category colour. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const data = await getStory((await params).id);
  if (!data) return shareCard({});
  const { story } = data;
  return shareCard({
    headline: storyTitle(story),
    kicker: `${CATEGORY_LABELS[story.category]} · Briefing`,
    color: CATEGORY_HEX[story.category],
  });
}
