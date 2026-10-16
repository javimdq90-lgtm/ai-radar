import type { Brief, Item, Story } from "./types";

const HOUR = 3_600_000;

/** Score halves every this many hours, so a major story leads for about a day, not three. */
const HALF_LIFE_HOURS = 12;

/**
 * Groups enriched items into stories and ranks them. Each importance point doubles the
 * weight, so a 5 outranks a fresh 3 for about a day; each extra source adds 30%
 * (capped at 2.5x); the total halves every HALF_LIFE_HOURS.
 */
export function buildStories(items: Item[], briefs: Record<string, Brief> = {}, now = new Date()): Story[] {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    if (item.irrelevant || !item.enrichedAt) continue;
    const key = item.storyId ?? item.id;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const stories: Story[] = [];
  for (const [id, group] of groups) {
    group.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
    // Lead with the item Claude rated highest (usually the main announcement), earliest on ties.
    const lead = group.reduce((best, i) => ((i.importance ?? 1) > (best.importance ?? 1) ? i : best));
    const sourceCount = new Set(group.map((i) => i.sourceId)).size;
    const importance = Math.max(...group.map((i) => i.importance ?? 1));
    const firstSeen = group[0].publishedAt;
    const ageHours = Math.max(0, (now.getTime() - new Date(firstSeen).getTime()) / HOUR);
    const coverage = Math.min(2.5, 1 + 0.3 * (sourceCount - 1));
    stories.push({
      id,
      lead,
      items: group,
      sourceCount,
      category: lead.category ?? "products",
      importance,
      firstSeen,
      score: 2 ** importance * coverage * 0.5 ** (ageHours / HALF_LIFE_HOURS),
      image: lead.image ?? group.find((i) => i.image)?.image,
      brief: briefs[id],
    });
  }
  return stories.sort((a, b) => b.score - a.score);
}

export const byRecency = (a: Story, b: Story) => b.firstSeen.localeCompare(a.firstSeen);
