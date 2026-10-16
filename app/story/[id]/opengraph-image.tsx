import { SUBLINE, TAGLINE } from "@/components/brand";
import { storyTitle } from "@/components/story";
import { CATEGORY_HEX } from "@/lib/category";
import { SHARE_SIZE, shareCard } from "@/lib/share-card";
import { localImage, remoteImage, SHARE_HERO, shareFallbackFor } from "@/lib/share-image";
import { getStory } from "@/lib/site-data";
import { CATEGORY_LABELS } from "@/lib/types";

export const alt = "Context Window briefing";
export const size = SHARE_SIZE;
export const contentType = "image/png";

/**
 * The story's link preview: BRIEFING (when it has one), the topic in its colour and the headline,
 * over the article's own image, or the story's brand image when that can't be used.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const data = await getStory((await params).id);
  if (!data) return shareCard({ tagline: TAGLINE, subline: SUBLINE, image: SHARE_HERO && localImage(SHARE_HERO) });
  const { story } = data;
  const fallback = shareFallbackFor(story.id);
  const image = (story.image ? await remoteImage(story.image) : null) ?? (fallback ? localImage(fallback) : null);
  return shareCard({
    headline: storyTitle(story),
    topic: CATEGORY_LABELS[story.category],
    briefing: Boolean(story.brief),
    color: CATEGORY_HEX[story.category],
    image,
  });
}
