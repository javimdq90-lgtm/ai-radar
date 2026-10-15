import type { Item, Story } from "./types";

const HOUR = 3_600_000;

/** Score halves every this many hours, so a big story stays up for about a day. */
const HALF_LIFE_HOURS = 18;

/**
 * Groups enriched items into stories and ranks them. Ranking: Claude's importance,
 * plus a bump when several sources covered it, decayed by age.
 */
export function buildStories(items: Item[], now = new Date()): Story[] {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    if (item.irrelevant || !item.enrichedAt) continue;
    const key = item.storyId ?? item.id;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const stories: Story[] = [];
  for (const [id, group] of groups) {
    group.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
    // The item that opened the story leads it; later coverage is listed under it.
    const lead = group.find((i) => i.id === id) ?? group[0];
    const sourceCount = new Set(group.map((i) => i.sourceId)).size;
    const importance = Math.max(...group.map((i) => i.importance ?? 1));
    const firstSeen = group[0].publishedAt;
    const ageHours = Math.max(0, (now.getTime() - new Date(firstSeen).getTime()) / HOUR);
    const coverage = Math.min(1.5, Math.log2(sourceCount) * 0.75);
    stories.push({
      id,
      lead,
      items: group,
      sourceCount,
      category: lead.category ?? "products",
      importance,
      firstSeen,
      score: (importance + coverage) * Math.pow(0.5, ageHours / HALF_LIFE_HOURS),
    });
  }
  return stories.sort((a, b) => b.score - a.score);
}

export const byRecency = (a: Story, b: Story) => b.firstSeen.localeCompare(a.firstSeen);
